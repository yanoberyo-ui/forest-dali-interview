"use client";

import { useRef, useState, useCallback, useEffect } from "react";

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    const supported =
      typeof window !== "undefined" && "speechSynthesis" in window;
    setIsSupported(supported);

    if (!supported) return;

    // Find a good Japanese voice
    const findJapaneseVoice = () => {
      const voices = speechSynthesis.getVoices();
      // Prefer these voices in order
      const preferred = [
        "Google 日本語",
        "Kyoko",
        "O-Ren",
        "Otoya",
        "Hattori",
        "ja-JP",
      ];

      for (const name of preferred) {
        const found = voices.find(
          (v) =>
            v.name.includes(name) ||
            v.lang.startsWith("ja")
        );
        if (found) {
          voiceRef.current = found;
          return;
        }
      }

      // Fallback: any Japanese voice
      const jaVoice = voices.find((v) => v.lang.startsWith("ja"));
      if (jaVoice) {
        voiceRef.current = jaVoice;
      }
    };

    findJapaneseVoice();

    // Voices may load asynchronously
    speechSynthesis.addEventListener("voiceschanged", findJapaneseVoice);
    return () => {
      speechSynthesis.removeEventListener("voiceschanged", findJapaneseVoice);
    };
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || !text.trim()) return;

      // Cancel any ongoing speech
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ja-JP";
      utterance.rate = 1.2;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      if (voiceRef.current) {
        utterance.voice = voiceRef.current;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      utteranceRef.current = utterance;
      speechSynthesis.speak(utterance);
    },
    [isSupported]
  );

  const stop = useCallback(() => {
    if (isSupported) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  return {
    isSpeaking,
    isSupported,
    speak,
    stop,
  };
}
