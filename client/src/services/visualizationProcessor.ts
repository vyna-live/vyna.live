import { VisualData } from '@/components/RichContentCard';

// Regular expressions to detect and extract visualization patterns
const CHART_REGEX = /```chart\s+([\s\S]+?)```/g;
const TABLE_REGEX = /```table\s+([\s\S]+?)```/g;
const IMAGE_REGEX = /!\[([^\]]*)\]\(([^)]+)\)/g;
const INFOGRAPHIC_REGEX = /```infographic\s+([\s\S]+?)```/g;
const CODE_REGEX = /```([a-zA-Z0-9]+)?\s*([\s\S]+?)```/g;

interface ProcessedContent {
  cleanText: string;
  visualizations: VisualData[];
}

/**
 * Processes AI response text to extract visualizations and clean up the text
 */
export function processAIContent(content: string): ProcessedContent {
  if (!content) {
    return { cleanText: '', visualizations: [] };
  }
  
  const visualizations: VisualData[] = [];
  let cleanText = content;

  // Extract chart definitions
  const chartMatches = [...content.matchAll(CHART_REGEX)];
  chartMatches.forEach((match, index) => {
    try {
      const chartData = JSON.parse(match[1]);
      visualizations.push({
        type: 'chart',
        data: chartData,
        title: chartData.title || `Chart ${index + 1}`
      });
      cleanText = cleanText.replace(match[0], 
        `**${chartData.title || `Chart ${index + 1}`}** *(Visualization available)*`);
    } catch (err) {
      console.error('Failed to parse chart data:', err);
    }
  });

  // Extract table definitions
  const tableMatches = [...content.matchAll(TABLE_REGEX)];
  tableMatches.forEach((match, index) => {
    try {
      const tableRaw = match[1].trim();
      const tableLines = tableRaw.split('\n');
      const headers = tableLines[0].split('|')
        .map(h => h.trim())
        .filter(h => h !== '');
      
      const rows = tableLines.slice(2).map(line => 
        line.split('|')
          .map(cell => cell.trim())
          .filter(cell => cell !== '')
      ).filter(row => row.length > 0);
      
      visualizations.push({
        type: 'table',
        data: { headers, rows },
        title: `Table ${index + 1}`
      });
      
      cleanText = cleanText.replace(match[0], 
        `**Table ${index + 1}** *(Visualization available)*`);
    } catch (err) {
      console.error('Failed to parse table data:', err);
    }
  });

  // Extract images
  const imageMatches = [...content.matchAll(IMAGE_REGEX)];
  imageMatches.forEach((match, index) => {
    const alt = match[1];
    const url = match[2];
    
    if (url && url.startsWith('http')) {
      visualizations.push({
        type: 'image',
        data: { url },
        title: `Image: ${alt || `Image ${index + 1}`}`,
        description: alt
      });
      
      cleanText = cleanText.replace(match[0], 
        `**Image: ${alt || `Image ${index + 1}`}** *(Visualization available)*`);
    }
  });

  // Extract infographics
  const infographicMatches = [...content.matchAll(INFOGRAPHIC_REGEX)];
  infographicMatches.forEach((match, index) => {
    try {
      const infoData = JSON.parse(match[1]);
      const chartConfig = generateInfographicChart(infoData);
      
      visualizations.push({
        type: 'chart',
        data: chartConfig,
        title: infoData.title || `Infographic ${index + 1}`
      });
      
      cleanText = cleanText.replace(match[0], 
        `**${infoData.title || `Infographic ${index + 1}`}** *(Visualization available)*`);
    } catch (err) {
      console.error('Failed to parse infographic data:', err);
    }
  });

  // Clean up general code blocks (not needed for visualization but needed for clean text)
  cleanText = cleanText.replace(CODE_REGEX, (match, language, code) => {
    return `\`\`\`${language || ''}\n${code}\n\`\`\``;
  });

  return { cleanText, visualizations };
}

/**
 * Converts infographic data into an ECharts configuration
 */
function generateInfographicChart(infoData: any): any {
  // Default to a bar chart if type is not specified
  const chartType = infoData.type || 'bar';
  
  // Basic chart configuration
  const chartConfig: any = {
    title: {
      text: infoData.title || '',
      left: 'center',
      textStyle: {
        color: '#fff'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    textStyle: {
      color: 'rgba(255, 255, 255, 0.8)'
    }
  };
  
  // Configure based on chart type
  if (chartType === 'bar') {
    // Data for bar chart
    const categories = infoData.data?.categories || [];
    const series = infoData.data?.series || [];
    
    chartConfig.xAxis = {
      type: 'category',
      data: categories,
      axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.3)' } },
      axisLabel: { color: 'rgba(255, 255, 255, 0.7)' }
    };
    
    chartConfig.yAxis = {
      type: 'value',
      axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.3)' } },
      axisLabel: { color: 'rgba(255, 255, 255, 0.7)' },
      splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } }
    };
    
    chartConfig.series = series.map((item: any) => ({
      name: item.name,
      type: 'bar',
      data: item.data,
      itemStyle: {
        color: item.color || '#A67D44'
      }
    }));
    
    chartConfig.legend = {
      data: series.map((item: any) => item.name),
      bottom: '0%',
      textStyle: {
        color: 'rgba(255, 255, 255, 0.7)'
      }
    };
  } else if (chartType === 'pie') {
    // Data for pie chart
    const seriesData = infoData.data?.series || [];
    
    chartConfig.series = [{
      type: 'pie',
      radius: '60%',
      center: ['50%', '50%'],
      data: seriesData,
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      },
      label: {
        color: 'rgba(255, 255, 255, 0.8)'
      }
    }];
    
    chartConfig.legend = {
      orient: 'horizontal',
      bottom: '0%',
      data: seriesData.map((item: any) => item.name),
      textStyle: {
        color: 'rgba(255, 255, 255, 0.7)'
      }
    };
  } else if (chartType === 'line') {
    // Data for line chart
    const categories = infoData.data?.categories || [];
    const series = infoData.data?.series || [];
    
    chartConfig.xAxis = {
      type: 'category',
      data: categories,
      axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.3)' } },
      axisLabel: { color: 'rgba(255, 255, 255, 0.7)' }
    };
    
    chartConfig.yAxis = {
      type: 'value',
      axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.3)' } },
      axisLabel: { color: 'rgba(255, 255, 255, 0.7)' },
      splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } }
    };
    
    chartConfig.series = series.map((item: any) => ({
      name: item.name,
      type: 'line',
      data: item.data,
      smooth: true,
      itemStyle: {
        color: item.color || '#A67D44'
      },
      lineStyle: {
        width: 3,
        color: item.color || '#A67D44'
      }
    }));
    
    chartConfig.legend = {
      data: series.map((item: any) => item.name),
      bottom: '0%',
      textStyle: {
        color: 'rgba(255, 255, 255, 0.7)'
      }
    };
  }
  
  return chartConfig;
}

export default processAIContent;