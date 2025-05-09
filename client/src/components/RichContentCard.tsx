import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import EChartsReact from 'echarts-for-react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

// Type definition for visual data
export interface VisualData {
  type: 'chart' | 'image' | 'table' | 'card' | 'audio';
  data: any;
  title?: string;
  description?: string;
}

interface RichContentCardProps {
  content: string;
  visualizations?: VisualData[];
  className?: string;
}

const RichContentCard: React.FC<RichContentCardProps> = ({ 
  content, 
  visualizations = [],
  className
}) => {
  return (
    <Card className={cn("overflow-hidden bg-white/5 backdrop-blur-md border-white/10", className)}>
      <CardContent className="p-6">
        {/* Main text content */}
        <div className="prose prose-invert max-w-none">
          <ReactMarkdown
            rehypePlugins={[rehypeRaw, rehypeSanitize]}
            remarkPlugins={[remarkGfm]}
          >
            {content}
          </ReactMarkdown>
        </div>
        
        {/* Visualizations section */}
        {visualizations.length > 0 && (
          <div className="mt-6 space-y-6">
            {visualizations.map((visual, index) => (
              <div key={index} className="rounded-lg overflow-hidden">
                {visual.title && (
                  <h3 className="text-lg font-medium mb-2 text-white/90">{visual.title}</h3>
                )}
                
                {visual.type === 'chart' && (
                  <div className="h-[300px] w-full bg-black/20 rounded-lg overflow-hidden">
                    <EChartsReact
                      option={visual.data}
                      style={{ height: '100%', width: '100%' }}
                      className="w-full h-full"
                    />
                  </div>
                )}
                
                {visual.type === 'image' && (
                  <div className="relative rounded-lg overflow-hidden">
                    <img 
                      src={visual.data.url} 
                      alt={visual.description || 'AI generated image'} 
                      className="w-full h-auto object-cover rounded-lg"
                    />
                  </div>
                )}
                
                {visual.type === 'table' && (
                  <div className="overflow-x-auto bg-black/20 rounded-lg">
                    <table className="min-w-full divide-y divide-white/10">
                      <thead>
                        <tr>
                          {visual.data.headers.map((header: string, i: number) => (
                            <th 
                              key={i}
                              className="px-4 py-3 text-left text-sm font-medium text-white/80 uppercase tracking-wider"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {visual.data.rows.map((row: string[], i: number) => (
                          <tr key={i} className={i % 2 === 0 ? 'bg-black/10' : 'bg-black/20'}>
                            {row.map((cell, j) => (
                              <td key={j} className="px-4 py-3 text-sm text-white/70">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {visual.type === 'audio' && (
                  <div className="bg-black/20 p-4 rounded-lg">
                    <audio 
                      controls 
                      src={visual.data.url} 
                      className="w-full"
                    />
                    {visual.description && (
                      <p className="mt-2 text-sm text-white/70">{visual.description}</p>
                    )}
                  </div>
                )}
                
                {visual.type === 'card' && (
                  <div className="bg-black/20 p-4 rounded-lg">
                    <h4 className="font-medium text-white/90">{visual.data.title}</h4>
                    <p className="mt-1 text-sm text-white/70">{visual.data.content}</p>
                  </div>
                )}
                
                {visual.description && visual.type !== 'audio' && (
                  <p className="mt-2 text-sm text-white/70">{visual.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 flex justify-end">
          <div className="h-6 w-20 flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="Vyna.live Logo" 
              className="h-4 opacity-50 hover:opacity-100 transition-opacity duration-300"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RichContentCard;