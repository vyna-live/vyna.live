import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronRight, ChevronDown, ThumbsUp, ThumbsDown, RotateCcw, Share2, MessageSquare } from 'lucide-react';

// Define types for our chat interface
type MessageType = {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
};

type ChatHistoryItem = {
  id: string;
  query: string;
  timestamp: Date;
  messages: MessageType[];
};

interface VynaChatProps {
  onClose: () => void;
  onToggleMinimize?: () => void;
  isMinimized?: boolean;
}

const VynaChat: React.FC<VynaChatProps> = ({ onClose, onToggleMinimize, isMinimized = false }) => {
  // State for the current view
  const [activeView, setActiveView] = useState<'recents' | 'chat' | 'empty'>('recents');
  // State for the active tab
  const [activeTab, setActiveTab] = useState<'ai' | 'notepad'>('ai');
  // State for chat history
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([
    {
      id: '1',
      query: 'Who is the best CODM gamer in Nigeria...',
      timestamp: new Date(),
      messages: [
        {
          id: '1-1',
          content: 'Who is the best CODM gamer in Nigeria as of March 2025?',
          sender: 'user',
          timestamp: new Date()
        },
        {
          id: '1-2',
          content: "I don't have information about who was the best Call of Duty Mobile player in Nigeria as of March 2025, as my knowledge only extends to October 2024.",
          sender: 'ai',
          timestamp: new Date()
        }
      ]
    }
  ]);
  
  // State for the current active chat
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  // State for the input field
  const [input, setInput] = useState('');
  // Ref for the message container to scroll to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get the active chat based on the active chat ID
  const activeChat = chatHistory.find(chat => chat.id === activeChatId);

  // Function to handle sending a message
  const handleSendMessage = () => {
    if (!input.trim()) return;

    // If we're in empty view, create a new chat
    if (activeView === 'empty') {
      const newChat: ChatHistoryItem = {
        id: Date.now().toString(),
        query: input,
        timestamp: new Date(),
        messages: [
          {
            id: Date.now().toString(),
            content: input,
            sender: 'user',
            timestamp: new Date()
          }
        ]
      };
      
      setChatHistory(prev => [newChat, ...prev]);
      setActiveChatId(newChat.id);
      setActiveView('chat');
      setInput('');
      
      // Simulate AI response after a delay
      setTimeout(() => {
        const aiResponse: MessageType = {
          id: (Date.now() + 1).toString(),
          content: "I'm your AI assistant for streaming. How can I help you today?",
          sender: 'ai',
          timestamp: new Date()
        };
        
        setChatHistory(prev => prev.map(chat => {
          if (chat.id === newChat.id) {
            return {
              ...chat,
              messages: [...chat.messages, aiResponse]
            };
          }
          return chat;
        }));
      }, 1000);
    } 
    // If we're in an active chat, add to that conversation
    else if (activeChat) {
      const newMessage: MessageType = {
        id: Date.now().toString(),
        content: input,
        sender: 'user',
        timestamp: new Date()
      };
      
      setChatHistory(prev => prev.map(chat => {
        if (chat.id === activeChatId) {
          return {
            ...chat,
            messages: [...chat.messages, newMessage]
          };
        }
        return chat;
      }));
      
      setInput('');
      
      // Simulate AI response after a delay
      setTimeout(() => {
        const aiResponse: MessageType = {
          id: (Date.now() + 1).toString(),
          content: "I'm your AI assistant for streaming. How can I help you with your query?",
          sender: 'ai',
          timestamp: new Date()
        };
        
        setChatHistory(prev => prev.map(chat => {
          if (chat.id === activeChatId) {
            return {
              ...chat,
              messages: [...chat.messages, aiResponse]
            };
          }
          return chat;
        }));
      }, 1000);
    }
  };

  // Function to start a new chat
  const handleNewChat = () => {
    setActiveView('empty');
    setActiveChatId(null);
    setInput('');
  };

  // Function to view a specific chat
  const handleViewChat = (chatId: string) => {
    setActiveChatId(chatId);
    setActiveView('chat');
  };

  // Function to go back to recent chats
  const handleBackToRecents = () => {
    setActiveView('recents');
    setActiveChatId(null);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeChat?.messages]);

  return (
    <div className="w-full h-full flex flex-col bg-[#121212] text-white rounded-xl overflow-hidden">
      {/* Header with tabs - exactly matching attached design */}
      <div className="flex items-center px-2 py-3 border-b border-white/10 bg-[#191919]">
        <div className="flex gap-2 w-full items-center">
          {/* Collapse button */}
          <button 
            className="px-2"
            onClick={onToggleMinimize}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6M3 18L9 12L3 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          {/* VynaAI button - identical to design */}
          <button
            className={`px-3 py-1 rounded-md text-sm flex items-center ${
              activeTab === 'ai' 
                ? 'bg-white text-black' 
                : 'bg-transparent text-white/80'
            }`}
            onClick={() => setActiveTab('ai')}
          >
            <svg className="mr-1.5" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill={activeTab === 'ai' ? 'black' : 'white'} strokeWidth="1.5"/>
            </svg>
            VynaAI
          </button>
          
          {/* Notepad button - identical to design */}
          <button
            className={`px-3 py-1 rounded-md text-sm flex items-center ${
              activeTab === 'notepad' 
                ? 'bg-white text-black' 
                : 'bg-transparent text-white/80'
            }`}
            onClick={() => setActiveTab('notepad')}
          >
            <svg className="mr-1.5" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 4h12v16H6zm0 0h12v16H6z" stroke={activeTab === 'notepad' ? 'black' : 'white'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 8h6M9 12h6M9 16h4" stroke={activeTab === 'notepad' ? 'black' : 'white'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Notepad
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'ai' ? (
          <>
            {/* AI Assistant View */}
            {activeView === 'recents' && (
              // Recents View - Exact match to the design screenshot
              <div className="flex flex-col h-full bg-[#121212]">
                <div className="px-4 py-2">
                  <h3 className="text-xs font-medium text-neutral-400 uppercase">RECENTS</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto bg-[#121212]">
                  <div className="space-y-0">
                    {Array.from({ length: 11 }).map((_, i) => (
                      <div 
                        key={i} 
                        className="px-4 py-3 hover:bg-[#1A1A1A] flex justify-between items-center border-b border-[#191919] cursor-pointer"
                        onClick={() => handleViewChat(chatHistory[0]?.id || "1")}
                      >
                        <p className="text-sm text-white truncate">Who is the best CODM gamer in Nigeria...</p>
                        <button className="text-white/60 p-1">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                            <circle cx="6" cy="12" r="1.5" fill="currentColor"/>
                            <circle cx="18" cy="12" r="1.5" fill="currentColor"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="p-4 bg-[#121212] mt-auto">
                  <button 
                    className="w-full py-2 px-4 bg-[#D6C6AF] hover:bg-[#C6B69F] rounded-lg text-sm text-black flex items-center justify-center"
                    onClick={handleNewChat}
                  >
                    <span className="mr-1">+</span>
                    New chat
                  </button>
                </div>
              </div>
            )}

            {activeView === 'chat' && activeChat && (
              // Chat View
              <div className="flex flex-col h-full">
                <div className="px-4 py-3 flex items-center border-b border-white/10">
                  <button 
                    className="mr-2 p-1 hover:bg-white/10 rounded"
                    onClick={handleBackToRecents}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <h3 className="text-sm font-medium truncate flex-1">{activeChat.query}</h3>
                  <button className="p-1 hover:bg-white/10 rounded">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 9L12 15L18 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {activeChat.messages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'items-start'}`}
                    >
                      {message.sender === 'ai' && (
                        <div className="h-8 w-8 rounded-full overflow-hidden bg-neutral-700 mr-2 flex-shrink-0">
                          <svg className="w-full h-full p-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="white" strokeWidth="1.5"/>
                          </svg>
                        </div>
                      )}
                      
                      <div 
                        className={`rounded-lg p-3 max-w-[80%] ${
                          message.sender === 'user' 
                            ? 'bg-[#1A1A1A] text-white' 
                            : 'bg-[#2A2A2A] text-white'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Actions (only shown for AI messages) */}
                {activeChat.messages.length > 0 && activeChat.messages[activeChat.messages.length - 1].sender === 'ai' && (
                  <div className="px-4 py-2 flex space-x-1 border-t border-white/5">
                    <button className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-white/5">
                      <RotateCcw size={16} />
                    </button>
                    <button className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-white/5">
                      <ThumbsUp size={16} />
                    </button>
                    <button className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-white/5">
                      <ThumbsDown size={16} />
                    </button>
                    <button className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-white/5">
                      <MessageSquare size={16} />
                    </button>
                    <button className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-white/5">
                      <Share2 size={16} />
                    </button>
                  </div>
                )}

                {/* Input Area */}
                <div className="p-3 bg-[#121212] border-t border-white/10">
                  <div className="flex items-center border border-white/20 rounded-lg bg-[#1A1A1A] p-2">
                    <input
                      type="text"
                      placeholder="Type a new note"
                      className="flex-1 bg-transparent text-white placeholder-neutral-500 text-sm border-none outline-none"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSendMessage();
                        }
                      }}
                    />
                    <div className="flex space-x-2 items-center">
                      <button className="text-neutral-400 hover:text-white">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M21.44 11.05L12.25 2.50001C12.1893 2.44582 12.1176 2.40281 12.0391 2.37372C11.9605 2.34463 11.8766 2.32999 11.7921 2.33062C11.7076 2.33125 11.624 2.34711 11.5459 2.37736C11.4678 2.40761 11.3968 2.45165 11.337 2.50661L9.89 3.95001C9.83323 4.00705 9.78834 4.07538 9.75815 4.15049C9.72796 4.2256 9.71317 4.30599 9.71458 4.38701C9.716 4.46803 9.73359 4.54773 9.76635 4.62158C9.79911 4.69544 9.84627 4.76194 9.905 4.81701L14.05 8.96001H4.01C3.87052 8.96001 3.73652 9.01589 3.63775 9.11466C3.53897 9.21344 3.48309 9.34744 3.48309 9.48692V11.5131C3.48309 11.6526 3.53897 11.7866 3.63775 11.8854C3.73652 11.9841 3.87052 12.04 4.01 12.04H14.05L9.91 16.19C9.85354 16.2458 9.80874 16.3128 9.77861 16.3873C9.74849 16.4619 9.73356 16.5424 9.73459 16.6235C9.73562 16.7045 9.75258 16.7846 9.78462 16.8583C9.81665 16.932 9.86323 16.9979 9.92116 17.0524L11.367 18.4983C11.4267 18.5533 11.4977 18.5973 11.5758 18.6276C11.6539 18.6578 11.7375 18.6737 11.822 18.6743C11.9065 18.6749 11.9904 18.6603 12.069 18.6312C12.1475 18.6021 12.2193 18.5591 12.28 18.505L21.45 9.95001C21.5689 9.85093 21.6572 9.72166 21.7054 9.57557C21.7537 9.42948 21.7603 9.27278 21.7246 9.12305C21.6889 8.97332 21.6121 8.83724 21.5026 8.73037C21.393 8.6235 21.2547 8.55003 21.105 8.52001C20.9525 8.48869 20.7938 8.50515 20.65 8.57001L21.44 11.05Z" fill="currentColor"/>
                        </svg>
                      </button>
                      <button className="text-neutral-400 hover:text-white">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M20 4H4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V6C22 4.89543 21.1046 4 20 4Z" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M4 4V20M20 4V20" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeView === 'empty' && (
              // Empty State / Welcome View
              <div className="flex flex-col h-full bg-[#121212]">
                <div className="flex-1 flex flex-col items-center justify-center px-4 pb-16">
                  <div className="w-12 h-12 rounded-full bg-[#333333] flex items-center justify-center mb-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="white" strokeWidth="1.5"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium text-white mb-1">VynaAI</h3>
                  <p className="text-sm text-neutral-400 text-center">
                    Ask questions to quickly<br/>research topics while streaming
                  </p>
                </div>
                
                <div className="w-full px-4 pb-10">
                  <div className="py-2 px-4 rounded-md bg-[#1A1A1A] text-sm text-white">
                    <input
                      type="text"
                      placeholder="Who is the best gamer in Nigeria as of April 2025?"
                      className="w-full bg-transparent text-white placeholder-white/70 text-sm border-none outline-none"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSendMessage();
                        }
                      }}
                    />
                  </div>
                  
                  <div className="flex mt-4 gap-6 items-center justify-center">
                    <button className="text-neutral-400 hover:text-white">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 11H3M21 3H3M21 19H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                    <button className="text-neutral-400 hover:text-white">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M20 4H4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V6C22 4.89543 21.1046 4 20 4Z" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M4 4V20M20 4V20" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          // Notepad View
          <div className="flex flex-col h-full">
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="h-full flex items-center justify-center text-center">
                <div>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-800 flex items-center justify-center">
                    <svg width="28" height="28" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11.6667 4.66667V12.25H2.33333V4.66667" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12.8333 1.75H1.16667V4.66667H12.8333V1.75Z" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M5.83333 7H8.16667" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium mb-2">No notes yet</h4>
                  <p className="text-sm text-neutral-500">
                    Create notes to help you remember important information during your stream.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VynaChat;