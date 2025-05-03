import React, { useState, useEffect, useRef } from 'react';
import { getChatSessions, createChatSession, getChatMessages, sendChatMessage } from '@libs/utils/api';
import { getPageContext, getCurrentSessionId, setCurrentSessionId } from '@libs/utils/storage';

interface ChatSession {
  id: number;
  title: string;
  createdAt: string;
}

interface ChatMessage {
  id: number;
  content: string;
  role: 'user' | 'assistant';
  commentaryStyle?: 'play-by-play' | 'color';
  createdAt: string;
}

const AiChatView: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionIdState] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pageContext, setPageContext] = useState<any>(null);
  const [commentaryStyle, setCommentaryStyle] = useState<'play-by-play' | 'color'>('color');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        
        // Load page context
        const context = await getPageContext();
        setPageContext(context);
        
        // Load chat sessions
        const allSessions = await getChatSessions();
        setSessions(allSessions);
        
        // Get stored current session ID
        const storedSessionId = await getCurrentSessionId();
        
        if (storedSessionId && allSessions.some(s => s.id === storedSessionId)) {
          // If stored session exists, use it
          setCurrentSessionIdState(storedSessionId);
          const sessionMessages = await getChatMessages(storedSessionId);
          setMessages(sessionMessages);
        } else if (allSessions.length > 0) {
          // Otherwise use the most recent session
          const latestSession = allSessions[0];
          setCurrentSessionIdState(latestSession.id);
          await setCurrentSessionId(latestSession.id);
          const sessionMessages = await getChatMessages(latestSession.id);
          setMessages(sessionMessages);
        }
      } catch (error) {
        console.error('Failed to load initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialData();
  }, []);
  
  useEffect(() => {
    // Scroll to bottom of messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentSessionId || isLoading) return;
    
    try {
      setIsLoading(true);
      
      // Add user message to UI immediately
      const userMessage: ChatMessage = {
        id: Date.now(), // Temporary ID
        content: inputMessage,
        role: 'user',
        createdAt: new Date().toISOString()
      };
      
      setMessages([...messages, userMessage]);
      setInputMessage('');
      
      // Send message to API
      const response = await sendChatMessage(
        currentSessionId,
        inputMessage,
        commentaryStyle
      );
      
      // Add assistant response to messages
      setMessages(prev => [...prev, response]);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleNewChat = async () => {
    try {
      setIsLoading(true);
      
      // Create a default title based on current page
      const title = pageContext?.title
        ? `Chat about ${pageContext.title.substring(0, 30)}${pageContext.title.length > 30 ? '...' : ''}`
        : `New chat ${new Date().toLocaleString()}`;
      
      // Create new session
      const newSession = await createChatSession(title);
      
      // Update state
      setSessions([newSession, ...sessions]);
      setCurrentSessionIdState(newSession.id);
      await setCurrentSessionId(newSession.id);
      setMessages([]);
    } catch (error) {
      console.error('Failed to create new chat:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSessionClick = async (sessionId: number) => {
    if (sessionId === currentSessionId || isLoading) return;
    
    try {
      setIsLoading(true);
      setCurrentSessionIdState(sessionId);
      await setCurrentSessionId(sessionId);
      
      const sessionMessages = await getChatMessages(sessionId);
      setMessages(sessionMessages);
    } catch (error) {
      console.error('Failed to switch sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleCommentaryStyle = () => {
    setCommentaryStyle(prev => prev === 'color' ? 'play-by-play' : 'color');
  };
  
  return (
    <div className="ai-chat-view">
      <div className="chat-sidebar">
        <button 
          className="new-chat-button"
          onClick={handleNewChat}
          disabled={isLoading}
        >
          New Chat
        </button>
        
        <div className="session-list">
          {sessions.map(session => (
            <div 
              key={session.id}
              className={`session-item ${session.id === currentSessionId ? 'active' : ''}`}
              onClick={() => handleSessionClick(session.id)}
            >
              <div className="session-title">{session.title}</div>
              <div className="session-date">
                {new Date(session.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="chat-main">
        <div className="chat-messages">
          {messages.map(message => (
            <div 
              key={message.id} 
              className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
            >
              <div className="message-header">
                <span className="message-sender">
                  {message.role === 'user' ? 'You' : 'Vyna AI'}
                </span>
                {message.role === 'assistant' && message.commentaryStyle && (
                  <span className="commentary-style-badge">
                    {message.commentaryStyle === 'play-by-play' ? 'Play-by-play' : 'Color'}
                  </span>
                )}
              </div>
              <div className="message-content">{message.content}</div>
            </div>
          ))}
          
          {isLoading && (
            <div className="loading-indicator">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div>Vyna AI is thinking...</div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <div className="chat-input-container">
          {pageContext && (
            <div className="page-context-indicator">
              <span className="context-icon">📄</span>
              <span className="context-text">
                Context: {pageContext.title}
              </span>
            </div>
          )}
          
          <div className="input-controls">
            <div className="commentary-style-toggle">
              <button 
                className={`style-toggle-button ${commentaryStyle === 'play-by-play' ? 'active' : ''}`}
                onClick={() => setCommentaryStyle('play-by-play')}
                title="Play-by-play Commentary"
              >
                PP
              </button>
              <button 
                className={`style-toggle-button ${commentaryStyle === 'color' ? 'active' : ''}`}
                onClick={() => setCommentaryStyle('color')}
                title="Color Commentary"
              >
                CC
              </button>
            </div>
            
            <textarea
              className="chat-input"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask me anything..."
              disabled={isLoading || !currentSessionId}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            
            <button 
              className="send-button"
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim() || !currentSessionId}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiChatView;
