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
            <h1 className="text-xl md:text-2xl font-bold mb-3 text-white mt-4" {...props} />
          ),
          h2: ({node, ...props}) => (
            <h2 className="text-lg md:text-xl font-semibold mb-2 text-white mt-3" {...props} />
          ),
          h3: ({node, ...props}) => (
            <h3 className="text-base md:text-lg font-medium mb-2 text-white mt-2" {...props} />
          ),
          h4: ({node, ...props}) => (
            <h4 className="text-sm md:text-base font-medium mb-1 text-white mt-2" {...props} />
          ),
          p: ({node, ...props}) => (
            <p className="text-xs md:text-sm mb-4" {...props} />
          ),
          li: ({node, ...props}) => (
            <li className="text-xs md:text-sm mb-1" {...props} />
          ),
          ul: ({node, ...props}) => (
            <ul className="list-disc pl-5 mb-4" {...props} />
          ),
          ol: ({node, ...props}) => (
            <ol className="list-decimal pl-5 mb-4" {...props} />
          ),
          blockquote: ({node, ...props}) => (
            <blockquote className="border-l-4 border-[#DCC5A2] pl-4 italic my-4 text-xs md:text-sm" {...props} />
          ),
          table: ({node, ...props}) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full divide-y divide-gray-700 text-xs md:text-sm" {...props} />
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