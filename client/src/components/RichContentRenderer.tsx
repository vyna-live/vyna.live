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
  if (!chartData.data || chartData.data.length === 0) return null;
  
  // Ensure the chart data has the required structure for EnhancedChartRenderer
  const enhancedChartData: ChartData = {
    type: 'chart',
    chartType: chartData.chartType || 'bar',
    data: chartData.data,
    xKey: chartData.xKey || 'name',
    yKeys: chartData.yKeys || ['value'],
    colors: chartData.colors,
    width: chartData.width,
    height: chartData.height,
    title: chartData.title,
    subtitle: chartData.subtitle
  };
  
  // Use our advanced chart renderer that uses ECharts
  return <EnhancedChartRenderer chartData={enhancedChartData} darkMode={darkMode} />;
};

// Component to render a data table
const TableRenderer: React.FC<{ data: any[], darkMode?: boolean }> = ({ data, darkMode = true }) => {
  if (!data || data.length === 0) return null;
  
  // Extract headers from the first item
  const headers = Object.keys(data[0]);
  
  // Define styles based on dark or light mode
  const tableStyles = darkMode ? {
    table: "min-w-full bg-[#1E1E1E] border border-[#444] text-white",
    header: "bg-[#252525]",
    headerCell: "px-4 py-2 text-left text-[#DCC5A2] border-b border-[#444]",
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
                  {row[header]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
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
      content: 'text-[#DDDDDD]'
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
      title: 'text-[#333333]',
      content: 'text-[#555555]'
    }
  };
  
  const scheme = darkMode ? colorSchemes.dark : colorSchemes.light;
  
  return (
    <div className={`p-4 rounded-lg border ${scheme.border[type]} ${scheme.bg[type]} my-4`}>
      <div className="flex items-start">
        {icon && <div className="mr-3">{icon}</div>}
        <div>
          <h4 className={`font-semibold mb-1 ${scheme.title}`}>{title}</h4>
          <div className={scheme.content}>{content}</div>
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
  // Extract any JSON blocks that might contain rich content data
  const { parsedBlocks, cleanText } = extractJSONBlocks(content);
  
  // Split the text by placeholders
  const textParts = cleanText.split(/\[RICH_CONTENT_(\d+)\]/);
  
  return (
    <div className={`rich-content ${size === 'small' ? 'text-sm' : size === 'large' ? 'text-lg' : 'text-base'} ${darkMode ? 'text-white' : 'text-[#333333]'}`}>
      {/* Render direct visualizations if provided */}
      {visualizations && visualizations.length > 0 && (
        <div className="visualizations-container mb-4">
          {visualizations.map((visualization, idx) => {
            if (visualization.type === 'chart') {
              return <ChartRenderer key={`viz-chart-${idx}`} chartData={visualization} darkMode={darkMode} />;
            }
            if (visualization.type === 'table') {
              return <TableRenderer key={`viz-table-${idx}`} data={visualization.data} darkMode={darkMode} />;
            }
            return null;
          })}
        </div>
      )}
      
      {/* Render content from markdown */}
      {textParts.map((part, index) => {
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
                  }
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
            return <ChartRenderer key={`chart-${index}`} chartData={richContentBlock} darkMode={darkMode} />;
          
          case 'table':
            return <TableRenderer key={`table-${index}`} data={richContentBlock.data} darkMode={darkMode} />;
          
          case 'card':
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
            return <AudioRenderer key={`audio-${index}`} src={richContentBlock.src} />;
          
          case 'image':
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
      })}
    </div>
  );
};

export default RichContentRenderer;