import React from "react";
import { Copy, Play, Pause, Sliders } from "lucide-react";
import useTeleprompter from "@/hooks/useTeleprompter";

interface TeleprompterProps {
  text: string;
  onClose?: () => void;
}

export default function Teleprompter({ text, onClose }: TeleprompterProps) {
  const {
    teleprompterTextRef,
    containerRef,
    isPlaying,
    speed,
    textSize,
    showSettings,
    togglePlayPause,
    handleRestart,
    handleSpeedChange,
    handleTextSizeChange,
    toggleSettings,
  } = useTeleprompter(text);

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Main teleprompter container - glassmorphic background */}
      <div 
        ref={containerRef}
        className="relative w-[499px] h-[238px] bg-black/60 backdrop-blur-md border border-zinc-800/60 rounded-xl overflow-hidden"
      >
        {/* Text container with scrolling content */}
        <div
          ref={teleprompterTextRef}
          className="h-full p-6 pb-16 overflow-y-auto"
          style={{ fontSize: `${textSize}px` }}
        >
          {text.split('\n').map((line, i) => (
            <p 
              key={i} 
              className="mb-4 text-white/90 leading-normal"
            >
              {line.trim() ? line : <br />}
            </p>
          ))}
        </div>

        {/* Bottom control bar */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between items-center p-3">
          {/* Left side controls */}
          <div className="flex space-x-2">
            <button
              onClick={togglePlayPause}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 text-white" />
              ) : (
                <Play className="h-4 w-4 text-white" />
              )}
            </button>

            <button
              onClick={toggleSettings}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <Sliders className="h-4 w-4 text-white" />
            </button>
          </div>

          {/* Right side controls */}
          <div className="flex space-x-2">
            <button 
              onClick={handleRestart}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <Copy className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Settings panel that appears below */}
      {showSettings && (
        <div className="absolute top-full mt-2 w-[272px] h-[138px] bg-black/80 backdrop-blur-md border border-zinc-800/60 rounded-xl p-4 z-10 shadow-lg">
          <div className="space-y-6">
            {/* Text size slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-400">Text size</span>
                <span className="text-xs text-white">{textSize}</span>
              </div>
              <input
                type="range"
                min="12"
                max="36"
                value={textSize}
                onChange={handleTextSizeChange}
                className="w-full accent-white"
              />
            </div>

            {/* Speed slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-400">Speed</span>
                <span className="text-xs text-white">{speed}</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                value={speed}
                onChange={handleSpeedChange}
                className="w-full accent-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
