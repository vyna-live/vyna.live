import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { EChartsOption } from 'echarts';

type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'scatter';

type ChartData = {
  type: 'chart';
  chartType: ChartType;
  data: any[];
  xKey: string;
  yKeys: string[];
  colors?: string[];
  width?: number;
  height?: number;
  title?: string;
  subtitle?: string;
}

interface EnhancedChartRendererProps {
  chartData: ChartData;
  darkMode?: boolean;
}

const EnhancedChartRenderer: React.FC<EnhancedChartRendererProps> = ({ 
  chartData, 
  darkMode = true 
}) => {
  // Create ECharts options based on chartData
  const options: EChartsOption = useMemo(() => {
    const { chartType, data, xKey, yKeys, title, subtitle } = chartData;
    
    // Define colors for dark/light modes with special Vyna palette for light mode
    const colors = chartData.colors || (darkMode 
      ? ['#67e8f9', '#7dd3fc', '#c4b5fd', '#f0abfc', '#fda4af', '#fcd34d', '#86efac', '#d1d5db']
      : ['#A67D44', '#8A1538', '#744634', '#354F52', '#5E6472', '#9A7C60', '#63503C', '#D9A05B']
    );
    
    // Common options for all chart types
    const baseOptions: EChartsOption = {
      title: title ? {
        text: title,
        subtext: subtitle,
        left: 'center',
        textStyle: {
          color: darkMode ? '#DCC5A2' : '#334155',
          fontWeight: 'bold'
        },
        subtextStyle: {
          color: darkMode ? '#94a3b8' : '#64748b'
        }
      } : undefined,
      tooltip: {
        trigger: chartType === 'pie' ? 'item' : 'axis',
        backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)',
        borderColor: darkMode ? '#334155' : '#e2e8f0',
        textStyle: {
          color: darkMode ? '#e2e8f0' : '#334155'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      textStyle: {
        color: darkMode ? '#e2e8f0' : '#334155'
      },
      backgroundColor: 'transparent'
    };
    
    // Chart type specific options
    switch (chartType) {
      case 'bar': {
        return {
          ...baseOptions,
          xAxis: {
            type: 'category',
            data: data.map(item => item[xKey]),
            axisLine: {
              lineStyle: {
                color: darkMode ? '#475569' : '#cbd5e1'
              }
            },
            axisLabel: {
              color: darkMode ? '#94a3b8' : '#64748b'
            }
          },
          yAxis: {
            type: 'value',
            axisLine: {
              lineStyle: {
                color: darkMode ? '#475569' : '#cbd5e1'
              }
            },
            axisLabel: {
              color: darkMode ? '#94a3b8' : '#64748b'
            },
            splitLine: {
              lineStyle: {
                color: darkMode ? '#1e293b' : '#f1f5f9'
              }
            }
          },
          series: yKeys.map((key, index) => ({
            name: key,
            type: 'bar',
            data: data.map(item => item[key]),
            color: colors[index % colors.length],
            emphasis: {
              focus: 'series'
            },
            animationDelay: (idx: number) => idx * 100,
            barMaxWidth: '50%'
          })),
          legend: {
            data: yKeys,
            bottom: 0,
            textStyle: {
              color: darkMode ? '#94a3b8' : '#64748b'
            }
          },
          animationEasing: 'elasticOut',
          animationDelayUpdate: (idx: number) => idx * 5
        };
      }
      
      case 'line': {
        return {
          ...baseOptions,
          xAxis: {
            type: 'category',
            data: data.map(item => item[xKey]),
            boundaryGap: false,
            axisLine: {
              lineStyle: {
                color: darkMode ? '#475569' : '#cbd5e1'
              }
            },
            axisLabel: {
              color: darkMode ? '#94a3b8' : '#64748b'
            }
          },
          yAxis: {
            type: 'value',
            axisLine: {
              lineStyle: {
                color: darkMode ? '#475569' : '#cbd5e1'
              }
            },
            axisLabel: {
              color: darkMode ? '#94a3b8' : '#64748b'
            },
            splitLine: {
              lineStyle: {
                color: darkMode ? '#1e293b' : '#f1f5f9'
              }
            }
          },
          series: yKeys.map((key, index) => ({
            name: key,
            type: 'line',
            data: data.map(item => item[key]),
            color: colors[index % colors.length],
            smooth: true,
            symbolSize: 6,
            emphasis: {
              focus: 'series',
              itemStyle: {
                shadowBlur: 10,
                shadowColor: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'
              }
            },
            areaStyle: (() => {
              // Using a function to avoid the TypeScript error
              if (chartData.chartType === 'area') {
                return { opacity: 0.2 };
              }
              return undefined;
            })(),
            lineStyle: {
              width: 3
            }
          })),
          legend: {
            data: yKeys,
            bottom: 0,
            textStyle: {
              color: darkMode ? '#94a3b8' : '#64748b'
            }
          }
        };
      }
      
      case 'area': {
        // Area chart is just a line chart with areaStyle
        return {
          ...baseOptions,
          xAxis: {
            type: 'category',
            data: data.map(item => item[xKey]),
            boundaryGap: false,
            axisLine: {
              lineStyle: {
                color: darkMode ? '#475569' : '#cbd5e1'
              }
            },
            axisLabel: {
              color: darkMode ? '#94a3b8' : '#64748b'
            }
          },
          yAxis: {
            type: 'value',
            axisLine: {
              lineStyle: {
                color: darkMode ? '#475569' : '#cbd5e1'
              }
            },
            axisLabel: {
              color: darkMode ? '#94a3b8' : '#64748b'
            },
            splitLine: {
              lineStyle: {
                color: darkMode ? '#1e293b' : '#f1f5f9'
              }
            }
          },
          series: yKeys.map((key, index) => ({
            name: key,
            type: 'line',
            data: data.map(item => item[key]),
            color: colors[index % colors.length],
            smooth: true,
            symbolSize: 6,
            emphasis: {
              focus: 'series'
            },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [{
                  offset: 0, 
                  color: colors[index % colors.length]
                }, {
                  offset: 1, 
                  color: darkMode 
                    ? 'rgba(0, 0, 0, 0.01)' 
                    : 'rgba(255, 255, 255, 0.01)'
                }]
              },
              opacity: 0.3
            }
          })),
          legend: {
            data: yKeys,
            bottom: 0,
            textStyle: {
              color: darkMode ? '#94a3b8' : '#64748b'
            }
          }
        };
      }
      
      case 'pie': {
        return {
          ...baseOptions,
          series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '50%'],
            avoidLabelOverlap: true,
            itemStyle: {
              borderColor: darkMode ? '#111827' : '#ffffff',
              borderWidth: 2
            },
            label: {
              show: true,
              formatter: '{b}: {c} ({d}%)',
              color: darkMode ? '#e2e8f0' : '#334155'
            },
            emphasis: {
              label: {
                show: true,
                fontWeight: 'bold',
                fontSize: 16
              },
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'
              }
            },
            data: data.map((item, index) => ({
              name: item[xKey],
              value: item[yKeys[0]],
              itemStyle: {
                color: colors[index % colors.length]
              }
            }))
          }],
          legend: {
            orient: 'horizontal',
            bottom: 0,
            data: data.map(item => item[xKey]),
            textStyle: {
              color: darkMode ? '#94a3b8' : '#64748b'
            }
          }
        };
      }
      
      default:
        return baseOptions;
    }
  }, [chartData, darkMode]);

  const eChartsStyle: React.CSSProperties = {
    height: chartData.height || 400,
    width: '100%',
    maxWidth: chartData.width || '100%'
  };

  return (
    <div className="echarts-wrapper my-6">
      <ReactECharts 
        option={options} 
        style={eChartsStyle}
        className="rounded-lg overflow-hidden"
      />
    </div>
  );
};

export default EnhancedChartRenderer;