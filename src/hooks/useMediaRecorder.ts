"use client";

import { useRef, useState, useCallback } from "react";

export function useMediaRecorder() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
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
    (existingStream?: MediaStream, mixedAudioStream?: MediaStream) => {
      const s = existingStream || stream;
      if (!s) {
        setError("カメラストリームがありません");
        return;
      }

      chunksRef.current = [];

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

      const recorder = new MediaRecorder(recordingStream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    },
    [stream]
  );

  const stopRecording = useCallback((): Promise<Blob> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        setIsRecording(false);
        resolve(blob);
        return;
      }

      // Timeout: iOS Safari sometimes doesn't fire onstop
      const timeout = setTimeout(() => {
        console.warn("MediaRecorder onstop timeout - resolving with available chunks");
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
        setIsRecording(false);
        resolve(blob);
      }, 3000);

      recorder.onstop = () => {
        clearTimeout(timeout);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
        setIsRecording(false);
        resolve(blob);
      };

      try {
        recorder.stop();
      } catch (e) {
        console.warn("MediaRecorder.stop() error:", e);
        clearTimeout(timeout);
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        setIsRecording(false);
        resolve(blob);
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
