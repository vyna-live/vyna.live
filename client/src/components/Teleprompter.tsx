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
        className="flex-1 bg-[hsl(223,12%,18%)] border border-[hsl(var(--ai-border))] rounded-xl p-6 mb-4 overflow-hidden"
      >
        <div
          ref={teleprompterTextRef}
          className="text-lg leading-relaxed"
        >
          {text.split('\n').map((line, i) => {
            // Check if line is a heading (all caps or ends with colon)
            const isHeading = line.trim() === line.trim().toUpperCase() && line.trim().length > 3 || 
                             line.trim().endsWith(':');
            
            if (isHeading && line.trim().length > 0) {
              return <h3 key={i} className="font-bold text-[hsl(var(--ai-teal))] mt-6 mb-3">{line}</h3>;
            }
            
            return (
              <p key={i} className="mb-4 text-[hsl(var(--ai-text-primary))]">
                {line.trim() ? line : <br />}
              </p>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between bg-[hsl(var(--ai-card))] border border-[hsl(var(--ai-border))] rounded-xl p-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={togglePlayPause}
            className="bg-[hsl(var(--ai-accent))] hover:bg-[hsl(var(--ai-accent))/90] text-black rounded-lg w-10 h-10 flex items-center justify-center"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </button>
          <button
            onClick={handleRestart}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[hsl(180,85%,15%)] text-[hsl(var(--ai-text-secondary))] hover:text-[hsl(var(--ai-teal))] transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-[hsl(var(--ai-text-secondary))]">Speed:</span>
          <div className="relative">
            <input
              type="range"
              min="1"
              max="10"
              value={speed}
              onChange={handleSpeedChange}
              className="w-24 accent-[hsl(var(--ai-accent))]"
            />
            <div className="absolute top-full mt-1 text-xs text-[hsl(var(--ai-text-secondary))] w-full flex justify-between">
              <span>1x</span>
              <span>10x</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
