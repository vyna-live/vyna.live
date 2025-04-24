import { useEffect, useRef, useState } from "react";
import { X, Play, Pause, RotateCcw } from "lucide-react";
import useTeleprompter from "@/hooks/useTeleprompter";

interface TeleprompterProps {
  text: string;
  onClose: () => void;
}

export default function Teleprompter({ text, onClose }: TeleprompterProps) {
  const {
    teleprompterTextRef,
    containerRef,
    isPlaying,
    speed,
    togglePlayPause,
    handleRestart,
    handleSpeedChange,
  } = useTeleprompter(text);

  return (
    <div className="h-full flex flex-col">
      <div
        ref={containerRef}
        className="flex-1 bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-4 overflow-hidden"
      >
        <div
          ref={teleprompterTextRef}
          className="text-lg leading-relaxed text-white"
        >
          {text}
        </div>
      </div>

      <div className="flex items-center justify-between bg-black/30 backdrop-blur-sm rounded-lg p-3">
        <div className="flex items-center space-x-4">
          <button
            onClick={togglePlayPause}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-full w-10 h-10 flex items-center justify-center"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </button>
          <button
            onClick={handleRestart}
            className="text-white/80 hover:text-white"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-white/80">Speed:</span>
          <input
            type="range"
            min="1"
            max="10"
            value={speed}
            onChange={handleSpeedChange}
            className="w-24 accent-purple-600"
          />
        </div>
      </div>
    </div>
  );
}
