import React, { useState } from "react";
import { Copy, Play, Pause, Sliders, Maximize, Minimize } from "lucide-react";
import useTeleprompter from "@/hooks/useTeleprompter";
import RichContentRenderer from "./RichContentRenderer";
import { ResizableBox } from "react-resizable";

interface TeleprompterProps {
  text: string;
  onClose?: () => void;
  visualizations?: any[];
}

export default function Teleprompter({ text, onClose, visualizations = [] }: TeleprompterProps) {
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
  
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Default sizing
  const defaultWidth = 499;
  const defaultHeight = 238;
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Add CSS classes for resize handle
  const resizeHandleClassName = "absolute bottom-0 right-0 w-5 h-5 cursor-se-resize bg-white/10 rounded-br";

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Main teleprompter container - glassmorphic background */}
      <ResizableBox
        width={isExpanded ? defaultWidth * 1.5 : defaultWidth}
        height={isExpanded ? defaultHeight * 1.5 : defaultHeight}
        minConstraints={[300, 150]}
        maxConstraints={[800, 500]}
        resizeHandles={['se']}
        handle={<div style={resizeHandleStyles} />}
        className="relative"
      >
        <div 
          ref={containerRef}
          className="w-full h-full bg-black/90 backdrop-blur-md border border-zinc-800/60 rounded-xl overflow-hidden"
          style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)' }}
        >
          {/* Text container with scrolling content */}
          <div
            ref={teleprompterTextRef}
            className="h-full p-6 pb-16 overflow-y-auto"
            style={{ fontSize: `${textSize}px` }}
          >
            {/* Use the RichContentRenderer for all content, including text */}
            <RichContentRenderer 
              content={text}
              visualizations={visualizations}
              darkMode={true}
              size="small"
            />
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
                onClick={toggleExpand}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                {isExpanded ? (
                  <Minimize className="h-4 w-4 text-white" />
                ) : (
                  <Maximize className="h-4 w-4 text-white" />
                )}
              </button>
              <button 
                onClick={handleRestart}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <Copy className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </ResizableBox>

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
