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
    <div className="fixed bottom-0 left-0 w-full bg-white shadow-lg rounded-t-xl transform transition-transform duration-300 z-50">
      <div className="container mx-auto px-4 py-4 max-w-5xl">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold purple-gradient-text">
            Teleprompter Mode
          </h3>
          <button
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#A259FF]"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div
          ref={containerRef}
          className="bg-[#F5F5F7] rounded-lg p-6 mb-4 h-40 overflow-hidden"
        >
          <div
            ref={teleprompterTextRef}
            className="text-lg leading-relaxed text-[#1F2937]"
          >
            {text}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={togglePlayPause}
              className="bg-[#A259FF] text-white rounded-full w-12 h-12 flex items-center justify-center"
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </button>
            <button
              onClick={handleRestart}
              className="text-[#6B7280] hover:text-[#A259FF]"
            >
              <RotateCcw className="h-6 w-6" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-[#6B7280]">Speed:</span>
            <input
              type="range"
              min="1"
              max="10"
              value={speed}
              onChange={handleSpeedChange}
              className="w-32 accent-[#A259FF]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
