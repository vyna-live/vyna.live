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

  // Process markdown tables in the content (format: | Col1 | Col2 | etc)
  try {
    const tableRegex = /\|(.+)\|\n\|([-:]+\|)+\n((?:\|.+\|\n?)+)/g;
    const tableMatches = Array.from(content.matchAll(tableRegex));
    
    for (const match of tableMatches) {
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
  
  // Process statistical data in paragraphs (for 1-10 rankings)
  try {
    // Look for numbered lists like '1. Player Name - 20 goals'
    const statListRegex = /(\d+\.\s*[\w\s]+?[\s\-]+\d+\s*(?:goals|points|assists|games)[\s\.\,]*\n?){3,}/gi;
    const statListMatches = Array.from(content.matchAll(statListRegex));
    
    for (const match of statListMatches) {
      const statContent = match[0];
      const statIndex = visualizations.length;
      
      const rows: string[][] = [];
      const lines = statContent.split('\n');
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        // Try to extract player, rank, and statistic
        const itemMatch = line.match(/(\d+)\.?\s*(.*?)[\s\-]+(\d+)\s*(goals|points|assists|games)/i);
        if (itemMatch) {
          const [, rank, name, value, statType] = itemMatch;
          rows.push([rank, name.trim(), `${value} ${statType}`]);
        }
      }
      
      if (rows.length > 0) {
        // Determine if this is about goals, points, etc.
        const statType = rows[0][2].match(/(goals|points|assists|games)/i)?.[0] || 'Statistics';
        
        visualizations.push({
          type: 'table',
          data: {
            headers: ['Rank', 'Player', statType.charAt(0).toUpperCase() + statType.slice(1)],
            rows
          },
          title: `Top ${rows.length} ${statType}`
        });
        
        // Replace in the text
        cleanText = cleanText.replace(statContent, `[${statType.charAt(0).toUpperCase() + statType.slice(1)} Table]\n\n`);
      }
    }
  } catch (error) {
    console.error('Error processing stats paragraphs:', error);
  }
  
  // Process code blocks that might contain chart data
  try {
    const codeBlockRegex = /```(?:json|javascript|js)?\s*\n([\s\S]*?)\n```/g;
    const codeMatches = Array.from(content.matchAll(codeBlockRegex));
    
    for (const match of codeMatches) {
      const codeContent = match[0];
      const codeData = match[1];
      
      try {
        // Try to parse the code block as JSON
        let jsonData;
        
        // Clean up the code data first (sometimes it has comments or trailing commas)
        const cleanedCode = codeData
          .replace(/\/\/.*$/gm, '') // Remove single line comments
          .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multiline comments
          .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
          .trim();
        
        // Try to parse the JSON data
        try {
          jsonData = JSON.parse(cleanedCode);
        } catch (e) {
          // If that fails, try to evaluate it as JavaScript
          try {
            // Add protection to prevent arbitrary code execution
            if (!cleanedCode.includes('function') && 
                !cleanedCode.includes('eval') && 
                !cleanedCode.includes('require') &&
                !cleanedCode.includes('import')) {
              // Use Function constructor to evaluate, which is safer than eval
              jsonData = new Function(`return ${cleanedCode}`)();
            }
          } catch (evalError) {
            // Could not parse as JS either
            console.error('Could not parse code as JS:', evalError);
          }
        }
        
        if (jsonData) {
          // Check if it looks like chart data
          const isChartData = jsonData.type === 'chart' || 
            jsonData.chart || 
            jsonData.labels || 
            jsonData.datasets || 
            jsonData.series ||
            (Array.isArray(jsonData) && jsonData.every(item => 
              typeof item === 'object' && 
              (item.name || item.label) && 
              (typeof item.value === 'number' || typeof item.data === 'number')
            ));
            
          if (isChartData) {
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
        }
      } catch (e) {
        console.error('Failed to process potential chart data:', e);
      }
    }
  } catch (error) {
    console.error('Error processing code blocks:', error);
  }
  
  // Process image references
  try {
    const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
    const imageMatches = Array.from(content.matchAll(imageRegex));
    
    for (const match of imageMatches) {
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
  
  // Look for specific patterns in the text that might indicate data suitable for visualization
  try {
    // If we detect something like "Here are the top players:" followed by a numbered list
    // but it wasn't caught by the previous regex
    const playerListRegex = /(?:top|best|leading).*?(?:players|scorers|goalscorers).*?:\s*\n\s*(?:\d+\.\s*[\w\s]+[\s\:]+\d+.*?\n)+/gi;
    const playerMatches = Array.from(content.matchAll(playerListRegex));
    
    for (const match of playerMatches) {
      const listContent = match[0];
      
      // Check if this content was already processed as a visualization
      let alreadyProcessed = false;
      for (const viz of visualizations) {
        if (cleanText.indexOf(viz.title || '') === -1) {
          alreadyProcessed = true;
          break;
        }
      }
      
      if (!alreadyProcessed) {
        const listIndex = visualizations.length;
        const lines = listContent.split('\n').filter(line => line.trim());
        const dataRows: string[][] = [];
        
        // Extract player and score info
        for (const line of lines.slice(1)) { // Skip the header line
          const itemMatch = line.match(/(\d+)\.?\s*(.*?)[\s\:]+(\d+)/);
          if (itemMatch) {
            const [, rank, name, value] = itemMatch;
            dataRows.push([rank, name.trim(), value]);
          }
        }
        
        if (dataRows.length > 0) {
          // Create a title based on content
          const titleMatch = listContent.match(/(?:top|best|leading).*?(?:players|scorers|goalscorers)/i);
          const title = titleMatch ? titleMatch[0].trim() : `Top Players ${listIndex + 1}`;
          
          visualizations.push({
            type: 'table',
            data: {
              headers: ['Rank', 'Player', 'Count'],
              rows: dataRows
            },
            title
          });
          
          cleanText = cleanText.replace(listContent, `[${title}]\n\n`);
        }
      }
    }
  } catch (error) {
    console.error('Error processing player lists:', error);
  }
  
  return {
    cleanText: cleanText.trim(),
    visualizations
  };
}