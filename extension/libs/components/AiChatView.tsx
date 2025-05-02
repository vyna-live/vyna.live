import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface AiChatViewProps {
  user: any;
}

const AiChatView: React.FC<AiChatViewProps> = ({ user }) => {
  const navigate = useNavigate();
  const { getAiResponse, createChatSession } = require('../utils/api');
  const { getUserAuth } = require('../utils/storage');
  const Logo = require('./ui/Logo').default;
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<Array<{content: string, role: 'user' | 'assistant', timestamp: number}>>([]);
  const [commentaryStyle, setCommentaryStyle] = useState<'play-by-play' | 'color'>('color');
  const [pageContent, setPageContent] = useState<any>(null);
  const [token, setToken] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Get page content and token on mount
  useEffect(() => {
    const init = async () => {
      try {
        // Get user token
        const auth = await getUserAuth();
        if (auth?.token) {
          setToken(auth.token);
        }
        
        // Get content from current page
        chrome.runtime.sendMessage({ action: 'getPageContent' }, (response) => {
          if (response?.success && response?.content) {
            setPageContent(response.content);
          }
        });
      } catch (error) {
        console.error('Error initializing AI chat:', error);
      }
    };
    
    init();
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    const userMsg = message.trim();
    setMessage('');
    
    // Add user message to chat
    setMessages(prev => [...prev, {
      content: userMsg,
      role: 'user',
      timestamp: Date.now()
    }]);
    
    setLoading(true);
    setError(null);
    
    try {
      // Add page context if available
      let contextMessage = userMsg;
      if (pageContent) {
        // If user has highlighted text, use that as context
        if (pageContent.selection) {
          contextMessage = `[Context from current page: "${pageContent.selection}"] ${userMsg}`;
        } 
        // Otherwise use the page title and URL as minimal context
        else {
          contextMessage = `[Currently on: ${pageContent.title} (${pageContent.url})] ${userMsg}`;
        }
      }
      
      const response = await getAiResponse(contextMessage, commentaryStyle, token);
      
      if (response.success && response.data) {
        setMessages(prev => [...prev, {
          content: response.data.text || 'Sorry, I couldn\'t generate a response.',
          role: 'assistant',
          timestamp: Date.now()
        }]);
      } else {
        setError(response.error || 'Failed to get AI response');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('An error occurred while communicating with the AI');
    } finally {
      setLoading(false);
    }
  };
  
  const toggleCommentaryStyle = () => {
    setCommentaryStyle(prev => prev === 'color' ? 'play-by-play' : 'color');
  };
  
  return (
    <div className="flex flex-col h-full">
      <header className="flex justify-between items-center p-4 border-b">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center text-primary"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="ml-2">Back</span>
        </button>
        <Logo size="small" variant="icon" />
      </header>
      
      <div className="flex-grow overflow-y-auto p-4" style={{ maxHeight: 'calc(100% - 134px)' }}>
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-6">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium">No messages yet</h3>
            <p className="mt-1 text-sm">
              Start a conversation with Vyna AI Assistant
            </p>
            <p className="mt-3 text-xs">
              Current mode: <span className="font-medium">{commentaryStyle === 'color' ? 'Color Commentary' : 'Play-by-Play'}</span>
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`message-bubble ${msg.role}`}>
                {msg.content}
              </div>
            ))}
            {loading && (
              <div className="flex items-center justify-center py-2">
                <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                <span className="ml-2 text-sm text-gray-500">Vyna is thinking...</span>
              </div>
            )}
            {error && (
              <div className="bg-red-50 p-3 rounded-md text-red-600 text-sm">
                {error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      <div className="border-t p-4">
        <div className="flex mb-2">
          <button
            type="button"
            onClick={toggleCommentaryStyle}
            className={`px-2 py-1 text-xs rounded mr-2 ${commentaryStyle === 'color' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}
            title="Color Commentary mode provides detailed, insightful analysis"
          >
            CC
          </button>
          <button
            type="button"
            onClick={toggleCommentaryStyle}
            className={`px-2 py-1 text-xs rounded ${commentaryStyle === 'play-by-play' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}
            title="Play-by-Play mode provides quick, action-oriented responses"
          >
            PP
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask Vyna AI something..."
            className="flex-grow mr-2"
            disabled={loading}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !message.trim()}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AiChatView;
