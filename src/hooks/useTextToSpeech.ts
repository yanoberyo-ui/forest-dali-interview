"use client";

import { useRef, useState, useCallback } from "react";

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    // Stop cloud TTS audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    // Abort any in-flight fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // Also stop Web Speech API fallback if active
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const speakWithWebSpeechAPI = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to find best available Japanese voice
    const voices = speechSynthesis.getVoices();
    const jaVoice =
      voices.find(
        (v) => v.name.includes("Google 日本語") || v.name.includes("Kyoko")
      ) || voices.find((v) => v.lang.startsWith("ja"));

    if (jaVoice) {
      utterance.voice = jaVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthesis.speak(utterance);
  }, []);

  const speak = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      // Stop any currently playing speech
      stop();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        setIsSpeaking(true);

        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`TTS API returned ${response.status}`);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(url);
          audioRef.current = null;
        };

        audio.onerror = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(url);
          audioRef.current = null;
        };

        await audio.play();
      } catch (err) {
        // If aborted, just reset state
        if (err instanceof DOMException && err.name === "AbortError") {
          setIsSpeaking(false);
          return;
        }

        console.warn(
          "[TTS] Cloud TTS failed, falling back to Web Speech API:",
          err
        );
        // Fall back to Web Speech API
        speakWithWebSpeechAPI(text);
      }
    },
    [stop, speakWithWebSpeechAPI]
  );

  return {
    isSpeaking,
    isSupported: true, // Always true since we have Web Speech API fallback
    speak,
    stop,
  };
}
