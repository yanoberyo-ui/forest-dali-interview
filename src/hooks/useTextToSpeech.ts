"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface UseTextToSpeechOptions {
  /** When provided, cloud TTS audio data is routed through this callback
   *  (e.g., for AudioContext mixing into a recording) instead of HTMLAudioElement. */
  onCloudAudioData?: (arrayBuffer: ArrayBuffer) => Promise<void>;
}

export function useTextToSpeech(options?: UseTextToSpeechOptions) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const voicesLoadedRef = useRef(false);
  const cachedVoicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const unlockedRef = useRef(false);

  // Stable ref for onCloudAudioData so callbacks don't re-create on every render
  const onCloudAudioDataRef = useRef(options?.onCloudAudioData);
  useEffect(() => {
    onCloudAudioDataRef.current = options?.onCloudAudioData;
  }, [options?.onCloudAudioData]);

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
          setTimeout(speakNext, 50);
        };

        utterance.onerror = (e) => {
          if (e.error !== "interrupted" && e.error !== "canceled") {
            console.warn("[TTS] Web Speech API error:", e.error, "chunk:", currentIndex);
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

  /**
   * Try cloud TTS via /api/tts endpoint.
   * If onCloudAudioData callback is set, routes audio through AudioContext (for recording).
   * Otherwise, plays via HTMLAudioElement.
   * Returns true on success, false on failure (caller should fall back to Web Speech API).
   */
  const speakWithCloudTTS = useCallback(
    async (text: string): Promise<boolean> => {
      try {
        abortControllerRef.current = new AbortController();
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
          signal: abortControllerRef.current.signal,
        });

        if (!res.ok) return false;

        const arrayBuffer = await res.arrayBuffer();

        // If audio mixer callback is provided, route through AudioContext for recording capture
        if (onCloudAudioDataRef.current) {
          setIsSpeaking(true);
          try {
            await onCloudAudioDataRef.current(arrayBuffer);
          } finally {
            setIsSpeaking(false);
          }
          return true;
        }

        // Default: play via HTMLAudioElement
        const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });
        const url = URL.createObjectURL(blob);
        const audio = audioRef.current;
        if (!audio) {
          URL.revokeObjectURL(url);
          return false;
        }

        audio.src = url;
        setIsSpeaking(true);

        audio.onended = () => {
          URL.revokeObjectURL(url);
          setIsSpeaking(false);
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          setIsSpeaking(false);
        };

        await audio.play();
        return true;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
          // Intentional abort (stop() was called)
          return true;
        }
        console.warn("[TTS] Cloud TTS failed, falling back to Web Speech API:", e);
        return false;
      }
    },
    []
  );

  const speak = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      if (isSpeaking) {
        stop();
      } else {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          speechSynthesis.cancel();
        }
      }

      // Try cloud TTS first (more reliable on mobile)
      const cloudSuccess = await speakWithCloudTTS(text);
      if (!cloudSuccess) {
        // Fall back to Web Speech API
        speakWithWebSpeechAPI(text);
      }
    },
    [stop, speakWithCloudTTS, speakWithWebSpeechAPI, isSpeaking]
  );

  return {
    isSpeaking,
    isSupported: true,
    speak,
    stop,
    audioRef,
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

    let splitAt = -1;
    const searchArea = remaining.slice(0, maxLength);

    for (const sep of ["。", "！", "？", "?\n", "\n", "、"]) {
      const idx = searchArea.lastIndexOf(sep);
      if (idx > 0) {
        splitAt = idx + sep.length;
        break;
      }
    }

    if (splitAt <= 0) {
      splitAt = maxLength;
    }

    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt);
  }

  return chunks.filter((c) => c.trim().length > 0);
}
