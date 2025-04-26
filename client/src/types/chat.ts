export interface InfoGraphic {
  title: string;
  content: string;
  imageUrl?: string;
}

export interface MessageType {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  hasInfoGraphic?: boolean;
  infoGraphicData?: InfoGraphic;
}