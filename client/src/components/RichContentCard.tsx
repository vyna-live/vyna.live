import React from 'react';

export interface VisualData {
  type: 'chart' | 'table' | 'card' | 'image' | 'audio';
  data: any;
  title?: string;
  description?: string;
}

interface RichContentCardProps {
  content: string;
  visualizations: VisualData[];
  className?: string;
}

const RichContentCard: React.FC<RichContentCardProps> = ({ 
  content, 
  visualizations,
  className = ""
}) => {
  return (
    <div className={`rounded-xl px-4 py-3.5 ${className}`}>
      {/* Text content */}
      <div className="prose prose-invert max-w-none mb-4">
        {content.split('\n').map((line, i) => (
          <p key={i} className="m-0 mb-2 last:mb-0">{line}</p>
        ))}
      </div>
      
      {/* Visualizations */}
      {visualizations.length > 0 && (
        <div className="space-y-4 mt-4 pt-4 border-t border-gray-700">
          {visualizations.map((visual, index) => (
            <div key={index} className="visualization-container">
              {visual.title && (
                <h3 className="text-sm font-medium mb-2">{visual.title}</h3>
              )}
              
              {/* Visualization content based on type */}
              {visual.type === 'chart' && (
                <div className="bg-[#1A1A1A] p-3 rounded-lg">
                  <div className="text-center text-sm text-gray-400">
                    [Chart visualization]
                    {/* In a real implementation, we would render charts with a library like ECharts */}
                  </div>
                </div>
              )}
              
              {visual.type === 'table' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-[#1A1A1A]">
                      <tr>
                        {visual.data.headers?.map((header: string, i: number) => (
                          <th 
                            key={i} 
                            className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-[#262626] divide-y divide-gray-700">
                      {visual.data.rows?.map((row: string[], i: number) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-[#262626]' : 'bg-[#2A2A2A]'}>
                          {row.map((cell, j) => (
                            <td key={j} className="px-3 py-2 text-xs text-gray-300">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {visual.type === 'card' && (
                <div className="bg-[#1A1A1A] p-3 rounded-lg">
                  <h4 className="text-sm font-medium mb-1">{visual.data.title}</h4>
                  <p className="text-xs text-gray-400">{visual.data.description}</p>
                </div>
              )}
              
              {visual.type === 'image' && (
                <div className="bg-[#1A1A1A] p-3 rounded-lg">
                  <div className="text-center text-sm text-gray-400">
                    [Image visualization]
                    {/* In a real implementation, we would render the image */}
                  </div>
                </div>
              )}
              
              {visual.type === 'audio' && (
                <div className="bg-[#1A1A1A] p-3 rounded-lg">
                  <div className="text-center text-sm text-gray-400">
                    [Audio player]
                    {/* In a real implementation, we would render an audio player */}
                  </div>
                </div>
              )}
              
              {visual.description && (
                <p className="text-xs text-gray-400 mt-2">{visual.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RichContentCard;