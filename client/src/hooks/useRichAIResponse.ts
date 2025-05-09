import { useState, useEffect, useCallback } from 'react';
import { VisualData } from '@/components/RichContentCard';
import processAIContent from '@/services/visualizationProcessor';

interface UseRichAIResponseProps {
  content: string;
  processOnMount?: boolean;
}

interface UseRichAIResponseResult {
  processedContent: string;
  visualizations: VisualData[];
  isProcessing: boolean;
  hasVisualizations: boolean;
  processContent: (text: string) => void;
}

/**
 * Custom hook to process AI responses and extract visualizations
 */
export function useRichAIResponse({
  content = '',
  processOnMount = true
}: UseRichAIResponseProps): UseRichAIResponseResult {
  const [processedContent, setProcessedContent] = useState<string>('');
  const [visualizations, setVisualizations] = useState<VisualData[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  // Process content function
  const processContent = useCallback((text: string) => {
    if (!text) {
      setProcessedContent('');
      setVisualizations([]);
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Process content for visualizations
      const result = processAIContent(text);
      setProcessedContent(result.cleanText);
      setVisualizations(result.visualizations);
    } catch (error) {
      console.error('Error processing content:', error);
      setProcessedContent(text);
      setVisualizations([]);
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  // Process content on mount if enabled
  useEffect(() => {
    if (processOnMount && content) {
      processContent(content);
    }
  }, [content, processContent, processOnMount]);
  
  return {
    processedContent,
    visualizations,
    isProcessing,
    hasVisualizations: visualizations.length > 0,
    processContent
  };
}

export default useRichAIResponse;