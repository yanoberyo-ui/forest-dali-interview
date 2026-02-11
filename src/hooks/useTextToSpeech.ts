"use client";

import { useRef, useState, useCallback, useEffect } from "react";

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const voicesLoadedRef = useRef(false);
  const cachedVoicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const unlockedRef = useRef(false);

  // Preload voices (needed for all browsers, especially mobile)
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        cachedVoicesRef.current = voices;
        voicesLoadedRef.current = true;
      }
    };

    loadVoices();
    speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    };
  }, []);

  // Create persistent audio element for cloud TTS
  useEffect(() => {
    if (typeof window === "undefined") return;

    const audio = new Audio();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (audio as any).playsInline = true;
    audioRef.current = audio;

    // Unlock audio on EVERY user interaction (needed for iOS Safari)
    // iOS requires the first speechSynthesis.speak() to be in a user gesture context.
    // After that, subsequent calls work without gestures.
    const unlock = () => {
      if (unlockedRef.current) return;
      unlockedRef.current = true;

      // Unlock HTML5 Audio
      audio.src =
        "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAABhkVWPloAAAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAABhkVWPloAAAAAAAAAAAAAAAAA";
      audio.play().catch(() => {});

      // Unlock Web Speech API - speak a real character to truly unlock on iOS
      if ("speechSynthesis" in window) {
        speechSynthesis.cancel();
        const warmup = new SpeechSynthesisUtterance(".");
        warmup.volume = 0.01; // Nearly silent but not 0 (iOS ignores volume=0)
        warmup.rate = 2;
        warmup.lang = "ja-JP";
        speechSynthesis.speak(warmup);
      }

      console.log("[TTS] Audio unlocked via user gesture");
    };

    // Listen for ALL click/touch events, not just once
    document.addEventListener("touchstart", unlock);
    document.addEventListener("click", unlock);

    return () => {
      document.removeEventListener("touchstart", unlock);
      document.removeEventListener("click", unlock);
      audio.pause();
      audio.src = "";
    };
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      speechSynthesis.cancel();
    }
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const getJapaneseVoice = useCallback((): SpeechSynthesisVoice | null => {
    const voices =
      cachedVoicesRef.current.length > 0
        ? cachedVoicesRef.current
        : speechSynthesis.getVoices();

    // Priority: high-quality Japanese voices
    return (
      voices.find((v) => v.name.includes("Google 日本語")) ||
      voices.find((v) => v.name.includes("Kyoko")) ||
      voices.find((v) => v.name.includes("O-Ren")) ||
      voices.find((v) => v.name.includes("Hattori")) ||
      voices.find((v) => v.lang === "ja-JP") ||
      voices.find((v) => v.lang.startsWith("ja")) ||
      null
    );
  }, []);

  // iOS Safari keepalive: speechSynthesis pauses after ~15s without this
  const keepAliveRef = useRef<NodeJS.Timeout | null>(null);
  const startKeepAlive = useCallback(() => {
    if (keepAliveRef.current) clearInterval(keepAliveRef.current);
    keepAliveRef.current = setInterval(() => {
      if (speechSynthesis.speaking && !speechSynthesis.paused) {
        speechSynthesis.pause();
        speechSynthesis.resume();
      }
    }, 10000);
  }, []);

  const stopKeepAlive = useCallback(() => {
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
  }, []);

  const speakWithWebSpeechAPI = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window))
        return;

      speechSynthesis.cancel();
      stopKeepAlive();

      // iOS Safari has a bug where long text causes speechSynthesis to stop.
      // Split into chunks of ~150 characters at sentence boundaries.
      const chunks = splitTextIntoChunks(text, 150);

      let currentIndex = 0;
      setIsSpeaking(true);
      startKeepAlive();

      const speakNext = () => {
        if (currentIndex >= chunks.length) {
          stopKeepAlive();
          setIsSpeaking(false);
          return;
        }

        const utterance = new SpeechSynthesisUtterance(chunks[currentIndex]);
        utterance.lang = "ja-JP";
        utterance.rate = 1.05;
        utterance.pitch = 1.1;
        utterance.volume = 1.0;

        const voice = getJapaneseVoice();
        if (voice) {
          utterance.voice = voice;
        }

        utterance.onend = () => {
          currentIndex++;
          // Small delay between chunks for iOS stability
          setTimeout(speakNext, 50);
        };

        utterance.onerror = (e) => {
          // "interrupted" is expected when stop() is called
          if (e.error !== "interrupted" && e.error !== "canceled") {
            console.warn("[TTS] Web Speech API error:", e.error, "chunk:", currentIndex);
            // Try next chunk on error
            currentIndex++;
            setTimeout(speakNext, 100);
            return;
          }
          stopKeepAlive();
          setIsSpeaking(false);
        };

        speechSynthesis.speak(utterance);
      };

      speakNext();
    },
    [getJapaneseVoice, startKeepAlive, stopKeepAlive]
  );

  const speak = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      stop();

      // On mobile, prefer Web Speech API directly to avoid the async fetch
      // breaking iOS Safari's user gesture requirement.
      const isMobile =
        typeof navigator !== "undefined" &&
        /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      // Try cloud TTS first on desktop, or if OpenAI key is likely configured
      if (!isMobile) {
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

          const audio = audioRef.current;
          if (!audio) {
            throw new Error("Audio element not initialized");
          }

          audio.onended = () => {
            setIsSpeaking(false);
            URL.revokeObjectURL(url);
          };

          audio.onerror = () => {
            console.warn("[TTS] Audio playback error, falling back");
            setIsSpeaking(false);
            URL.revokeObjectURL(url);
            speakWithWebSpeechAPI(text);
          };

          audio.src = url;
          await audio.play();
          return;
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") {
            setIsSpeaking(false);
            return;
          }
          console.warn("[TTS] Cloud TTS failed, using Web Speech API:", err);
        }
      }

      // Mobile or cloud TTS failed: use Web Speech API directly
      speakWithWebSpeechAPI(text);
    },
    [stop, speakWithWebSpeechAPI]
  );

  return {
    isSpeaking,
    isSupported: true,
    speak,
    stop,
  };
}

/**
 * Split text into chunks at sentence boundaries (。、！、？、\n)
 * to avoid iOS Safari's speechSynthesis bug with long text.
 */
function splitTextIntoChunks(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    // Find the best split point within maxLength
    let splitAt = -1;
    const searchArea = remaining.slice(0, maxLength);

    // Look for sentence-ending punctuation
    for (const sep of ["。", "！", "？", "?\n", "\n", "、"]) {
      const idx = searchArea.lastIndexOf(sep);
      if (idx > 0) {
        splitAt = idx + sep.length;
        break;
      }
    }

    // If no good split point, just split at maxLength
    if (splitAt <= 0) {
      splitAt = maxLength;
    }

    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt);
  }

  return chunks.filter((c) => c.trim().length > 0);
}
