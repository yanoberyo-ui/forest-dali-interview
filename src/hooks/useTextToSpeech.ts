"use client";

import { useRef, useState, useCallback, useEffect } from "react";

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Create a persistent audio element and AudioContext for Safari compatibility
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Create a persistent audio element
    const audio = new Audio();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (audio as any).playsInline = true;
    audioRef.current = audio;

    // Unlock audio on first user interaction (needed for iOS Safari)
    const unlock = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      if (audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume();
      }
      // Play silent audio to unlock
      audio.src = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAABhkVWPloAAAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAABhkVWPloAAAAAAAAAAAAAAAAA";
      audio.play().catch(() => {});
      document.removeEventListener("touchstart", unlock);
      document.removeEventListener("click", unlock);
    };
    document.addEventListener("touchstart", unlock, { once: true });
    document.addEventListener("click", unlock, { once: true });

    return () => {
      document.removeEventListener("touchstart", unlock);
      document.removeEventListener("click", unlock);
      audio.pause();
      audio.src = "";
    };
  }, []);

  const stop = useCallback(() => {
    // Stop cloud TTS audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
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

        console.log("[TTS] Fetching audio from /api/tts...");
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`TTS API returned ${response.status}`);
        }

        console.log("[TTS] Audio received, playing...");
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        // Use the persistent audio element for Safari compatibility
        const audio = audioRef.current;
        if (!audio) {
          throw new Error("Audio element not initialized");
        }

        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(url);
        };

        audio.onerror = () => {
          console.warn("[TTS] Audio playback error");
          setIsSpeaking(false);
          URL.revokeObjectURL(url);
        };

        audio.src = url;
        await audio.play();
        console.log("[TTS] Playing OpenAI TTS audio");
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
