import React, { useState, useRef, useEffect } from 'react';
import PerfectInputArea from './PerfectInputArea';

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
  // State for notepad view
  const [notepadView, setNotepadView] = useState<'list' | 'new' | 'view'>('list');
  // State for note input
  const [noteInput, setNoteInput] = useState('');
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
    console.log("STARTING NEW CHAT");
    setActiveView('empty');
    setActiveChatId(null);
    setInput('');
  };

  // Function to view a specific chat
  const handleViewChat = (chatId: string) => {
    console.log(`OPENING CHAT: ${chatId}`);
    setActiveChatId(chatId);
    setActiveView('chat');
  };

  // Function to go back to recent chats
  const handleBackToRecents = () => {
    console.log("GOING BACK TO RECENTS");
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
          {/* Double chevrons close button (>>) */}
          <button 
            className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-white/10"
            onClick={onClose}
            style={{cursor: 'pointer'}}
            aria-label="Close chat panel"
            id="closeButton"
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
            onClick={() => {
              setActiveTab('ai');
              setActiveView('recents');
              console.log("Switching to VynaAI tab");
            }}
            id="vynaAiTabButton"
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
            onClick={() => {
              setActiveTab('notepad');
              setNotepadView('list');
              console.log("Switching to Notepad tab (list view)");
            }}
            id="notepadTabButton"
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
              // Chat View - Exactly matching the design in aichatview.png
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
                  <h3 className="text-sm font-medium truncate flex-1">Who is the best CODM gamer in Ni...</h3>
                  <button className="p-1 hover:bg-white/10 rounded">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 9L12 15L18 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#121212]">
                  {/* User message - exactly as in design */}
                  <div className="bg-[#2A2A2A] rounded-lg p-3 w-full mb-3">
                    <p className="text-sm text-white">Who is the best CODM gamer in Nigeria as of March 2025?</p>
                  </div>
                  
                  {/* AI message with avatar and response buttons - exactly as in design */}
                  <div className="flex flex-col">
                    <div className="flex items-start mb-2">
                      <div className="h-8 w-8 rounded-full overflow-hidden bg-neutral-600 mr-2 flex-shrink-0">
                        <svg className="w-full h-full p-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="white" strokeWidth="1.5"/>
                        </svg>
                      </div>
                      
                      <div className="bg-[#2C2C2C] rounded-lg p-3 text-white flex-1">
                        <p className="text-sm">I don't have information about who was the best Call of Duty Mobile player in Nigeria as of March 2025, as my knowledge only extends to October 2024.</p>
                      </div>
                    </div>
                    
                    {/* Action buttons below AI message - exactly as in design */}
                    <div className="flex ml-10 mt-2 space-x-3">
                      <button className="p-1 text-[#808080] hover:text-white">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 4v10.184C4 17.473 7.582 20 11.934 20c3.495 0 6.573-1.464 7.764-4.183.346-.824.738-2.02.506-3.217-.507-1.794-2.12-1.214-2.12-1.214l-4.797.013s-1.644.58-1.644-1.213V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button className="p-1 text-[#808080] hover:text-white">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M7 11h10v2H7v-2zm5-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor"/>
                        </svg>
                      </button>
                      <button className="p-1 text-[#808080] hover:text-white">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 4v10.184C4 17.473 7.582 20 11.934 20c3.495 0 6.573-1.464 7.764-4.183.346-.824.738-2.02.506-3.217-.507-1.794-2.12-1.214-2.12-1.214l-4.797.013s-1.644.58-1.644-1.213V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform="rotate(180 12 12)"/>
                        </svg>
                      </button>
                      <button className="p-1 text-[#808080] hover:text-white">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </button>
                      <button className="p-1 text-[#808080] hover:text-white">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8.5 14l-3 3 3 3m7-14l3-3-3-3M19 21h1a2 2 0 002-2V5a2 2 0 00-2-2h-1m-14 0H4a2 2 0 00-2 2v14a2 2 0 002 2h1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M16 16.5L12 20l-4-3.5m8-5L12 4l-4 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area - exactly as in design with the same icons */}
                <div className="p-3 mt-auto bg-[#121212]">
                  <PerfectInputArea onSubmit={handleSendMessage} />
                </div>
              </div>
            )}

            {activeView === 'empty' && (
              // Empty State / Welcome View - Exactly matching the design in ainew.png
              <div className="flex flex-col h-full bg-[#121212]">
                <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
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
                
                <div className="w-full px-4 pb-8 mt-auto">
                  <PerfectInputArea onSubmit={handleSendMessage} />
                </div>
              </div>
            )}
          </>
        ) : (
          // Notepad Views
          <>
            {notepadView === 'list' && (
              // Notepad List View - Exactly matching the design in notelist.png
              <div className="flex flex-col h-full bg-[#121212]">
                <div className="px-4 py-2">
                  <h3 className="text-xs font-medium text-neutral-400 uppercase">RECENTS</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto bg-[#121212]">
                  <div className="space-y-0">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div 
                        key={i} 
                        className="px-4 py-3 hover:bg-[#1A1A1A] flex flex-col border-b border-[#191919] cursor-pointer"
                        onClick={() => setNotepadView('view')}
                      >
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-white font-medium">Who is the best CODM gamer in Nigeria...</p>
                          <button className="text-white/60 p-1">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                              <circle cx="6" cy="12" r="1.5" fill="currentColor"/>
                              <circle cx="18" cy="12" r="1.5" fill="currentColor"/>
                            </svg>
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-1">
                          I don't have information about who was the best Call of Duty Mobile player in Nigeria as of March...
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="p-4 bg-[#121212] mt-auto">
                  <button 
                    className="w-full py-2 px-4 bg-[#D6C6AF] hover:bg-[#C6B69F] rounded-lg text-sm text-black flex items-center justify-center"
                    onClick={() => setNotepadView('new')}
                  >
                    <span className="mr-1">+</span>
                    New note
                  </button>
                </div>
              </div>
            )}
            
            {notepadView === 'new' && (
              // New Note View - Exactly matching the design in notenew.png
              <div className="flex flex-col h-full bg-[#121212]">
                <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
                  <h3 className="text-xl font-medium text-white mb-1">Research Notes</h3>
                  <p className="text-sm text-neutral-400 text-center">
                    Save important information for<br/>your stream
                  </p>
                </div>
                
                <div className="w-full px-4 pb-8 mt-auto">
                  <div className="flex flex-col items-stretch">
                    <div className="relative mb-3">
                      <textarea 
                        className="w-full bg-[#1A1A1A] rounded-lg px-3 py-2.5 resize-none text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#D6C6AF]" 
                        rows={2} 
                        placeholder="Type a new note"
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                      ></textarea>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-white/60 hover:text-white">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button className="p-2 text-white/60 hover:text-white">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button className="p-2 text-white/60 hover:text-white">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                            <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                      
                      <button 
                        onClick={() => setNotepadView('view')}
                        className="py-1.5 px-3 bg-white text-black rounded-md flex items-center justify-center text-sm font-medium"
                      >
                        <span className="mr-1">+</span>
                        Add note
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {notepadView === 'view' && (
              // Note View - Exactly matching the design in noteview.png
              <div className="flex flex-col h-full bg-[#121212]">
                <div className="px-4 py-3 flex items-center border-b border-white/10">
                  <button 
                    className="mr-2 p-1 hover:bg-white/10 rounded"
                    onClick={() => setNotepadView('list')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <h3 className="text-sm font-medium truncate flex-1">Who is the best CODM gamer in Ni...</h3>
                  <button className="p-1 hover:bg-white/10 rounded">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 9L12 15L18 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#121212]">
                  <p className="text-sm text-white">
                    I don't have definitive information about who the best Call of Duty Mobile (CODM) player in Nigeria is as of March 2025. My knowledge cutoff is October 2024, so I don't have access to current rankings, tournament results, or player statistics from March 2025.
                    <br/><br/>
                    To find accurate information about the top CODM players in Nigeria currently, I'd recommend:
                    <br/><br/>
                    1. Checking official CODM tournament results for any Nigerian championships held in early 2025
                    <br/>
                    2. Looking at regional leaderboards within the game
                    <br/>
                    3. Following Nigerian esports organizations that field CODM teams
                    <br/>
                    4. Checking social media accounts of known Nigerian CODM content creators and competitive players
                    <br/>
                    5. Visiting Nigerian gaming forums or communities where this topic might be discussed
                    <br/><br/>
                    If you're interested in who was prominent in the Nigerian CODM scene before my knowledge cutoff, I could share information about players who were rising in popularity during 2024, but I can't make claims about who would be considered the best as of March 2025.
                  </p>
                </div>
                
                <div className="p-4 bg-[#121212] mt-auto">
                  <button 
                    className="w-full py-2 px-4 bg-[#D6C6AF] hover:bg-[#C6B69F] rounded-lg text-sm text-black flex items-center justify-center"
                  >
                    Teleprompt
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VynaChat;