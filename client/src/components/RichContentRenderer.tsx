import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
// @ts-ignore
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// @ts-ignore
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
// Import the enhanced chart renderer
import EnhancedChartRenderer from './EnhancedChartRenderer';

// Define a type for rendering charts
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

// Function to extract and parse JSON blocks from text
function extractJSONBlocks(text: string): { parsedBlocks: any[], cleanText: string } {
  const jsonRegex = /```json\s*([\s\S]*?)\s*```/g;
  
  let cleanText = text;
  const parsedBlocks: any[] = [];
  
  // Use a different approach to avoid TypeScript issues with matchAll
  let match;
  let index = 0;
  
  while ((match = jsonRegex.exec(text)) !== null) {
    try {
      const jsonContent = match[1].trim();
      const parsed = JSON.parse(jsonContent);
      
      // Replace the JSON block with a placeholder
      cleanText = cleanText.replace(match[0], `[RICH_CONTENT_${index}]`);
      
      parsedBlocks.push(parsed);
      index++;
    } catch (error) {
      console.error('Failed to parse JSON block:', error);
    }
  }
  
  return { parsedBlocks, cleanText };
}

// Component to render a chart based on data
const ChartRenderer: React.FC<{ chartData: any, darkMode?: boolean }> = ({ 
  chartData,
  darkMode = true
}) => {
  // Defensive programming approach - validate data thoroughly
  if (!chartData || !chartData.data) {
    console.error("ChartRenderer: chartData or chartData.data is undefined", chartData);
    return null;
  }
  
  if (!Array.isArray(chartData.data) || chartData.data.length === 0) {
    console.error("ChartRenderer: chartData.data is not an array or is empty", chartData.data);
    return null;
  }
  
  try {
    // Determine a safe xKey - either use the provided one or find the first string property
    let safeXKey = chartData.xKey || 'name';
    const firstItem = chartData.data[0];
    
    // If the specified xKey doesn't exist, try to find a suitable property
    if (!firstItem[safeXKey]) {
      const stringProps = Object.keys(firstItem).filter(
        (k: string): boolean => typeof firstItem[k] === 'string'
      );
      
      if (stringProps.length > 0) {
        safeXKey = stringProps[0];
        console.log(`ChartRenderer: Using '${safeXKey}' as xKey instead of '${chartData.xKey}'`);
      }
    }
    
    // Determine safe yKeys - either use the provided ones or find the first numeric properties
    let safeYKeys = chartData.yKeys || ['value'];
    
    // If the specified yKeys don't exist, try to find suitable properties
    const numericProps = Object.keys(firstItem).filter(
      (k: string): boolean => typeof firstItem[k] === 'number' || !isNaN(Number(firstItem[k]))
    );
    
    if (numericProps.length > 0 && 
        (safeYKeys.length === 0 || !safeYKeys.some((k: string): boolean => firstItem[k] !== undefined))) {
      safeYKeys = [numericProps[0]];
      console.log(`ChartRenderer: Using '${numericProps[0]}' as yKey instead of '${chartData.yKeys}'`);
    }
    
    // Ensure the chart data has the required structure for EnhancedChartRenderer
    const enhancedChartData: ChartData = {
      type: 'chart',
      chartType: chartData.chartType || 'bar',
      data: chartData.data,
      xKey: safeXKey,
      yKeys: safeYKeys,
      colors: chartData.colors,
      width: chartData.width,
      height: chartData.height,
      title: chartData.title,
      subtitle: chartData.subtitle
    };
    
    // Use our advanced chart renderer that uses ECharts
    return <EnhancedChartRenderer chartData={enhancedChartData} darkMode={darkMode} />;
  } catch (error) {
    console.error("Error in ChartRenderer:", error);
    return (
      <div className="p-3 bg-orange-100 border border-orange-300 rounded-md text-orange-800 mb-4">
        <strong>Chart Error:</strong> Unable to render chart due to invalid data structure.
      </div>
    );
  }
};

