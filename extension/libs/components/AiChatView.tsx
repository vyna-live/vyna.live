import React, { useState, useEffect, useRef } from 'react';
import { getChatSessions, createChatSession, getChatMessages, sendChatMessage } from '@libs/utils/api';

interface AiChatViewProps {
  userId: number;
  pageContext: {
    url: string;
    title: string;
    content: string;
  } | null;
}

interface ChatSession {
  id: number;
  title: string;
  createdAt: string;
}

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const AiChatView: React.FC<AiChatViewProps> = ({ userId, pageContext }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [commentaryStyle, setCommentaryStyle] = useState<'play-by-play' | 'color'>('color');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Fetch chat sessions on component mount
  useEffect(() => {
    fetchChatSessions();
  }, []);
  
  // Fetch messages when active session changes
  useEffect(() => {
    if (activeSessionId) {
      fetchMessages(activeSessionId);
    }
  }, [activeSessionId]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const fetchChatSessions = async () => {
    try {
      setIsLoading(true);
      const data = await getChatSessions();
      setSessions(data);
      
      // Set the most recent session as active if there are any sessions
      if (data.length > 0) {
        setActiveSessionId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchMessages = async (sessionId: number) => {
    try {
      setIsLoading(true);
      const data = await getChatMessages(sessionId);
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const createNewSession = async () => {
    try {
      setIsLoading(true);
      const title = pageContext ? `Chat about: ${pageContext.title.slice(0, 30)}...` : `New Chat ${new Date().toLocaleDateString()}`;
      const newSession = await createChatSession(title);
      setSessions([newSession, ...sessions]);
      setActiveSessionId(newSession.id);
      setMessages([]);
    } catch (error) {
      console.error('Error creating new session:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !activeSessionId) return;
    
    try {
      setIsSending(true);
      
      // Optimistically add user message to UI
      const userMessage: Message = {
        id: Date.now(), // Temporary ID
        role: 'user',
        content: inputMessage,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, userMessage]);
      setInputMessage('');
      
      // Add page context to the first message if available
      let messageWithContext = inputMessage;
      if (pageContext && messages.length === 0) {
        messageWithContext = `I'm currently on this page: ${pageContext.url}\n\nTitle: ${pageContext.title}\n\nThe content is about:\n${pageContext.content.slice(0, 500)}...\n\nMy question/request is:\n${inputMessage}`;
      }
      
      // Send message to API
      const response = await sendChatMessage(activeSessionId, messageWithContext, commentaryStyle);
      
      // Add assistant response
      const assistantMessage: Message = {
        id: response.id,
        role: 'assistant',
        content: response.content,
        timestamp: response.createdAt
      };
      
      setMessages(prev => [...prev.filter(msg => msg.id !== userMessage.id), {
        ...userMessage,
        id: response.userMessageId
      }, assistantMessage]);
      
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Render empty state if no sessions exist
  if (sessions.length === 0 && !isLoading) {
    return (
      <div className="empty-state">
        <h3>No Chat Sessions Yet</h3>
        <p>Start a new chat to interact with the Vyna AI Assistant</p>
        <button className="btn-primary" onClick={createNewSession}>
          Start New Chat
        </button>
      </div>
    );
  }
  
  return (
    <div className="chat-container">
      <div className="chat-messages">
        {isLoading && messages.length === 0 ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading messages...</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.role}`}>
                <div className="message-content">{message.content}</div>
                <div className="message-time">{formatTime(message.timestamp)}</div>
              </div>
            ))}
            {isSending && (
              <div className="message assistant loading">
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      <div className="commentary-styles">
        <div 
          className={`commentary-chip ${commentaryStyle === 'play-by-play' ? 'active' : ''}`}
          onClick={() => setCommentaryStyle('play-by-play')}
          title="Play-by-play commentary provides detailed, step-by-step explanation of actions"
        >
          PP
        </div>
        <div 
          className={`commentary-chip ${commentaryStyle === 'color' ? 'active' : ''}`}
          onClick={() => setCommentaryStyle('color')}
          title="Color commentary provides insightful context and background information"
        >
          CC
        </div>
      </div>
      
      <div className="chat-input-container">
        <textarea
          className="chat-input"
          placeholder="Type a message..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          disabled={isSending || !activeSessionId}
        />
        <div className="chat-actions">
          <button 
            className="chat-action-btn"
            onClick={createNewSession}
            title="Start new chat"
          >
            +
          </button>
          <button 
            className="chat-action-btn send"
            onClick={handleSendMessage}
            disabled={isSending || !inputMessage.trim() || !activeSessionId}
            title="Send message"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiChatView;
