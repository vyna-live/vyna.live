// Type definitions for the application

// Notes
export interface Note {
  id: number;
  hostId: number;
  title: string;
  content: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// Legacy AI Chat type
export interface AiChat {
  id: number;
  hostId: number;
  message: string;
  response: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt?: string;
}

// New AI Chat Session type
export interface AiChatSession {
  id: number;
  hostId: number;
  title: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// AI Chat Message type
export interface AiChatMessage {
  id: number;
  sessionId: number;
  role: 'user' | 'assistant';
  content: string;
  isDeleted: boolean;
  createdAt: string;
}

// UI interface types
export interface UIMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
}
