import React, { useState, useEffect } from 'react';
import ItemCard from './ItemCard';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

const AIChatTab: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [newMessage, setNewMessage] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);

  useEffect(() => {
    // Fetch chats from the API
    const fetchChats = async () => {
      try {
        setLoading(true);
        // This would be replaced with an actual API call
        // For demo, using placeholder data that matches screenshot
        const mockChats: Chat[] = [
          {
            id: '1',
            title: 'Who is the best CODM gamer in Nigeria as of March 2025',
            messages: [
              {
                id: '1-1',
                role: 'user',
                content: 'Who is the best CODM gamer in Nigeria as of March 2025',
                timestamp: new Date().toISOString(),
              },
              {
                id: '1-2',
                role: 'assistant',
                content: "I don't have information about who was the best Call of Duty Mobile player in Nigeria as of March 2025, as my knowledge cutoff date is earlier than that. To get accurate information, you would need to check recent CODM tournaments, official rankings, or community discussions from that time period.",
                timestamp: new Date().toISOString(),
              },
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '2',
            title: 'About Solana',
            messages: [
              {
                id: '2-1',
                role: 'user',
                content: 'Tell me about solana like I am a two year old',
                timestamp: new Date().toISOString(),
              },
              {
                id: '2-2',
                role: 'assistant',
                content: "Solana is like a super-fast playground where people build fun digital toys!\n\nImagine you have special digital blocks that everyone can see and nobody can break. People use these blocks to make games, share pictures, and trade special toys.\n\nWhen you want to play with someone else's blocks, you just ask the playground, and zoom! It happens really fast, faster than saying \"one-two-three!\"\n\nThe playground has special helpers called SOL that help you play with all the toys. Everyone takes turns being nice and making sure all the blocks stay in the right places.\n\nThat's Solana - a speedy digital playground where people build cool things together!",
                timestamp: new Date().toISOString(),
              },
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
        
        // Add more mock chats
        for (let i = 3; i <= 10; i++) {
          mockChats.push({
            id: i.toString(),
            title: 'Who is the best CODM gamer in Nigeria as of March 2025',
            messages: [
              {
                id: `${i}-1`,
                role: 'user',
                content: 'Who is the best CODM gamer in Nigeria as of March 2025',
                timestamp: new Date().toISOString(),
              },
              {
                id: `${i}-2`,
                role: 'assistant',
                content: "I don't have information about who was the best Call of Duty Mobile player in Nigeria as of March 2025, as my knowledge cutoff date is earlier than that. To get accurate information, you would need to check recent CODM tournaments, official rankings, or community discussions from that time period.",
                timestamp: new Date().toISOString(),
              },
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
        
        setChats(mockChats);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching chats:', error);
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  const handleChatClick = (chat: Chat) => {
    setSelectedChat(chat);
  };

  const handleCreateNewChat = () => {
    // Handle creating a new chat
    const newChat: Chat = {
      id: `new-${Date.now()}`,
      title: 'New Chat',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setChats([newChat, ...chats]);
    setSelectedChat(newChat);
  };

  const handleBackClick = () => {
    setSelectedChat(null);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;
    
    // Add user message
    const userMessage: Message = {
      id: `${selectedChat.id}-${selectedChat.messages.length + 1}`,
      role: 'user',
      content: newMessage,
      timestamp: new Date().toISOString(),
    };
    
    const updatedChat = {
      ...selectedChat,
      messages: [...selectedChat.messages, userMessage],
      title: selectedChat.messages.length === 0 ? newMessage : selectedChat.title,
    };
    
    setSelectedChat(updatedChat);
    setChats(chats.map(chat => chat.id === selectedChat.id ? updatedChat : chat));
    setNewMessage('');
    setSending(true);
    
    try {
      // Simulate API call to get AI response
      setTimeout(() => {
        const aiMessage: Message = {
          id: `${selectedChat.id}-${selectedChat.messages.length + 2}`,
          role: 'assistant',
          content: "Solana is like a super-fast playground where people build fun digital toys!\n\nImagine you have special digital blocks that everyone can see and nobody can break. People use these blocks to make games, share pictures, and trade special toys.\n\nWhen you want to play with someone else's blocks, you just ask the playground, and zoom! It happens really fast, faster than saying \"one-two-three!\"\n\nThe playground has special helpers called SOL that help you play with all the toys. Everyone takes turns being nice and making sure all the blocks stay in the right places.\n\nThat's Solana - a speedy digital playground where people build cool things together!",
          timestamp: new Date().toISOString(),
        };
        
        const finalUpdatedChat = {
          ...updatedChat,
          messages: [...updatedChat.messages, aiMessage],
        };
        
        setSelectedChat(finalUpdatedChat);
        setChats(chats.map(chat => chat.id === selectedChat.id ? finalUpdatedChat : chat));
        setSending(false);
      }, 1500);
    } catch (error) {
      console.error('Error sending message:', error);
      setSending(false);
    }
  };

  // Display selected chat view if a chat is selected
  if (selectedChat) {
    return (
      <div className="flex flex-col h-full bg-[#1a1a1a]">
        <div className="flex items-center p-3 border-b border-[#333333]">
          <button 
            onClick={handleBackClick}
            className="text-white/80 hover:text-white mr-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-white font-medium truncate">{selectedChat.title}</h2>
          <button className="ml-auto text-white/80 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {selectedChat.messages.map((message) => (
            <div key={message.id} className={`${message.role === 'user' ? 'bg-[#333333]' : 'bg-[#2a2a2a]'} p-3 rounded-lg`}>
              {message.role === 'assistant' && (
                <div className="flex items-start mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#a67d44] flex items-center justify-center text-white font-medium mr-2">V</div>
                  <div className="flex-1">
                    <p className="text-white/80 whitespace-pre-line">{message.content}</p>
                  </div>
                </div>
              )}
              {message.role === 'user' && (
                <p className="text-white">{message.content}</p>
              )}
              
              {message.role === 'assistant' && (
                <div className="flex space-x-2 mt-4">
                  <button className="text-white/60 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <button className="text-white/60 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                  </button>
                  <button className="text-white/60 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 10V5a2 2 0 012-2h6a2 2 0 012 2v5m-4 0V5m-4 0h10m-10 0v5m0 0H5a2 2 0 00-2 2v6a2 2 0 002 2h14a2 2 0 002-2v-6a2 2 0 00-2-2h-3" />
                    </svg>
                  </button>
                  <button className="text-white/60 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <button className="text-white/60 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))}
          
          {sending && (
            <div className="flex items-center space-x-2 text-white/60">
              <div className="animate-bounce">●</div>
              <div className="animate-bounce delay-100">●</div>
              <div className="animate-bounce delay-200">●</div>
            </div>
          )}
        </div>
        
        <div className="p-3 border-t border-[#333333]">
          <div className="bg-[#2a2a2a] rounded-lg p-3 flex items-center">
            <input 
              type="text" 
              className="bg-transparent text-white w-full outline-none" 
              placeholder="Type a message"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <div className="flex space-x-2">
              <button className="text-white/60 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              <button className="text-white/60 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
              <button className="text-white/60 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button 
                className="text-white bg-[#a67d44] p-1 rounded-full hover:bg-[#8e6a39] transition-colors"
                onClick={handleSendMessage}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="flex justify-center mt-2 space-x-2">
            <button className="bg-[#2a2a2a] rounded-full px-3 py-1 text-white/80 text-xs hover:bg-[#3a3a3a] transition-colors flex items-center" title="Play-by-Play Commentary">
              PP
            </button>
            <button className="bg-[#2a2a2a] rounded-full px-3 py-1 text-white/80 text-xs hover:bg-[#3a3a3a] transition-colors flex items-center" title="Color Commentary">
              CC
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Chats list view
  return (
    <div className="flex flex-col h-full bg-[#1a1a1a]">
      <div className="p-3 border-b border-[#333333]">
        <h2 className="text-white/70 font-medium">RECENTS</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
          </div>
        ) : (
          <div>
            {chats.map((chat) => (
              <ItemCard
                key={chat.id}
                title={chat.title}
                preview={chat.messages.length > 0 ? 
                  (chat.messages[chat.messages.length - 1].role === 'assistant' ? 
                    chat.messages[chat.messages.length - 1].content.substring(0, 100) + '...' : 
                    'You: ' + chat.messages[chat.messages.length - 1].content.substring(0, 100) + '...') : 
                  'New conversation'}
                onClick={() => handleChatClick(chat)}
                onOptionsClick={() => console.log('Options clicked for', chat.id)}
              />
            ))}
          </div>
        )}
      </div>
      
      <div className="p-3">
        <button 
          onClick={handleCreateNewChat}
          className="w-full py-3 rounded-lg bg-[#CDBCAB] hover:bg-[#BEA99A] text-[#333333] font-medium flex items-center justify-center transition-colors"
        >
          <span className="mr-1">+</span> New chat
        </button>
      </div>
    </div>
  );
};

export default AIChatTab;