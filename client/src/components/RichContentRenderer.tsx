import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { useIsMobile } from '@/hooks/useIsMobile';
// @ts-ignore
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// @ts-ignore
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import EnhancedChartRenderer from './EnhancedChartRenderer';

type ChartData = {
  type: 'chart';
  chartType: 'bar' | 'line' | 'pie' | 'area' | 'scatter';
  data: any[];
  colors?: string[];
  xKey: string;
  yKeys: string[];
  width?: number;
  height?: number;
  title?: string;
  subtitle?: string;
}

type TableData = {
  type: 'table';
  headers: string[];
  rows: any[][];
  title?: string;
  description?: string;
}

type CardData = {
  type: 'card';
  title: string;
  description: string;
  image?: string;
  url?: string;
}

type ImageData = {
  type: 'image';
  url: string;
  caption?: string;
  width?: number;
  height?: number;
  alt?: string;
}

type AudioData = {
  type: 'audio';
  url: string;
  title?: string;
}

type CodeBlockData = {
  type: 'code';
  language: string;
  code: string;
}

type RichContentBlock = ChartData | TableData | CardData | ImageData | AudioData | CodeBlockData;

function extractJSONBlocks(text: string): { parsedBlocks: any[], cleanText: string } {
  const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/g;
  const parsedBlocks: any[] = [];
  let match;
  let cleanText = text;

  while ((match = jsonBlockRegex.exec(text)) !== null) {
    try {
      const jsonString = match[1].trim();
      const parsedData = JSON.parse(jsonString);
      
      // Process different types of blocks
      if (parsedData.type === 'chart') {
        const enhancedChartData: ChartData = {
          ...parsedData,
          data: parsedData.data || [],
          colors: parsedData.colors || ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c'],
          xKey: parsedData.xKey || 'name',
          yKeys: parsedData.yKeys || ['value'],
          width: parsedData.width || 600,
          height: parsedData.height || 300,
          type: 'chart'
        };
        parsedBlocks.push(enhancedChartData);
      } else if (parsedData.type === 'table') {
        parsedBlocks.push({
          ...parsedData,
          headers: parsedData.headers || [],
          rows: parsedData.rows || [],
          type: 'table'
        });
      } else if (parsedData.type === 'card') {
        parsedBlocks.push({
          ...parsedData,
          title: parsedData.title || '',
          description: parsedData.description || '',
          type: 'card'
        });
      } else if (parsedData.type === 'image') {
        parsedBlocks.push({
          ...parsedData,
          url: parsedData.url || '',
          type: 'image'
        });
      } else if (parsedData.type === 'audio') {
        parsedBlocks.push({
          ...parsedData,
          url: parsedData.url || '',
          type: 'audio'
        });
      } else if (parsedData.type === 'code') {
        parsedBlocks.push({
          ...parsedData,
          language: parsedData.language || 'javascript',
          code: parsedData.code || '',
          type: 'code'
        });
      }
    } catch (e) {
      console.error('Error parsing JSON block:', e);
    }
  }
  
  // Remove JSON blocks from text
  cleanText = text.replace(jsonBlockRegex, '');
  
  return { parsedBlocks, cleanText };
}

