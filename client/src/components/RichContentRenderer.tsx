import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { useIsMobile } from '@/hooks/useIsMobile';
// @ts-ignore
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// @ts-ignore
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
  const isMobile = useIsMobile();
  
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

  // Simple version with no visualizations for now
  return (
    <div className={`rich-content ${getTextSizeClass()} ${darkMode ? 'text-white' : 'text-[#333333]'}`}>
      <div className="markdown-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, rehypeSanitize]}
          components={{
            h1: (props) => (
              <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold mb-3 md:mb-4 text-[#DCC5A2] pb-2 border-b border-[#333333]`} {...props} />
            ),
            h2: (props) => (
              <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold mb-2 md:mb-3 text-[#C9B18C] mt-4 md:mt-6`} {...props} />
            ),
            h3: (props) => (
              <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold mb-1.5 md:mb-2 text-[#B8A283] mt-3 md:mt-4`} {...props} />
            ),
            code: ({inline, className, children, ...props}) => {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <SyntaxHighlighter
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
};

export default RichContentRenderer;