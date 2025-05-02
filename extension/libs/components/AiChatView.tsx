import React, { useState, useEffect, useRef } from 'react';

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

  // Define the expected response type
  interface PageContentResponse {
    success: boolean;
    content: string;
    error?: string;
  }

  // Function to extract content from current page
  const extractPageContent = async (): Promise<PageContentResponse | null> => {
    try {
      return await new Promise<PageContentResponse>((resolve, reject) => {
        chrome.runtime.sendMessage(
          { type: 'extractCurrentPageContent' },
          (response: PageContentResponse) => {
            if (response && response.success) {
              resolve(response);
            } else {
              reject(response?.error || 'Failed to extract page content');
            }
          }
        );
      });
    } catch (error) {
      console.error('Error extracting page content:', error);
      return null;
    }
  };

  // Function to send message to API
  const sendMessage = async (text: string) => {
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
      // Extract page content if needed
      let contextInfo = '';
      if (text.toLowerCase().includes('this page') || text.toLowerCase().includes('current page')) {
        const pageContent = await extractPageContent();
        if (pageContent) {
          contextInfo = `\n\nContext from current page (${currentPageTitle}):\n${pageContent.content}`;
        }
      }
      
      // Send request to backend API
      const response = await new Promise<any>((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: 'apiRequest',
          method: 'POST',
          endpoint: '/ai/chat',
          data: {
            message: text + contextInfo,
            commentaryStyle: selectedCommentaryStyle,
            source: 'extension',
            pageTitle: currentPageTitle,
            pageUrl: currentPageUrl
          }
        }, (response) => {
          if (response && response.success) {
            resolve(response.data);
          } else {
            reject(response?.error || 'Failed to get AI response');
          }
        });
      });
      
      // Add AI response to chat
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.text || response.message || 'Sorry, I couldn\'t process that request.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
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
    sendMessage(input);
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
    <div className="vyna-chat-view">
      <div className="vyna-chat-actions">
        <button className="vyna-new-chat-btn" onClick={handleNewChat}>
          New Chat
        </button>
      </div>

      <div className="vyna-message-list">
        {messages.length === 0 ? (
          <div className="vyna-empty-chat">
            <p>Start a new conversation with Vyna AI</p>
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id} 
              className={`vyna-message ${message.role === 'user' ? 'vyna-user-message' : 'vyna-assistant-message'}`}
            >
              <div className="vyna-message-header">
                <span className="vyna-message-sender">
                  {message.role === 'user' ? 'You' : 'Vyna AI'}
                </span>
                <span className="vyna-message-time">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="vyna-message-content">{message.content}</div>
              {message.role === 'assistant' && (
                <div className="vyna-message-actions">
                  <button 
                    className="vyna-action-btn"
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
          <div className="vyna-loading-message">
            <div className="vyna-typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <p>Vyna AI is thinking...</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="vyna-chat-input" onSubmit={handleSubmit}>
        <div className="vyna-input-container">
          <div className="vyna-commentary-style-selector">
            <button
              type="button"
              className={`vyna-style-btn ${selectedCommentaryStyle === 'play-by-play' ? 'active' : ''}`}
              onClick={() => setSelectedCommentaryStyle('play-by-play')}
              title="Play-by-Play Commentary (Short, action-oriented responses)"
            >
              PP
            </button>
            <button
              type="button"
              className={`vyna-style-btn ${selectedCommentaryStyle === 'color' ? 'active' : ''}`}
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
            rows={2}
            disabled={isLoading}
          />
          <button 
            type="submit" 
            className="vyna-send-btn"
            disabled={!input.trim() || isLoading}
          >
            Send
          </button>
        </div>
      </form>

      <style>{`
        .vyna-chat-view {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }

        .vyna-chat-actions {
          padding: 8px 16px;
          border-bottom: 1px solid var(--vyna-border);
          background-color: white;
        }

        .vyna-new-chat-btn {
          font-size: 12px;
          padding: 6px 10px;
          background-color: var(--vyna-primary);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .vyna-message-list {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .vyna-empty-chat {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #666;
          text-align: center;
          font-size: 14px;
        }

        .vyna-message {
          display: flex;
          flex-direction: column;
          max-width: 100%;
          padding: 12px;
          border-radius: 8px;
          font-size: 14px;
        }

        .vyna-user-message {
          align-self: flex-end;
          background-color: #e6f2ff;
          border: 1px solid #cce5ff;
          margin-left: 32px;
        }

        .vyna-assistant-message {
          align-self: flex-start;
          background-color: white;
          border: 1px solid var(--vyna-border);
          margin-right: 32px;
        }

        .vyna-message-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 12px;
        }

        .vyna-message-sender {
          font-weight: 600;
        }

        .vyna-message-time {
          color: #666;
        }

        .vyna-message-content {
          white-space: pre-wrap;
          line-height: 1.5;
        }

        .vyna-message-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 8px;
        }

        .vyna-action-btn {
          font-size: 12px;
          padding: 4px 8px;
          background: none;
          border: 1px solid var(--vyna-secondary);
          color: var(--vyna-secondary);
          border-radius: 4px;
          cursor: pointer;
        }

        .vyna-loading-message {
          align-self: flex-start;
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          color: #666;
        }

        .vyna-typing-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .vyna-typing-indicator span {
          width: 6px;
          height: 6px;
          background-color: #999;
          border-radius: 50%;
          animation: typing 1.4s infinite ease-in-out both;
        }

        .vyna-typing-indicator span:nth-child(1) {
          animation-delay: 0s;
        }

        .vyna-typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .vyna-typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }

        .vyna-chat-input {
          padding: 12px 16px;
          border-top: 1px solid var(--vyna-border);
          background-color: white;
        }

        .vyna-input-container {
          display: flex;
          position: relative;
        }

        .vyna-commentary-style-selector {
          display: flex;
          flex-direction: column;
          gap: 8px;
          position: absolute;
          left: 8px;
          top: 50%;
          transform: translateY(-50%);
        }

        .vyna-style-btn {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          border: 1px solid var(--vyna-border);
          background-color: white;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          color: #666;
        }

        .vyna-style-btn.active {
          background-color: var(--vyna-secondary);
          color: white;
          border-color: var(--vyna-secondary);
        }

        .vyna-chat-input textarea {
          flex: 1;
          resize: none;
          padding: 12px 60px 12px 48px;
          border: 1px solid var(--vyna-border);
          border-radius: 8px;
          font-family: inherit;
          font-size: 14px;
        }

        .vyna-send-btn {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background-color: var(--vyna-secondary);
          color: white;
          border: none;
          border-radius: 4px;
          padding: 6px 12px;
          font-size: 14px;
          cursor: pointer;
        }

        .vyna-send-btn:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default AiChatView;
