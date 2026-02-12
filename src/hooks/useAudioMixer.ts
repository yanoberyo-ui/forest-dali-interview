"use client";

import { useRef, useCallback } from "react";

export function useAudioMixer() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  /**
   * Initialize the audio mixer with a microphone stream.
   * Creates an AudioContext and MediaStreamDestination that mixes:
   *   1. Microphone audio (from getUserMedia)
   *   2. TTS audio (added later via playTTSAudio)
   *
   * Returns a MediaStream with the mixed audio track.
   */
  const initMixer = useCallback((micStream: MediaStream): MediaStream => {
    const ctx = new AudioContext();
    audioContextRef.current = ctx;

    const destination = ctx.createMediaStreamDestination();
    destinationRef.current = destination;

    // Connect microphone audio to the mixer
    const micSource = ctx.createMediaStreamSource(micStream);
    micSourceRef.current = micSource;
    micSource.connect(destination);

    return destination.stream;
  }, []);

  /**
   * Play TTS audio through the AudioContext so it gets captured in the recording.
   * The audio plays through both:
   *   - The mixer destination (for recording capture)
   *   - The AudioContext destination (for speaker output)
   *
   * Returns a promise that resolves when playback ends.
   */
  const playTTSAudio = useCallback(
    async (arrayBuffer: ArrayBuffer): Promise<void> => {
      const ctx = audioContextRef.current;
      const destination = destinationRef.current;
      if (!ctx || !destination) {
        console.warn("[AudioMixer] Not initialized, skipping TTS audio playback");
        return;
      }

      // Resume AudioContext if suspended (happens on some mobile browsers)
      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;

      // Connect to recording destination (for capture)
      source.connect(destination);
      // Connect to speaker output (so user can hear it)
      source.connect(ctx.destination);

      return new Promise<void>((resolve) => {
        source.onended = () => resolve();
        source.start(0);
      });
    },
    []
  );

  const cleanup = useCallback(() => {
    micSourceRef.current?.disconnect();
    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
    destinationRef.current = null;
    micSourceRef.current = null;
  }, []);

  return {
    initMixer,
    playTTSAudio,
    cleanup,
  };
}
