import { VisualData } from '@/components/RichContentCard';

interface ProcessedContent {
  cleanText: string;
  visualizations: VisualData[];
}

/**
 * Processes AI response text to extract visualizations and clean up the text
 */
export default function processAIContent(content: string): ProcessedContent {
  if (!content) {
    return { cleanText: '', visualizations: [] };
  }

  const visualizations: VisualData[] = [];
  let cleanText = content;

  // Process tables in the content
  try {
    const tableRegex = /\|(.+)\|\n\|([-:]+\|)+\n((?:\|.+\|\n)+)/g;
    const tableMatches = content.matchAll(tableRegex);
    
    for (const match of Array.from(tableMatches)) {
      const tableContent = match[0];
      const tableIndex = visualizations.length;
      
      // Extract table data
      const lines = tableContent.trim().split('\n');
      const headers = lines[0].split('|').filter(cell => cell.trim() !== '').map(h => h.trim());
      
      // Process table rows
      const rows: string[][] = [];
      for (let i = 2; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim() === '') continue;
        
        const cells = line.split('|').filter(cell => cell.trim() !== '').map(cell => cell.trim());
        rows.push(cells);
      }
      
      // Add table visualization
      visualizations.push({
        type: 'table',
        data: { headers, rows },
        title: `Table ${tableIndex + 1}`
      });
      
      // Replace table in the content with a reference
      cleanText = cleanText.replace(tableContent, `[Table ${tableIndex + 1}]\n\n`);
    }
  } catch (error) {
    console.error('Error processing tables:', error);
  }
  
  // Process code blocks that might contain chart data
  try {
    const codeBlockRegex = /```(?:json|javascript)?\s*\n([\s\S]*?)\n```/g;
    const codeMatches = content.matchAll(codeBlockRegex);
    
    for (const match of Array.from(codeMatches)) {
      const codeContent = match[0];
      const codeData = match[1];
      
      try {
        // Try to parse the code block as JSON
        const jsonData = JSON.parse(codeData);
        
        // Check if it looks like chart data
        if (jsonData.type === 'chart' || 
            jsonData.chart || 
            jsonData.labels || 
            jsonData.datasets || 
            jsonData.series) {
          
          const chartIndex = visualizations.length;
          
          // Add chart visualization
          visualizations.push({
            type: 'chart',
            data: jsonData,
            title: jsonData.title || `Chart ${chartIndex + 1}`
          });
          
          // Replace code block with a reference
          cleanText = cleanText.replace(codeContent, `[Chart ${chartIndex + 1}]\n\n`);
        }
      } catch (e) {
        // Not valid JSON, ignore
      }
    }
  } catch (error) {
    console.error('Error processing code blocks:', error);
  }
  
  // Process image references
  try {
    const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
    const imageMatches = content.matchAll(imageRegex);
    
    for (const match of Array.from(imageMatches)) {
      const imageMarkdown = match[0];
      const altText = match[1];
      const imageUrl = match[2];
      
      const imageIndex = visualizations.length;
      
      // Add image visualization
      visualizations.push({
        type: 'image',
        data: { url: imageUrl },
        title: altText || `Image ${imageIndex + 1}`
      });
      
      // Replace image markdown with a reference
      cleanText = cleanText.replace(imageMarkdown, `[Image: ${altText || `Image ${imageIndex + 1}`}]\n\n`);
    }
  } catch (error) {
    console.error('Error processing images:', error);
  }
  
  return {
    cleanText: cleanText.trim(),
    visualizations
  };
}