// Component to render a data table
const TableRenderer: React.FC<{ data: any[], darkMode?: boolean }> = ({ data, darkMode = true }) => {
  try {
    // Defensive validation
    if (!data) {
      console.error("TableRenderer: data is undefined");
      return null;
    }
    
    if (!Array.isArray(data)) {
      console.error("TableRenderer: data is not an array", data);
      return null;
    }
    
    if (data.length === 0) {
      console.error("TableRenderer: data array is empty");
      return null;
    }
    
    if (typeof data[0] !== 'object' || data[0] === null) {
      console.error("TableRenderer: first item in data is not an object", data[0]);
      return null;
    }
    
    // Extract headers from the first item
    const headers = Object.keys(data[0]);
    
    if (headers.length === 0) {
      console.error("TableRenderer: no headers found in data", data[0]);
      return null;
    }
    
    // Define styles based on dark or light mode
    const tableStyles = darkMode ? {
      table: "min-w-full bg-[#1E1E1E] border border-[#444] text-white",
      header: "bg-[#252525]",
      headerCell: "px-4 py-2 text-left text-[#E8B85B] border-b border-[#444]",
      rowEven: "bg-[#1E1E1E]",
      rowOdd: "bg-[#252525]",
      cell: "px-4 py-2 border-b border-[#444]"
    } : {
      table: "min-w-full bg-white border border-[#E0D5C5] text-[#333333]",
      header: "bg-[#F7F2EB]",
      headerCell: "px-4 py-2 text-left text-[#8A1538] border-b border-[#E0D5C5] font-medium",
      rowEven: "bg-white",
      rowOdd: "bg-[#F7F2EB]",
      cell: "px-4 py-2 border-b border-[#E0D5C5]"
    };
    
    return (
      <div className="overflow-x-auto my-4">
        <table className={tableStyles.table}>
          <thead className={tableStyles.header}>
            <tr>
              {headers.map((header) => (
                <th key={header} className={tableStyles.headerCell}>
                  {header.charAt(0).toUpperCase() + header.slice(1)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? tableStyles.rowEven : tableStyles.rowOdd}>
                {headers.map((header) => (
                  <td key={`${rowIndex}-${header}`} className={tableStyles.cell}>
                    {/* Convert any object or array to JSON string for display */}
                    {typeof row[header] === 'object' && row[header] !== null 
                      ? JSON.stringify(row[header]) 
                      : row[header] !== undefined 
                        ? String(row[header]) 
                        : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  } catch (error) {
    console.error("Error in TableRenderer:", error);
    return (
      <div className="p-3 bg-orange-100 border border-orange-300 rounded-md text-orange-800 mb-4">
        <strong>Table Error:</strong> Unable to render table due to invalid data structure.
      </div>
    );
  }
};

// Component to render an info card
const InfoCardRenderer: React.FC<{ 
  title: string;
  content: string;
  icon?: string; 
  type?: 'info' | 'warning' | 'success' | 'error';
  darkMode?: boolean;
}> = ({ title, content, icon, type = 'info', darkMode = true }) => {
  // Define color schemes for dark and light modes
  const colorSchemes = {
    dark: {
      bg: {
        info: 'bg-[#1E3A53]',
        warning: 'bg-[#513923]',
        success: 'bg-[#1E4D2B]',
        error: 'bg-[#572A2A]'
      },
      border: {
        info: 'border-[#3E6B99]',
        warning: 'border-[#9B7846]',
        success: 'border-[#3A9D55]',
        error: 'border-[#AA5555]'
      },
      title: 'text-white',
      content: 'text-gray-200'
    },
    light: {
      bg: {
        info: 'bg-[#EBF5FF]',
        warning: 'bg-[#FFF8E6]',
        success: 'bg-[#EDFCF2]',
        error: 'bg-[#FFF1F1]'
      },
      border: {
        info: 'border-[#A3D0FF]',
        warning: 'border-[#FFE8B2]',
        success: 'border-[#B3F0C4]',
        error: 'border-[#FFCCCC]'
      },
      title: 'text-gray-800',
      content: 'text-gray-700'
    }
  };
  
  const scheme = darkMode ? colorSchemes.dark : colorSchemes.light;
  
  return (
    <div className={`p-4 rounded-lg border ${scheme.border[type]} ${scheme.bg[type]} my-4`}>
      <div className="flex items-start">
        {icon && <div className="mr-3">{icon}</div>}
        <div className="w-full">
          <h4 className={`font-bold mb-1 text-sm md:text-base ${darkMode ? 'text-[#E8B85B]' : 'text-gray-900'}`}>
            {title}
          </h4>
          <div className={`${scheme.content} text-xs md:text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            {content}
          </div>
        </div>
      </div>
    </div>
  );
};

// Audio player component
const AudioRenderer: React.FC<{ src: string }> = ({ src }) => {
  return (
    <div className="my-4">
      <audio controls className="w-full">
        <source src={src} />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};

// Image renderer with lazy loading
const ImageRenderer: React.FC<{ src: string; alt: string; darkMode?: boolean }> = ({ 
  src, 
  alt,
  darkMode = true 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  return (
    <div className="my-4 relative">
      {!isLoaded && (
        <div className={`absolute inset-0 flex items-center justify-center ${
          darkMode ? 'bg-[#1A1A1A]' : 'bg-[#F7F2EB]'
        } animate-pulse rounded-lg`}>
          <span className={darkMode ? 'text-[#DCC5A2]' : 'text-[#8A1538]'}>
            Loading image...
          </span>
        </div>
      )}
      <img 
        src={src} 
        alt={alt} 
        onLoad={() => setIsLoaded(true)}
        className="max-w-full rounded-lg shadow-sm"
      />
    </div>
  );
};

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
  // State to track if we need to fallback to text-only mode
  const [fallbackToText, setFallbackToText] = React.useState(false);
  
  // Try catch block to handle potential errors in rich content rendering
  try {
    // Extract any JSON blocks that might contain rich content data
    const { parsedBlocks, cleanText } = extractJSONBlocks(content);
    
    // Split the text by placeholders
    const textParts = cleanText.split(/\[RICH_CONTENT_(\d+)\]/);
    
    // If in fallback mode, just return the original text
    if (fallbackToText) {
      return (
        <div className={`rich-content ${
        size === 'small' 
          ? 'text-xs md:text-sm' 
          : size === 'large' 
            ? 'text-sm md:text-lg' 
            : 'text-xs md:text-base'
      } ${darkMode ? 'text-white' : 'text-[#333333]'}`}>
          <div className="p-3 bg-orange-100 border border-orange-300 rounded-md text-orange-800 mb-4">
            <strong>Note:</strong> Some rich content couldn't be rendered properly. Showing text-only version.
          </div>
          <div className="markdown-content">
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
              {content}
            </ReactMarkdown>
          </div>
        </div>
      );
    }
    
    return (
      <div className={`rich-content ${
        size === 'small' 
          ? 'text-xs md:text-sm' 
          : size === 'large' 
            ? 'text-sm md:text-lg' 
            : 'text-xs md:text-base'
      } ${darkMode ? 'text-white' : 'text-[#333333]'}`}>
        {/* Render direct visualizations if provided */}
        {visualizations && visualizations.length > 0 && (
          <div className="visualizations-container mb-4">
            {visualizations.map((visualization, idx) => {
              try {
                if (visualization.type === 'chart' && visualization.data) {
                  return <ChartRenderer key={`viz-chart-${idx}`} chartData={visualization} darkMode={darkMode} />;
                }
                if (visualization.type === 'table' && visualization.data) {
                  return <TableRenderer key={`viz-table-${idx}`} data={visualization.data} darkMode={darkMode} />;
                }
                return null;
              } catch (err) {
                console.error("Error rendering visualization:", err);
                return null;
              }
            })}
          </div>
        )}
        
        {/* Render content from markdown */}
        {textParts.map((part, index) => {
          try {
            // Even indices are regular text
            if (index % 2 === 0) {
              return part ? (
                <div className="markdown-content" key={`text-${index}`}>
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
                      },
                      h1: ({node, ...props}) => (
                        <h1 className={`text-xl md:text-2xl font-bold mb-3 mt-4 ${darkMode ? 'text-[#E8B85B]' : 'text-[#8A1538]'}`} {...props} />
                      ),
                      h2: ({node, ...props}) => (
                        <h2 className={`text-lg md:text-xl font-semibold mb-2 mt-3 ${darkMode ? 'text-[#E8B85B]' : 'text-[#8A1538]'}`} {...props} />
                      ),
                      h3: ({node, ...props}) => (
                        <h3 className={`text-base md:text-lg font-medium mb-2 mt-2 ${darkMode ? 'text-[#E8B85B]' : 'text-[#8A1538]'}`} {...props} />
                      ),
                      h4: ({node, ...props}) => (
                        <h4 className={`text-sm md:text-base font-medium mb-1 mt-2 ${darkMode ? 'text-[#E8B85B]' : 'text-[#8A1538]'}`} {...props} />
                      ),
                      p: ({node, ...props}) => (
                        <p className="text-xs md:text-sm mb-4" {...props} />
                      )
                    }}
                  >
                    {part}
                  </ReactMarkdown>
                </div>
              ) : null;
            }
            
            // Odd indices correspond to rich content blocks
            const blockIndex = parseInt(part, 10);
            const richContentBlock = parsedBlocks[blockIndex];
            
            if (!richContentBlock) return null;
            
            switch (richContentBlock.type) {
              case 'chart':
                if (!richContentBlock.data) return null;
                return <ChartRenderer key={`chart-${index}`} chartData={richContentBlock} darkMode={darkMode} />;
              
              case 'table':
                if (!richContentBlock.data) return null;
                return <TableRenderer key={`table-${index}`} data={richContentBlock.data} darkMode={darkMode} />;
              
              case 'card':
                if (!richContentBlock.title || !richContentBlock.content) return null;
                return (
                  <InfoCardRenderer
                    key={`card-${index}`}
                    title={richContentBlock.title}
                    content={richContentBlock.content}
                    icon={richContentBlock.icon}
                    type={richContentBlock.cardType}
                    darkMode={darkMode}
                  />
                );
              
              case 'audio':
                if (!richContentBlock.src) return null;
                return <AudioRenderer key={`audio-${index}`} src={richContentBlock.src} />;
              
              case 'image':
                if (!richContentBlock.src) return null;
                return (
                  <ImageRenderer
                    key={`image-${index}`}
                    src={richContentBlock.src}
                    alt={richContentBlock.alt || 'Image'}
                    darkMode={darkMode}
                  />
                );
              
              default:
                return null;
            }
          } catch (err) {
            console.error("Error rendering part:", err);
            return null;
          }
        })}
      </div>
    );
  } catch (error) {
    console.error("Error in rich content rendering, falling back to text-only mode:", error);
    
    // If we haven't already fallen back, set the state and rerender
    if (!fallbackToText) {
      setFallbackToText(true);
      
      // Return a loading state while we're transitioning to the fallback
      return (
        <div className={`rich-content ${size === 'small' ? 'text-sm' : size === 'large' ? 'text-lg' : 'text-base'} ${darkMode ? 'text-white' : 'text-[#333333]'}`}>
          <div className="p-3 bg-orange-100 border border-orange-300 rounded-md text-orange-800 mb-4">
            <strong>Note:</strong> Some rich content couldn't be rendered properly. Showing text-only version in a moment...
          </div>
        </div>
      );
    }
    
    // This should never happen because we've set fallbackToText = true
    // but just in case there's another error, show the original content
    return (
      <div className={`rich-content ${size === 'small' ? 'text-sm' : size === 'large' ? 'text-lg' : 'text-base'} ${darkMode ? 'text-white' : 'text-[#333333]'}`}>
        <div className="p-3 bg-red-100 border border-red-300 rounded-md text-red-800 mb-4">
          <strong>Error:</strong> Content could not be rendered properly.
        </div>
        <div className="markdown-content">
          <pre className="whitespace-pre-wrap">{content}</pre>
        </div>
      </div>
    );
  }
};

export default RichContentRenderer;