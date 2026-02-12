"use client";

import { useRef, useState } from "react";

const PLAYBACK_RATES = [0.5, 1, 1.5, 2];

interface VideoPlayerProps {
  src: string;
}

export function VideoPlayer({ src }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playbackRate, setPlaybackRate] = useState(1);

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  return (
    <div>
      <video
        ref={videoRef}
        controls
        className="w-full"
        preload="metadata"
      >
        <source src={src} type="video/webm" />
        <source src={src} type="video/mp4" />
        お使いのブラウザは動画再生に対応していません。
      </video>
      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-b-2xl">
        <span className="text-xs text-foreground/50 mr-1">再生速度:</span>
        {PLAYBACK_RATES.map((rate) => (
          <button
            key={rate}
            onClick={() => handleRateChange(rate)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              playbackRate === rate
                ? "bg-primary text-white"
                : "bg-white text-foreground/60 hover:bg-primary/10"
            }`}
          >
            {rate}x
          </button>
        ))}
      </div>
    </div>
  );
}