interface RichContentRendererProps {
  content: string;
  visualizations?: any[];
  darkMode?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const RichContentRenderer: React.FC<RichContentRendererProps> = ({ 
  content, 
  visualizations = [], 
  darkMode = true,
  size = 'medium'
}) => {
  // Use the hook for mobile detection
  const isMobile = useIsMobile();
  // State to track if we need to fallback to text-only mode
  const [fallbackToText, setFallbackToText] = React.useState(false);
  
  // Helper function to determine text size classes based on size prop and mobile state
  const getTextSizeClass = () => {
    if (size === 'small') {
      return isMobile ? 'text-xs' : 'text-sm';
    } else if (size === 'large') {
      return isMobile ? 'text-base' : 'text-lg';
    } else {
      // medium size (default)
      return isMobile ? 'text-sm' : 'text-base';
    }
  };
  
  // Try catch block to handle potential errors in rich content rendering
  try {
    // Extract any JSON blocks that might contain rich content data
    const { parsedBlocks, cleanText } = extractJSONBlocks(content);
    
    // Combine extracted blocks with any passed visualizations
    const allVisualizations = [...parsedBlocks, ...visualizations];
    
    // If in fallback mode, just return the original text
    if (fallbackToText) {
      return (
        <div className={`rich-content ${getTextSizeClass()} ${darkMode ? 'text-white' : 'text-[#333333]'}`}>
          <div className="p-3 bg-orange-100 border border-orange-300 rounded-md text-orange-800 mb-4">
            <strong>Note:</strong> Some rich content couldn't be rendered properly. Showing text-only version.
          </div>
          <div className="markdown-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeSanitize]}
              components={{
                // Enhance h1 and h2 elements to be properly formatted
                h1: ({node, ...props}) => (
                  <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold mb-3 md:mb-4 text-[#DCC5A2] pb-2 border-b border-[#333333]`} {...props} />
                ),
                h2: ({node, ...props}) => (
                  <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold mb-2 md:mb-3 text-[#C9B18C] mt-4 md:mt-6`} {...props} />
                ),
                h3: ({node, ...props}) => (
                  <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold mb-1.5 md:mb-2 text-[#B8A283] mt-3 md:mt-4`} {...props} />
                ),
                // @ts-ignore
                code: ({node, inline, className, children, ...props}) => {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      // @ts-ignore
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>
      );
    }

    // If there are no visualizations, just render the content as markdown
    if (allVisualizations.length === 0) {
      return (
        <div className={`rich-content ${getTextSizeClass()} ${darkMode ? 'text-white' : 'text-[#333333]'}`}>
          <div className="markdown-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeSanitize]}
              components={{
                // Enhance h1 and h2 elements to be properly formatted
                h1: ({node, ...props}) => (
                  <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold mb-3 md:mb-4 text-[#DCC5A2] pb-2 border-b border-[#333333]`} {...props} />
                ),
                h2: ({node, ...props}) => (
                  <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold mb-2 md:mb-3 text-[#C9B18C] mt-4 md:mt-6`} {...props} />
                ),
                h3: ({node, ...props}) => (
                  <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold mb-1.5 md:mb-2 text-[#B8A283] mt-3 md:mt-4`} {...props} />
                ),
                // @ts-ignore
                code: ({node, inline, className, children, ...props}) => {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      // @ts-ignore
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {cleanText}
            </ReactMarkdown>
          </div>
        </div>
      );
    }

    // Otherwise, render both the content and the visualizations
    return (
      <div className={`rich-content ${getTextSizeClass()} ${darkMode ? 'text-white' : 'text-[#333333]'}`}>
        {/* If there's text content, render it with markdown */}
        {cleanText.trim() !== '' && (
          <div className="markdown-content mb-4">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeSanitize]}
              components={{
                // @ts-ignore
                code: ({node, inline, className, children, ...props}) => {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      // @ts-ignore
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {cleanText}
            </ReactMarkdown>
          </div>
        )}
        
        {/* Render visualizations */}
        {allVisualizations.map((viz, index) => {
          if (viz.type === 'chart') {
            return (
              <div className="visualization-container mb-6" key={`chart-${index}`}>
                <EnhancedChartRenderer 
                  data={viz.data}
                  chartType={viz.chartType}
                  xKey={viz.xKey}
                  yKeys={viz.yKeys}
                  colors={viz.colors}
                  width={viz.width}
                  height={viz.height}
                  darkMode={darkMode}
                  title={viz.title}
                  subtitle={viz.subtitle}
                />
              </div>
            );
          } else if (viz.type === 'table') {
            return (
              <div className="visualization-container mb-6 overflow-auto" key={`table-${index}`}>
                {viz.title && <h3 className="text-lg font-semibold mb-2">{viz.title}</h3>}
                {viz.description && <p className="text-gray-400 mb-3 text-sm">{viz.description}</p>}
                <div className="table-responsive overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#2A2A2A] border-b border-[#444]">
                        {viz.headers.map((header, i) => (
                          <th key={`header-${i}`} className="px-4 py-3 text-left text-sm font-medium">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {viz.rows.map((row, rowIndex) => (
                        <tr key={`row-${rowIndex}`} className={rowIndex % 2 === 0 ? 'bg-[#1D1D1D]' : 'bg-[#232323]'}>
                          {row.map((cell, cellIndex) => (
                            <td key={`cell-${rowIndex}-${cellIndex}`} className="px-4 py-3 border-t border-[#333] text-sm">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          } else if (viz.type === 'card') {
            return (
              <div className="visualization-container mb-6" key={`card-${index}`}>
                <div className="bg-[#2A2A2A] rounded-xl overflow-hidden shadow-lg">
                  {viz.image && (
                    <div className="h-48 overflow-hidden">
                      <img src={viz.image} alt={viz.title} className="w-full object-cover" />
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="text-xl font-semibold mb-2">{viz.title}</h3>
                    <p className="text-gray-300">{viz.description}</p>
                    {viz.url && (
                      <a href={viz.url} target="_blank" rel="noopener noreferrer" className="inline-block mt-4 text-blue-400 hover:underline">
                        Learn More →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          } else if (viz.type === 'image') {
            return (
              <div className="visualization-container mb-6" key={`image-${index}`}>
                <figure>
                  <img 
                    src={viz.url} 
                    alt={viz.alt || "Visualization"} 
                    className="rounded-lg max-w-full h-auto" 
                    style={{
                      width: viz.width ? `${viz.width}px` : 'auto',
                      height: viz.height ? `${viz.height}px` : 'auto',
                      maxWidth: '100%'
                    }}
                  />
                  {viz.caption && (
                    <figcaption className="text-center text-gray-400 mt-2">{viz.caption}</figcaption>
                  )}
                </figure>
              </div>
            );
          } else if (viz.type === 'audio') {
            return (
              <div className="visualization-container mb-6" key={`audio-${index}`}>
                {viz.title && <h3 className="text-lg font-semibold mb-2">{viz.title}</h3>}
                <audio controls className="w-full">
                  <source src={viz.url} />
                  Your browser does not support the audio element.
                </audio>
              </div>
            );
          } else if (viz.type === 'code') {
            return (
              <div className="visualization-container mb-6" key={`code-${index}`}>
                <SyntaxHighlighter
                  // @ts-ignore
                  style={vscDarkPlus}
                  language={viz.language}
                  PreTag="div"
                >
                  {viz.code}
                </SyntaxHighlighter>
              </div>
            );
          } else {
            // For unknown visualization types
            return (
              <div className="text-xs text-gray-400 p-2 mb-2" key={`unknown-${index}`}>
                Unknown visualization type
              </div>
            );
          }
        })}
      </div>
    );
  } catch (error) {
    // If there's an error rendering rich content, fallback to simple text view
    console.error("Error rendering rich content:", error);
    
    if (!fallbackToText) {
      setFallbackToText(true);
    }
    
    return (
      <div className="rich-content">
        <div className="p-3 bg-orange-100 border border-orange-300 rounded-md text-orange-800 mb-4">
          <strong>Error:</strong> Something went wrong while rendering content.
        </div>
        <pre className="whitespace-pre-wrap">{content}</pre>
      </div>
    );
  }
};

export default RichContentRenderer;