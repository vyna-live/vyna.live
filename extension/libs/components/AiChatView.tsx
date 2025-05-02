import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  getAiChatById,
  createAiChat,
  sendChatMessage,
  renameAiChat,
  deleteAiChat,
  extractCurrentPageContent,
} from '@libs/utils/api';
import { getStoredSettings } from '@libs/utils/storage';
import Logo from '@libs/components/ui/Logo';

export interface AiChatViewProps {
  currentPageTitle?: string;
  currentPageUrl?: string;
}

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  commentaryStyle?: 'play-by-play' | 'color';
}

const AiChatView: React.FC<AiChatViewProps> = ({ currentPageTitle, currentPageUrl }) => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const messageListRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [chatId, setChatId] = useState<number | null>(id ? parseInt(id) : null);
  const [chatTitle, setChatTitle] = useState<string>('New Chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [commentaryStyle, setCommentaryStyle] = useState<'play-by-play' | 'color'>('color');
  const [pageContent, setPageContent] = useState<string>('');
  
  // Get chat data on component mount
  useEffect(() => {
    const initChat = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // If chatId exists, fetch chat data
        if (chatId) {
          const chatData = await getAiChatById(chatId);
          setChatTitle(chatData.title || 'Untitled Chat');
          setMessages(chatData.messages || []);
        } else {
          // Create a new chat
          const settings = await getStoredSettings();
          setCommentaryStyle(settings.commentaryStyle);
          
          // Try to extract current page content
          try {
            if (settings.extractPageContent) {
              const extractedContent = await extractCurrentPageContent();
              setPageContent(extractedContent.content);
            }
          } catch (pageError) {
            console.error('Failed to extract page content:', pageError);
            // Don't set error state here, it's not critical
          }
        }
      } catch (err) {
        console.error('Error initializing chat:', err);
        setError('Failed to load chat data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    initChat();
  }, [chatId]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Handle input changes and auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(100, textareaRef.current.scrollHeight)}px`;
    }
  };
  
  // Handle send message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending) return;
    
    try {
      setIsSending(true);
      setError(null);
      
      // Create a new chat if it doesn't exist
      if (!chatId) {
        const newChat = await createAiChat('New Chat', inputMessage);
        setChatId(newChat.id);
        navigate(`/ai-chat/${newChat.id}`, { replace: true });
        
        // Update with messages from the response
        if (newChat.messages && newChat.messages.length > 0) {
          setMessages(newChat.messages);
          setInputMessage('');
          return;
        }
      }
      
      // Optimistically add user message to UI
      const userMessage: ChatMessage = {
        id: Date.now(), // Temporary ID
        role: 'user',
        content: inputMessage,
        createdAt: new Date().toISOString(),
      };
      
      setMessages((prev) => [...prev, userMessage]);
      setInputMessage('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      
      // Send message to API
      const response = await sendChatMessage(
        chatId!,
        inputMessage,
        commentaryStyle,
        pageContent || undefined
      );
      
      // Update messages with API response
      setMessages(response.messages || []);
      
      // Update chat title if this is the first message
      if (messages.length === 0 && response.title && response.title !== 'New Chat') {
        setChatTitle(response.title);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };
  
  // Handle commentary style change
  const handleStyleChange = (style: 'play-by-play' | 'color') => {
    setCommentaryStyle(style);
  };
  
  // Handle enter key press to send message
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Format timestamp for display
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="chat-view-container flex flex-col h-full max-h-[600px]">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="mr-3 text-gray-600 hover:text-primary"
          >
            ←
          </button>
          <div>
            <h1 className="font-medium text-sm truncate max-w-[180px]">{chatTitle}</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            className={`px-2 py-1 text-xs rounded-full ${commentaryStyle === 'play-by-play' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => handleStyleChange('play-by-play')}
            title="Play-by-play: Quick, action-oriented responses"
          >
            PP
          </button>
          <button
            className={`px-2 py-1 text-xs rounded-full ${commentaryStyle === 'color' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => handleStyleChange('color')}
            title="Color commentary: Detailed, insightful responses"
          >
            CC
          </button>
        </div>
      </header>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 text-red-600 p-3 text-sm">
          {error}
        </div>
      )}
      
      {/* Message list */}
      <div
        ref={messageListRef}
        className="message-list flex-1 overflow-y-auto p-4 space-y-4"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <Logo size={40} />
            <p className="mt-4 text-sm">Start a conversation with Vyna's AI Assistant</p>
            <p className="text-xs mt-2">
              {commentaryStyle === 'play-by-play'
                ? 'Using Play-by-Play style: Quick, action-oriented responses'
                : 'Using Color Commentary style: Detailed, insightful responses'}
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`message flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-4 py-2 ${message.role === 'user' ? 'bg-primary/10 text-gray-900' : 'bg-gray-100 text-gray-800'}`}
              >
                <div className="message-content text-sm whitespace-pre-wrap">{message.content}</div>
                <div className="message-meta text-xs text-gray-500 mt-1 text-right">
                  {formatTime(message.createdAt)}
                  {message.commentaryStyle && (
                    <span className="ml-1 px-1 bg-gray-200 rounded text-[10px]">
                      {message.commentaryStyle === 'play-by-play' ? 'PP' : 'CC'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        
        {isSending && (
          <div className="message flex justify-start">
            <div className="inline-flex items-center bg-gray-100 rounded-lg px-4 py-2">
              <div className="animate-pulse flex space-x-1">
                <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Input area */}
      <div className="input-area p-4 border-t">
        <div className="relative">
          <textarea
            ref={textareaRef}
            className="w-full p-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            placeholder="Message Vyna..."
            rows={1}
            value={inputMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isLoading || isSending}
          />
          <button
            className="absolute right-3 bottom-3 bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-50"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading || isSending}
          >
            ↑
          </button>
        </div>
        
        {pageContent && (
          <div className="mt-2 text-xs text-gray-500 flex items-center">
            <span className="inline-block mr-1 w-3 h-3 bg-green-500 rounded-full"></span>
            Using content from current page
          </div>
        )}
      </div>
    </div>
  );
};

export default AiChatView;
