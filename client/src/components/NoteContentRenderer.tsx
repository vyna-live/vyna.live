import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
// @ts-ignore
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// @ts-ignore
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface NoteContentRendererProps {
  content: string;
  darkMode?: boolean;
}

const NoteContentRenderer: React.FC<NoteContentRendererProps> = ({ 
  content, 
  darkMode = true 
}) => {
  // Process content if needed
  const processedContent = content || '';

  return (
    <div className="note-markdown-content">
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
            <h1 className={`text-lg md:text-2xl font-bold mb-3 mt-4 ${darkMode ? 'text-white' : 'text-gray-900'}`} {...props} />
          ),
          h2: ({node, ...props}) => (
            <h2 className={`text-base md:text-xl font-semibold mb-2 mt-3 ${darkMode ? 'text-white' : 'text-gray-900'}`} {...props} />
          ),
          h3: ({node, ...props}) => (
            <h3 className={`text-sm md:text-lg font-medium mb-2 mt-2 ${darkMode ? 'text-white' : 'text-gray-900'}`} {...props} />
          ),
          h4: ({node, ...props}) => (
            <h4 className={`text-xs md:text-base font-medium mb-1 mt-2 ${darkMode ? 'text-white' : 'text-gray-900'}`} {...props} />
          ),
          p: ({node, ...props}) => (
            <p className={`text-xs md:text-sm mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`} {...props} />
          ),
          li: ({node, ...props}) => (
            <li className={`text-xs md:text-sm mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`} {...props} />
          ),
          ul: ({node, ...props}) => (
            <ul className="list-disc pl-5 mb-4" {...props} />
          ),
          ol: ({node, ...props}) => (
            <ol className="list-decimal pl-5 mb-4" {...props} />
          ),
          blockquote: ({node, ...props}) => (
            <blockquote className={`border-l-4 border-[#DCC5A2] pl-4 italic my-4 text-xs md:text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} {...props} />
          ),
          table: ({node, ...props}) => (
            <div className="overflow-x-auto mb-4">
              <table className={`min-w-full divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-300'} text-xs md:text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`} {...props} />
            </div>
          )
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default NoteContentRenderer;