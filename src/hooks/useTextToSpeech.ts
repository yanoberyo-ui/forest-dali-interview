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

    // Unlock audio on user interaction (needed for iOS Safari)
    // iOS requires speechSynthesis.speak() to be called once in a user gesture context.
    // We do a minimal unlock and mark it done so speak() knows it's safe.
    const unlock = () => {
      if (unlockedRef.current) return;
      unlockedRef.current = true;

      // Unlock HTML5 Audio
      audio.src =
        "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAABhkVWPloAAAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAABhkVWPloAAAAAAAAAAAAAAAAA";
      audio.play().catch(() => {});

      // Unlock Web Speech API with minimal silent utterance
      if ("speechSynthesis" in window) {
        const warmup = new SpeechSynthesisUtterance("");
        warmup.volume = 0;
        warmup.lang = "ja-JP";
        speechSynthesis.speak(warmup);
        // Cancel immediately so it doesn't block the queue
        setTimeout(() => speechSynthesis.cancel(), 50);
      }

      console.log("[TTS] Audio unlocked via user gesture");
    };

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

      // Cancel any currently playing speech, but don't cancel if nothing is playing
      // (avoids interfering with the unlock warmup on iOS)
      if (isSpeaking) {
        stop();
      } else {
        // Just make sure speechSynthesis queue is clear
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          speechSynthesis.cancel();
        }
      }

      // Always use Web Speech API first for instant response.
      // It's available on all modern browsers and starts immediately
      // without network latency.
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
