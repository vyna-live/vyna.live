import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { MessageCirclePlus } from 'lucide-react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend, 
  ArcElement
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export interface Visualization {
  type: 'chart' | 'graph' | 'table' | 'image' | 'card';
  subType?: 'line' | 'bar' | 'pie' | 'scatter';
  data: any;
  options?: any;
  caption?: string;
}

export interface RichContent {
  text: string;
  visualizations?: Visualization[];
}

interface RichContentRendererProps {
  content: string | RichContent;
  className?: string;
  isPrompt?: boolean;
  isLoading?: boolean;
  showCardBackground?: boolean;
  onAddToNote?: () => void;
  showAddToNote?: boolean;
  isTeleprompter?: boolean;
}

/**
 * Function to detect if content contains code blocks
 */
function containsCodeBlock(text: string): boolean {
  return text.includes('```');
}

/**
 * Function to parse code blocks from Markdown text
 */
function parseCodeBlocks(text: string) {
  const codeBlockRegex = /```(?:(\w+)\n)?([\s\S]*?)```/g;
  let match;
  const blocks = [];
  let lastIndex = 0;
  
  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      blocks.push({
        type: 'text',
        content: text.substring(lastIndex, match.index)
      });
    }
    
    // Add code block
    blocks.push({
      type: 'code',
      language: match[1] || '',
      content: match[2]
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text after last code block
  if (lastIndex < text.length) {
    blocks.push({
      type: 'text',
      content: text.substring(lastIndex)
    });
  }
  
  return blocks;
}

/**
 * Function to determine if a string contains chart/visualization indicators
 */
function containsVisualContent(text: string): boolean {
  const visualIndicators = [
    'chart', 'graph', 'plot', 'diagram', 'visualization',
    'table', 'statistics', 'data visualization', 'infographic',
    'figure', 'bar chart', 'pie chart', 'line graph'
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
         text.includes('TALKING POINTS');
}

/**
 * Function to convert markdown text to HTML
 */
function markdownToHtml(markdown: string): string {
  // Simple MD to HTML conversion
  let html = markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Lists
    .replace(/^\s*\n\* (.*)/gim, '<ul>\n<li>$1</li>')
    .replace(/^\* (.*)/gim, '<li>$1</li>')
    .replace(/^\s*\n- (.*)/gim, '<ul>\n<li>$1</li>')
    .replace(/^- (.*)/gim, '<li>$1</li>')
    // Line breaks
    .replace(/\n$/gim, '<br />')
    
  // Replace code blocks
  const blocks = parseCodeBlocks(markdown);
  if (blocks.length > 1) {
    html = blocks.map(block => {
      if (block.type === 'code') {
        return `<pre><code class="language-${block.language}">${block.content}</code></pre>`;
      } else {
        return block.content;
      }
    }).join('');
  }
  
  return html;
}

/**
 * Renders rich content with auto-detection of content type
 */
export const RichContentRenderer: React.FC<RichContentRendererProps> = ({
  content,
  className,
  isPrompt = false,
  isLoading = false,
  showCardBackground = false,
  onAddToNote,
  showAddToNote = false,
  isTeleprompter = false
}) => {
  // Parse the content if it's a string
  const parsedContent = useMemo(() => {
    if (typeof content === 'string') {
      const hasVisualIndicators = containsVisualContent(content);
      const isTeleprompterFormat = isTeleprompterContent(content);
      
      // Determine if we should force card background
      const forceCardBackground = hasVisualIndicators || isTeleprompterFormat || isTeleprompter;
      
      return {
        text: content,
        visualizations: [],
        useCardBackground: showCardBackground || forceCardBackground,
        isTeleprompterFormat: isTeleprompterFormat || isTeleprompter
      };
    } else {
      return {
        text: content.text,
        visualizations: content.visualizations || [],
        useCardBackground: showCardBackground || content.visualizations?.length > 0,
        isTeleprompterFormat: isTeleprompter
      };
    }
  }, [content, showCardBackground, isTeleprompter]);
  
  // Create HTML content
  const htmlContent = useMemo(() => {
    return markdownToHtml(parsedContent.text);
  }, [parsedContent.text]);
  
  // Render the content based on the detected content type
  return (
    <div className={cn("relative", className)}>
      {parsedContent.useCardBackground ? (
        <Card className={cn(
          "relative p-4 overflow-hidden",
          parsedContent.isTeleprompterFormat ? "bg-[#f5eee5]" : "bg-[#f9f5f0]",
          "border border-[#e0d5c5] shadow-sm"
        )}>
          {/* Branding element for teleprompter format */}
          {parsedContent.isTeleprompterFormat && (
            <div className="absolute top-2 right-2 text-xs font-bold text-[#A67D44] opacity-50">
              JUST GO LIVE
            </div>
          )}
          
          {/* Text content */}
          <div 
            className={cn(
              "prose prose-neutral max-w-none",
              parsedContent.isTeleprompterFormat ? "text-lg leading-relaxed" : ""
            )}
            dangerouslySetInnerHTML={{ __html: htmlContent }} 
          />
          
          {/* Visualizations */}
          {parsedContent.visualizations && parsedContent.visualizations.length > 0 && (
            <div className="mt-4 space-y-4">
              {parsedContent.visualizations.map((viz, index) => (
                <div key={index} className="visualization-container">
                  {viz.type === 'chart' && viz.subType === 'line' && (
                    <Line data={viz.data} options={viz.options} />
                  )}
                  {viz.type === 'chart' && viz.subType === 'bar' && (
                    <Bar data={viz.data} options={viz.options} />
                  )}
                  {viz.type === 'chart' && viz.subType === 'pie' && (
                    <Pie data={viz.data} options={viz.options} />
                  )}
                  {viz.type === 'image' && (
                    <img 
                      src={viz.data}
                      alt={viz.caption || "Visualization"} 
                      className="max-w-full rounded-lg" 
                    />
                  )}
                  {viz.type === 'table' && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse border border-[#e0d5c5]">
                        <thead>
                          <tr className="bg-[#f0e6da]">
                            {viz.data.headers.map((header: string, i: number) => (
                              <th key={i} className="px-4 py-2 text-left border border-[#e0d5c5]">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {viz.data.rows.map((row: any[], i: number) => (
                            <tr key={i} className={i % 2 === 0 ? 'bg-[#f9f5f0]' : 'bg-[#f5eee5]'}>
                              {row.map((cell, j) => (
                                <td key={j} className="px-4 py-2 border border-[#e0d5c5]">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {viz.caption && (
                    <p className="text-sm text-center text-gray-600 mt-2">{viz.caption}</p>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Add to note button */}
          {showAddToNote && onAddToNote && (
            <button 
              onClick={onAddToNote}
              className="absolute bottom-2 right-2 p-1.5 text-[#A67D44] hover:text-[#8A6838] bg-white rounded-full shadow-sm border border-[#e0d5c5]"
              title="Add to note"
            >
              <MessageCirclePlus size={18} />
            </button>
          )}
        </Card>
      ) : (
        // Regular text content without card background
        <div className="relative">
          <div 
            className="prose prose-neutral max-w-none"
            dangerouslySetInnerHTML={{ __html: htmlContent }} 
          />
          
          {/* Add to note button */}
          {showAddToNote && onAddToNote && (
            <button 
              onClick={onAddToNote}
              className="absolute bottom-2 right-2 p-1.5 text-[#A67D44] hover:text-[#8A6838] bg-white rounded-full shadow-sm border border-[#e0d5c5]"
              title="Add to note"
            >
              <MessageCirclePlus size={18} />
            </button>
          )}
        </div>
      )}
      
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/5 rounded-lg">
          <div className="text-sm font-medium text-gray-600">Thinking...</div>
        </div>
      )}
    </div>
  );
};

export default RichContentRenderer;