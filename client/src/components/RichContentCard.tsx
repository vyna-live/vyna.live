import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';

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
                <ChartVisualization data={visual.data} />
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
                  {visual.data.url ? (
                    <img 
                      src={visual.data.url} 
                      alt={visual.title || "Image"} 
                      className="max-w-full h-auto rounded"
                    />
                  ) : (
                    <div className="text-center text-sm text-gray-400 py-6">
                      [Image visualization placeholder]
                    </div>
                  )}
                </div>
              )}
              
              {visual.type === 'audio' && (
                <div className="bg-[#1A1A1A] p-3 rounded-lg">
                  {visual.data.url ? (
                    <audio controls className="w-full">
                      <source src={visual.data.url} />
                      Your browser does not support the audio element.
                    </audio>
                  ) : (
                    <div className="text-center text-sm text-gray-400 py-4">
                      [Audio player placeholder]
                    </div>
                  )}
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

// Helper component for chart visualizations
const ChartVisualization: React.FC<{ data: any }> = ({ data }) => {
  const [chartOptions, setChartOptions] = useState<any>(null);
  
  useEffect(() => {
    // Process the data to create a valid ECharts option
    let options: any = {};
    
    try {
      // If data is already in ECharts format
      if (data.xAxis || data.series || data.dataset) {
        options = { ...data };
        
        // Set theme defaults
        if (!options.backgroundColor) {
          options.backgroundColor = 'transparent';
        }
        
        if (!options.textStyle) {
          options.textStyle = { color: '#ccc' };
        }
        
        if (options.xAxis && !options.xAxis.axisLine) {
          if (Array.isArray(options.xAxis)) {
            options.xAxis = options.xAxis.map((axis: any) => ({
              ...axis,
              axisLine: { lineStyle: { color: '#555' } },
              axisTick: { lineStyle: { color: '#555' } },
              axisLabel: { color: '#aaa' }
            }));
          } else {
            options.xAxis = {
              ...options.xAxis,
              axisLine: { lineStyle: { color: '#555' } },
              axisTick: { lineStyle: { color: '#555' } },
              axisLabel: { color: '#aaa' }
            };
          }
        }
        
        if (options.yAxis && !options.yAxis.axisLine) {
          if (Array.isArray(options.yAxis)) {
            options.yAxis = options.yAxis.map((axis: any) => ({
              ...axis,
              axisLine: { lineStyle: { color: '#555' } },
              axisTick: { lineStyle: { color: '#555' } },
              axisLabel: { color: '#aaa' }
            }));
          } else {
            options.yAxis = {
              ...options.yAxis,
              axisLine: { lineStyle: { color: '#555' } },
              axisTick: { lineStyle: { color: '#555' } },
              axisLabel: { color: '#aaa' }
            };
          }
        }
      }
      // Convert format for bar/line charts with labels and datasets
      else if (data.labels && (data.datasets || data.series)) {
        const labels = data.labels;
        const series = data.datasets || data.series;
        
        options = {
          backgroundColor: 'transparent',
          textStyle: { color: '#ccc' },
          tooltip: { trigger: 'axis' },
          legend: {
            data: series.map((s: any) => s.label || s.name),
            textStyle: { color: '#aaa' }
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
          },
          xAxis: {
            type: 'category',
            data: labels,
            axisLine: { lineStyle: { color: '#555' } },
            axisTick: { lineStyle: { color: '#555' } },
            axisLabel: { color: '#aaa' }
          },
          yAxis: {
            type: 'value',
            axisLine: { lineStyle: { color: '#555' } },
            axisTick: { lineStyle: { color: '#555' } },
            axisLabel: { color: '#aaa' }
          },
          series: series.map((s: any) => ({
            name: s.label || s.name,
            type: s.type || 'bar',
            data: s.data,
            itemStyle: { color: s.backgroundColor || s.color }
          }))
        };
      }
      // Convert arrays of objects with name/value pairs (common in API responses)
      else if (Array.isArray(data)) {
        if (data.every((item: any) => item.name && (typeof item.value !== 'undefined'))) {
          // Pie chart format
          options = {
            backgroundColor: 'transparent',
            textStyle: { color: '#ccc' },
            tooltip: {
              trigger: 'item',
              formatter: '{a} <br/>{b}: {c} ({d}%)'
            },
            legend: {
              orient: 'vertical',
              left: 10,
              data: data.map((item: any) => item.name),
              textStyle: { color: '#aaa' }
            },
            series: [
              {
                name: 'Data',
                type: 'pie',
                radius: ['50%', '70%'],
                avoidLabelOverlap: false,
                label: {
                  show: false,
                  position: 'center'
                },
                emphasis: {
                  label: {
                    show: true,
                    fontSize: '18',
                    fontWeight: 'bold'
                  }
                },
                labelLine: {
                  show: false
                },
                data: data
              }
            ]
          };
        } else if (data.length > 0 && typeof data[0] === 'object') {
          // Extract keys for bar/line chart
          const keys = Object.keys(data[0]).filter(k => typeof data[0][k] === 'number');
          const categoryKey = Object.keys(data[0]).find(k => typeof data[0][k] === 'string') || '';
          
          if (categoryKey && keys.length) {
            options = {
              backgroundColor: 'transparent',
              textStyle: { color: '#ccc' },
              tooltip: { trigger: 'axis' },
              legend: {
                data: keys,
                textStyle: { color: '#aaa' }
              },
              grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
              },
              xAxis: {
                type: 'category',
                data: data.map((item: any) => item[categoryKey]),
                axisLine: { lineStyle: { color: '#555' } },
                axisTick: { lineStyle: { color: '#555' } },
                axisLabel: { color: '#aaa', rotate: data.length > 8 ? 45 : 0 }
              },
              yAxis: {
                type: 'value',
                axisLine: { lineStyle: { color: '#555' } },
                axisTick: { lineStyle: { color: '#555' } },
                axisLabel: { color: '#aaa' }
              },
              series: keys.map(key => ({
                name: key,
                type: 'bar',
                data: data.map((item: any) => item[key])
              }))
            };
          }
        }
      }
      
      // Fallback if we couldn't determine the chart type
      if (!options.series && !options.dataset) {
        options = {
          backgroundColor: 'transparent',
          textStyle: { color: '#ccc' },
          title: {
            text: 'Chart Data',
            left: 'center',
            textStyle: { color: '#ccc' }
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
          },
          xAxis: {
            type: 'category',
            data: ['Data not in recognized format'],
            axisLine: { lineStyle: { color: '#555' } },
            axisTick: { lineStyle: { color: '#555' } },
            axisLabel: { color: '#aaa' }
          },
          yAxis: {
            type: 'value',
            axisLine: { lineStyle: { color: '#555' } },
            axisTick: { lineStyle: { color: '#555' } },
            axisLabel: { color: '#aaa' }
          },
          series: [{
            data: [0],
            type: 'bar'
          }]
        };
      }
      
      setChartOptions(options);
    } catch (e) {
      console.error('Error processing chart data:', e);
      
      // Provide fallback for error
      setChartOptions({
        backgroundColor: 'transparent',
        textStyle: { color: '#ccc' },
        title: {
          text: 'Error Processing Chart Data',
          left: 'center',
          textStyle: { color: '#ccc' }
        },
        series: []
      });
    }
  }, [data]);
  
  if (!chartOptions) {
    return (
      <div className="bg-[#1A1A1A] p-3 rounded-lg text-center text-sm text-gray-400 py-6">
        Processing chart data...
      </div>
    );
  }
  
  return (
    <div className="bg-[#1A1A1A] p-3 rounded-lg">
      <ReactECharts 
        option={chartOptions} 
        style={{ height: '300px', width: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  );
};

export default RichContentCard;