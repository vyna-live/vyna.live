/**
 * Response Enhancer Service
 * Processes AI responses to enhance them with rich visualizations and content
 */
import { 
  extractChartData, 
  generateChart,
  analyzeTextForVisualizationPatterns 
} from './chartGenerator';

interface Visualization {
  type: string;
  data: any;
}

interface EnhancerResult {
  enhancedText: string;
  visualizations: Visualization[];
}

/**
 * Process response text to identify data that could be visualized
 * and convert it into enhanced format with visualization JSON
 */
export function enhanceResponse(text: string): EnhancerResult {
  let enhancedText = text;
  const visualizations: Visualization[] = [];

  // Check if the response already has chart JSON blocks
  if (text.includes('```json') && 
      (text.includes('"type":"chart"') || 
       text.includes('"type": "chart"'))) {
    // Response already contains chart JSON, no need to enhance
    return { enhancedText, visualizations };
  }

  // Extract tables and convert them to chart data where appropriate
  const tables = extractTables(text);
  for (const table of tables) {
    try {
      const chartData = extractChartData(table);
      
      if (chartData) {
        const chartJson = generateChart(chartData);
        
        if (chartJson) {
          const chartJsonString = 
            '```json\n' +
            JSON.stringify(chartJson, null, 2) +
            '\n```';
          
          // Add the chart JSON after the table
          const tableEndIndex = text.indexOf(table) + table.length;
          enhancedText = 
            enhancedText.substring(0, tableEndIndex) + 
            '\n\n' + chartJsonString + 
            enhancedText.substring(tableEndIndex);
          
          visualizations.push({
            type: 'chart',
            data: chartJson
          });
        }
      }
    } catch (error) {
      console.error('Error enhancing table to chart:', error);
    }
  }

  // Look for numeric data patterns that could be visualized
  enhancedText = enhanceNumericData(enhancedText, visualizations);

  // Add information cards for important points
  enhancedText = enhanceWithInfoCards(enhancedText, visualizations);

  return { enhancedText, visualizations };
}

/**
 * Extract tables from markdown text
 */
function extractTables(text: string): string[] {
  const tables = [];
  const tableRegex = /\|(.+)\|[\r\n]+\|([-:\s|])+\|[\r\n]+((?:\|.+\|[\r\n]+)+)/g;
  
  let match;
  while ((match = tableRegex.exec(text)) !== null) {
    tables.push(match[0]);
  }
  
  return tables;
}

/**
 * Enhance numeric data in the text
 */
function enhanceNumericData(text: string, visualizations: Visualization[]): string {
  // Look for patterns like "X% of users..." or "The top 5 reasons are..."
  const percentagePattern = /(\d+)%\s+(?:of|for|in)\s+([^,.]+)/g;
  const rankingPattern = /(?:top|bottom)\s+(\d+)\s+([^,.]+)(?:\s+are|:)/gi;
  
  let enhancedText = text;
  
  // Handle percentage statements
  let percentMatch;
  const percentageData: { category: string, value: number }[] = [];
  
  while ((percentMatch = percentagePattern.exec(text)) !== null) {
    const percentage = parseInt(percentMatch[1]);
    const category = percentMatch[2].trim();
    
    if (!isNaN(percentage) && category) {
      percentageData.push({ category, value: percentage });
    }
  }
  
  // If we found enough percentage data, create a chart
  if (percentageData.length >= 2) {
    const chartJson = {
      type: 'chart',
      chartType: 'pie',
      data: percentageData,
      xKey: 'category',
      yKeys: ['value'],
      colors: ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c']
    };
    
    const chartJsonString = 
      '```json\n' +
      JSON.stringify(chartJson, null, 2) +
      '\n```';
    
    // Add chart at the end of the paragraph containing the first match
    const firstMatchPos = text.indexOf(percentageData[0].category);
    const paragraphEnd = text.indexOf('\n\n', firstMatchPos);
    const insertPos = paragraphEnd > firstMatchPos ? paragraphEnd : text.length;
    
    enhancedText = 
      enhancedText.substring(0, insertPos) + 
      '\n\n' + chartJsonString + 
      enhancedText.substring(insertPos);
    
    visualizations.push({
      type: 'chart',
      data: chartJson
    });
  }
  
  // Handle ranked lists
  let rankMatch;
  while ((rankMatch = rankingPattern.exec(text)) !== null) {
    // This indicates there might be a ranked list, but we'd need to extract the actual items
    // This is more complex and would require analyzing the following lines to extract the list items
    // Implementation would be more involved and may require natural language processing
  }
  
  return enhancedText;
}

/**
 * Add information cards for key insights
 */
function enhanceWithInfoCards(text: string, visualizations: Visualization[]): string {
  // Look for sections that might benefit from info cards
  const infoSectionPatterns = [
    { pattern: /(?:^|\n)(?:note|important|tip|warning|key insight)[:\s](.+?)(?:\n\n|$)/gi, type: 'info' },
    { pattern: /(?:^|\n)caution|warning|be careful[:\s](.+?)(?:\n\n|$)/gi, type: 'warning' },
    { pattern: /(?:^|\n)success|achievement|accomplishment[:\s](.+?)(?:\n\n|$)/gi, type: 'success' },
    { pattern: /(?:^|\n)error|problem|issue|fault[:\s](.+?)(?:\n\n|$)/gi, type: 'error' }
  ];
  
  let enhancedText = text;
  
  for (const { pattern, type } of infoSectionPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const content = match[1].trim();
      if (content.length > 10) {  // Only create cards for meaningful content
        const cardJson = {
          type: 'card',
          title: type.charAt(0).toUpperCase() + type.slice(1),
          content: content,
          cardType: type
        };
        
        const cardJsonString = 
          '```json\n' +
          JSON.stringify(cardJson, null, 2) +
          '\n```';
        
        // Replace the matched text with the info card
        enhancedText = enhancedText.replace(match[0], cardJsonString + '\n\n');
        
        visualizations.push({
          type: 'card',
          data: cardJson
        });
      }
    }
  }
  
  return enhancedText;
}