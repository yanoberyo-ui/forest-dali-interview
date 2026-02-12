"use client";

import { useRef, useState, useCallback } from "react";

export function useMediaRecorder() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Chunk upload state
  const interviewIdRef = useRef<string | null>(null);
  const chunkIndexRef = useRef(0);
  const uploadQueueRef = useRef<Blob[]>([]);
  const isUploadingChunkRef = useRef(false);
  const uploadFailedRef = useRef(false);

  const processUploadQueue = useCallback(async () => {
    if (isUploadingChunkRef.current || uploadFailedRef.current) return;
    if (uploadQueueRef.current.length === 0) return;
    if (!interviewIdRef.current) return;

    isUploadingChunkRef.current = true;
    const chunk = uploadQueueRef.current.shift()!;
    const idx = chunkIndexRef.current++;

    try {
      const formData = new FormData();
      formData.append("chunk", chunk, `chunk_${idx}.webm`);
      formData.append("interviewId", interviewIdRef.current);
      formData.append("chunkIndex", idx.toString());

      const res = await fetch("/api/video/upload-chunk", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(`Chunk upload failed: ${res.status}`);
    } catch (e) {
      console.warn("Chunk upload error, will include in final upload:", e);
      // Put chunk back for final blob fallback
      uploadFailedRef.current = true;
    }

    isUploadingChunkRef.current = false;
    // Process next chunk in queue
    if (uploadQueueRef.current.length > 0 && !uploadFailedRef.current) {
      processUploadQueue();
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      return mediaStream;
    } catch (err) {
      setError("カメラ・マイクへのアクセスが許可されませんでした");
      throw err;
    }
  }, []);

  const startRecording = useCallback(
    (existingStream?: MediaStream, mixedAudioStream?: MediaStream, interviewId?: string) => {
      const s = existingStream || stream;
      if (!s) {
        setError("カメラストリームがありません");
        return;
      }

      chunksRef.current = [];
      chunkIndexRef.current = 0;
      uploadQueueRef.current = [];
      isUploadingChunkRef.current = false;
      uploadFailedRef.current = false;
      interviewIdRef.current = interviewId || null;

      // If a mixed audio stream is provided, combine video from camera + audio from mixer
      let recordingStream: MediaStream;
      if (mixedAudioStream && mixedAudioStream.getAudioTracks().length > 0) {
        const videoTrack = s.getVideoTracks()[0];
        const mixedAudioTrack = mixedAudioStream.getAudioTracks()[0];
        if (videoTrack && mixedAudioTrack) {
          recordingStream = new MediaStream([videoTrack, mixedAudioTrack]);
        } else {
          recordingStream = s;
        }
      } else {
        recordingStream = s;
      }

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ? "video/webm;codecs=vp8,opus"
        : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : "video/mp4";

      const recorder = new MediaRecorder(recordingStream, {
        mimeType,
        videoBitsPerSecond: 500_000,
        audioBitsPerSecond: 64_000,
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          // Queue chunk for background upload during recording
          if (interviewIdRef.current && !uploadFailedRef.current) {
            uploadQueueRef.current.push(e.data);
            processUploadQueue();
          }
        }
      };

      // Collect chunks every 5 seconds (larger chunks = fewer requests)
      recorder.start(5000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    },
    [stream, processUploadQueue]
  );

  const stopRecording = useCallback((): Promise<{ blob: Blob; chunksUploaded: boolean }> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      const chunksUploaded = !uploadFailedRef.current && chunkIndexRef.current > 0;

      if (!recorder || recorder.state === "inactive") {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        setIsRecording(false);
        resolve({ blob, chunksUploaded });
        return;
      }

      const timeout = setTimeout(() => {
        console.warn("MediaRecorder onstop timeout - resolving with available chunks");
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
        setIsRecording(false);
        resolve({ blob, chunksUploaded });
      }, 3000);

      recorder.onstop = () => {
        clearTimeout(timeout);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
        setIsRecording(false);
        resolve({ blob, chunksUploaded });
      };

      try {
        recorder.stop();
      } catch (e) {
        console.warn("MediaRecorder.stop() error:", e);
        clearTimeout(timeout);
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        setIsRecording(false);
        resolve({ blob, chunksUploaded });
      }
    });
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  return {
    stream,
    isRecording,
    error,
    videoRef,
    startCamera,
    startRecording,
    stopRecording,
    stopCamera,
  };
}
