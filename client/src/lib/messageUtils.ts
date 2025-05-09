import { VisualData } from '@/components/RichContentCard';
import processAIContent from '@/services/visualizationProcessor';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  visualizations?: VisualData[];
}

export interface NotepadEntry {
  id: string;
  title: string;
  content: string;
  timestamp: Date;
  tags?: string[];
  visualizations?: VisualData[];
}

/**
 * Takes an AI response message and processes it for both content and visualizations
 */
export function processMessageContent(message: Message): Message {
  if (message.role !== 'assistant') {
    return message;
  }
  
  // Process content for visualizations
  const { cleanText, visualizations } = processAIContent(message.content);
  
  return {
    ...message,
    content: cleanText,
    visualizations
  };
}

/**
 * Takes a notepad entry and processes it for visualizations
 */
export function processNotepadContent(note: NotepadEntry): NotepadEntry {
  // Process content for visualizations
  const { cleanText, visualizations } = processAIContent(note.content);
  
  return {
    ...note,
    content: cleanText,
    visualizations
  };
}

/**
 * Extracts tags from notepad content
 */
export function extractNoteTags(content: string): string[] {
  const tags = [];
  const hashTagRegex = /#([a-zA-Z0-9_]+)/g;
  let match;
  
  while ((match = hashTagRegex.exec(content)) !== null) {
    tags.push(match[1]);
  }
  
  return [...new Set(tags)]; // Remove duplicates
}

/**
 * Utility to safely add visualization data to existing content
 */
export function addVisualizationToContent(content: string, visualization: VisualData): string {
  // Add visualization mark at the end of the content
  if (visualization.type === 'chart') {
    return `${content}\n\n\`\`\`chart\n${JSON.stringify(visualization.data, null, 2)}\n\`\`\``;
  } else if (visualization.type === 'table') {
    const tableData = visualization.data;
    const headers = tableData.headers.join(' | ');
    const separator = tableData.headers.map(() => '---').join(' | ');
    const rows = tableData.rows.map(row => row.join(' | ')).join('\n');
    
    return `${content}\n\n\`\`\`table\n${headers}\n${separator}\n${rows}\n\`\`\``;
  } else if (visualization.type === 'image') {
    return `${content}\n\n![${visualization.description || ''}](${visualization.data.url})`;
  }
  
  return content;
}

/**
 * Utility to safely merge visualization data from one content to another
 */
export function mergeVisualizations(targetContent: string, sourceVisualizations: VisualData[]): string {
  let updatedContent = targetContent;
  
  sourceVisualizations.forEach(visual => {
    updatedContent = addVisualizationToContent(updatedContent, visual);
  });
  
  return updatedContent;
}