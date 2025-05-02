import React, { useState, useEffect, useRef } from 'react';
import { sendChatMessage } from '../utils/api';
import '../../../popup/styles/popup.css';

interface AiChatViewProps {
  currentPageTitle: string;
  currentPageUrl: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AiChatView: React.FC<AiChatViewProps> = ({ currentPageTitle, currentPageUrl }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCommentaryStyle, setSelectedCommentaryStyle] = useState<'play-by-play' | 'color'>('color');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Function to send message to API
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    // Create new user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    
    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Send message to API
      const response = await sendChatMessage(
        text, 
        selectedCommentaryStyle, 
        {
          title: currentPageTitle,
          url: currentPageUrl
        }
      );
      
      if (response.success && response.data) {
        // Add AI response to chat
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: response.data.text || response.data.message || 'Sorry, I couldn\'t process that request.',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // Handle error
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: response.error || 'Sorry, there was an error processing your request. Please try again later.',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Sorry, there was an error processing your request. Please try again later.`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };
  
  // Create a new chat
  const handleNewChat = () => {
    setMessages([]);
  };
  
  // Save to notes
  const saveToNotes = async (content: string) => {
    try {
      await new Promise<any>((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: 'apiRequest',
          method: 'POST',
          endpoint: '/notepads',
          data: {
            title: `Notes from ${currentPageTitle || 'Chat'}`,
            content: content,
            source: 'extension',
            sourceUrl: currentPageUrl
          }
        }, (response) => {
          if (response && response.success) {
            resolve(response.data);
          } else {
            reject(response?.error || 'Failed to save note');
          }
        });
      });
      
      alert('Saved to notes successfully!');
    } catch (error) {
      console.error('Error saving to notes:', error);
      alert('Failed to save to notes. Please try again.');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat actions */}
      <div className="p-sm border-b">
        <button 
          className="btn btn-sm btn-primary"
          onClick={handleNewChat}
        >
          New Chat
        </button>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-md flex flex-col gap-md">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-secondary text-center">
            <div>
              <p>Start a new conversation with Vyna AI</p>
              <p className="text-sm mt-sm">Try asking something about the current page</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id} 
              className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
            >
              <div className="message-header">
                <span className="message-sender">
                  {message.role === 'user' ? 'You' : 'Vyna AI'}
                </span>
                <span className="message-time">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="message-content">{message.content}</div>
              {message.role === 'assistant' && (
                <div className="message-actions">
                  <button 
                    className="btn btn-sm btn-text"
                    onClick={() => saveToNotes(message.content)}
                    title="Save to notes"
                  >
                    Save to Notes
                  </button>
                </div>
              )}
            </div>
          ))
        )}
        {isLoading && (
          <div className="loading-message">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <p>Vyna AI is thinking...</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input form */}
      <form className="p-sm border-t bg-white" onSubmit={handleSubmit}>
        <div className="relative">
          <div className="absolute left-sm top-1/2 transform -translate-y-1/2 flex flex-col gap-xs z-10">
            <button
              type="button"
              className={`commentary-style-btn ${selectedCommentaryStyle === 'play-by-play' ? 'active' : ''}`}
              onClick={() => setSelectedCommentaryStyle('play-by-play')}
              title="Play-by-Play Commentary (Short, action-oriented responses)"
            >
              PP
            </button>
            <button
              type="button"
              className={`commentary-style-btn ${selectedCommentaryStyle === 'color' ? 'active' : ''}`}
              onClick={() => setSelectedCommentaryStyle('color')}
              title="Color Commentary (Detailed, insightful responses)"
            >
              CC
            </button>
          </div>
          
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Vyna AI..."
            className="form-input pl-xl"
            rows={2}
            disabled={isLoading}
          />
          
          <button 
            type="submit" 
            className="btn btn-primary absolute right-sm top-1/2 transform -translate-y-1/2"
            disabled={!input.trim() || isLoading}
          >
            Send
          </button>
        </div>
      </form>

      <style>{`
        .message {
          display: flex;
          flex-direction: column;
          max-width: 100%;
          padding: var(--vyna-spacing-sm);
          border-radius: var(--vyna-border-radius);
          font-size: var(--vyna-font-sm);
        }

        .user-message {
          align-self: flex-end;
          background-color: var(--vyna-primary-light);
          border: 1px solid var(--vyna-primary-lighter);
          margin-left: 32px;
        }

        .assistant-message {
          align-self: flex-start;
          background-color: white;
          border: 1px solid var(--vyna-border);
          margin-right: 32px;
        }

        .message-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: var(--vyna-spacing-xs);
          font-size: var(--vyna-font-xs);
        }

        .message-sender {
          font-weight: 600;
        }

        .message-time {
          color: var(--vyna-text-secondary);
        }

        .message-content {
          white-space: pre-wrap;
          line-height: 1.5;
        }

        .message-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: var(--vyna-spacing-xs);
        }

        .loading-message {
          align-self: flex-start;
          padding: var(--vyna-spacing-sm);
          display: flex;
          align-items: center;
          gap: var(--vyna-spacing-sm);
          color: var(--vyna-text-secondary);
        }

        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .typing-indicator span {
          width: 6px;
          height: 6px;
          background-color: var(--vyna-text-secondary);
          border-radius: 50%;
          animation: typing 1.4s infinite ease-in-out both;
        }

        .typing-indicator span:nth-child(1) {
          animation-delay: 0s;
        }

        .typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }

        .commentary-style-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          border: 1px solid var(--vyna-border);
          background-color: white;
          font-size: var(--vyna-font-xs);
          font-weight: 600;
          cursor: pointer;
          color: var(--vyna-text-secondary);
          transition: all 0.2s;
        }

        .commentary-style-btn.active {
          background-color: var(--vyna-secondary);
          color: white;
          border-color: var(--vyna-secondary);
        }
      `}</style>
    </div>
  );
};

export default AiChatView;