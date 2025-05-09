import React, { useMemo } from 'react';
import RichContentRenderer from './RichContentRenderer';
import VynaCard from './VynaCard';
import { cn } from '@/lib/utils';
import { MessageCirclePlus } from 'lucide-react';

interface AdaptiveContentRendererProps {
  content: string;
  visualizations?: any[];
  darkMode?: boolean;
  className?: string;
  isLoading?: boolean;
  showAddToNote?: boolean;
  onAddToNote?: () => void;
}

/**
 * Function to determine if a string contains chart/visualization indicators
 */
function containsVisualContent(text: string): boolean {
  const visualIndicators = [
    'chart', 'graph', 'plot', 'diagram', 'visualization',
    'table', 'statistics', 'data visualization', 'infographic',
    'figure', 'bar chart', 'pie chart', 'line graph', 'map',
    'dashboard', 'trend', 'comparison', 'timeline', 'histogram'
  ];
  
  return visualIndicators.some(indicator => 
    text.toLowerCase().includes(indicator)
  );
}

/**
 * Function to determine if content is suitable for teleprompter format
 */
function isTeleprompterContent(text: string): boolean {
  // Look for patterns that suggest it's meant for a teleprompter
  return text.includes('SCRIPT') || 
         text.includes('TELEPROMPTER') ||
         text.includes('READ THIS:') ||
         text.includes('[Read aloud]') ||
         (text.includes('Introduction') && text.includes('Conclusion')) ||
         text.includes('TALKING POINTS') ||
         text.includes('HOST:') ||
         text.includes('PRESENTER:');
}

/**
 * AdaptiveContentRenderer - Intelligently renders content based on type
 * 
 * This component analyzes the content and chooses the most appropriate
 * display format (standard text, teleprompter with card, or visual content 
 * with card) based on content detection algorithms.
 */
const AdaptiveContentRenderer: React.FC<AdaptiveContentRendererProps> = ({
  content,
  visualizations = [],
  darkMode = false,
  className,
  isLoading = false,
  showAddToNote = false,
  onAddToNote
}) => {
  // Analyze content to determine rendering approach
  const renderingMetadata = useMemo(() => {
    // Check if we have visualizations
    const hasVisualizations = visualizations && visualizations.length > 0;
    
    // Check content text for visual indicators
    const hasVisualIndicators = containsVisualContent(content);
    
    // Check if content appears to be teleprompter content
    const isTeleprompter = isTeleprompterContent(content);
    
    // Determine if we should use a card background
    const useCardBackground = hasVisualizations || hasVisualIndicators || isTeleprompter;
    
    return {
      hasVisualizations,
      hasVisualIndicators,
      isTeleprompter,
      useCardBackground
    };
  }, [content, visualizations]);
  
  // Add to note button rendered separately so it can be positioned absolutely
  const AddToNoteButton = showAddToNote && onAddToNote ? (
    <button 
      onClick={onAddToNote}
      className="absolute bottom-4 left-4 p-1.5 text-[#A67D44] hover:text-[#8A6838] bg-white rounded-full shadow-sm border border-[#e0d5c5] z-20"
      title="Add to note"
    >
      <MessageCirclePlus size={18} />
    </button>
  ) : null;
  
  // If we don't need a card background, render standard content
  if (!renderingMetadata.useCardBackground) {
    return (
      <div className={cn("relative", className)}>
        <RichContentRenderer
          content={content}
          visualizations={visualizations}
          darkMode={darkMode}
          size="medium"
        />
        {AddToNoteButton}
        
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-black/50 flex items-center justify-center z-10 rounded-lg">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-300 animate-pulse">
              Thinking...
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // For rich content that requires the Vyna card
  return (
    <div className={cn("relative", className)}>
      <VynaCard 
        isTeleprompter={renderingMetadata.isTeleprompter}
        showLogo={true} 
        showBranding={true}
        className={renderingMetadata.isTeleprompter ? "min-h-[200px]" : ""}
      >
        <RichContentRenderer
          content={content}
          visualizations={visualizations}
          darkMode={false} // Always use light mode inside the card
          size={renderingMetadata.isTeleprompter ? "large" : "medium"}
        />
      </VynaCard>
      
      {AddToNoteButton}
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 rounded-lg">
          <div className="text-sm font-medium text-gray-600 animate-pulse">
            Thinking...
          </div>
        </div>
      )}
    </div>
  );
};

export default AdaptiveContentRenderer;