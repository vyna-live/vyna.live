import { useState, useRef, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { 
  ArrowLeft, 
  ChevronDown, 
  MoreVertical, 
  Plus, 
  Sparkles, 
  FileText,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Info,
  Paperclip,
  Mic,
  Image as ImageIcon,
  Upload
} from "lucide-react";
import Logo from "@/components/Logo";
import "./VynaAIChat.css";

// Mock conversation data - would be fetched from API in a real implementation
const mockConversations = [
  { id: 1, title: "Who is the best CODM gamer in Nigeria as of...", active: true },
  { id: 2, title: "Who is the best CODM gamer in Nigeria as of...", active: false },
  { id: 3, title: "Who is the best CODM gamer in Nigeria as of...", active: false },
  { id: 4, title: "Who is the best CODM gamer in Nigeria as of...", active: false },
  { id: 5, title: "Who is the best CODM gamer in Nigeria as of...", active: false },
  { id: 6, title: "Who is the best CODM gamer in Nigeria as of...", active: false },
  { id: 7, title: "Who is the best CODM gamer in Nigeria as of...", active: false },
  { id: 8, title: "Who is the best CODM gamer in Nigeria as of...", active: false },
  { id: 9, title: "Who is the best CODM gamer in Nigeria as of...", active: false },
  { id: 10, title: "Who is the best CODM gamer in Nigeria as of...", active: false },
];

// Mock conversation messages
const mockMessages = [
  { 
    id: 1, 
    sender: "user", 
    content: "Tell me about solana like I am a two year old"
  },
  { 
    id: 2, 
    sender: "ai", 
    content: "Solana is like a super-fast playground where people build fun digital toys! Imagine you have special digital blocks that everyone can see and nobody can break. People use these blocks to make games, share pictures, and trade special toys.\n\nWhen you want to play with someone else's blocks, you just ask the playground, and zoom! It happens really fast, faster than saying \"one-two-three!\"\n\nThe playground has special helpers called SOL that help you play with all the toys. Everyone takes turns being nice and making sure all the blocks stay in the right places.\n\nThat's Solana - a speedy digital playground where people build cool things together!" 
  }
];

export default function VynaAIChat() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'vynaai' | 'notepad'>('vynaai');
  const [conversations, setConversations] = useState(mockConversations);
  const [messages, setMessages] = useState(mockMessages);
  const [inputValue, setInputValue] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const handleLogin = () => {
    setLocation("/auth");
  };
  
  const handleTabChange = (tab: 'vynaai' | 'notepad') => {
    setActiveTab(tab);
  };
  
  const handleNewChat = () => {
    // In a real implementation, this would create a new chat and redirect
    console.log("Creating new chat...");
  };
  
  const handleConversationClick = (id: number) => {
    const updatedConversations = conversations.map(conv => ({
      ...conv,
      active: conv.id === id
    }));
    setConversations(updatedConversations);
  };
  
  const handleSendMessage = () => {
    if (inputValue.trim() === "") return;
    
    const newMessage = {
      id: messages.length + 1,
      sender: "user" as const,
      content: inputValue
    };
    
    setMessages([...messages, newMessage]);
    setInputValue("");
    
    // Simulate AI response after a short delay (would be a real API call in production)
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        sender: "ai" as const,
        content: "I'll need to think about that. This is a simulated response for demonstration purposes."
      };
      
      setMessages(prevMessages => [...prevMessages, aiResponse]);
      
      // Update the conversation title based on the first user message
      if (messages.length === 1) {
        const title = inputValue.length > 30 
          ? inputValue.substring(0, 30) + "..." 
          : inputValue;
          
        const updatedConversations = [
          {
            id: conversations.length + 1,
            title,
            active: true
          },
          ...conversations.map(conv => ({
            ...conv,
            active: false
          }))
        ];
        
        setConversations(updatedConversations);
      }
    }, 1000);
  };
  
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Header */}
      <header className="flex items-center justify-between h-[60px] px-6 border-b border-[#202020] bg-black z-10">
        <div className="flex items-center">
          <Logo size="sm" />
        </div>
        <button 
          onClick={handleLogin}
          className="rounded-full px-4 py-1.5 text-white bg-[#252525] hover:bg-[#303030] transition-all text-sm font-medium"
        >
          Login
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[270px] bg-[#1A1A1A] border-r border-[#212121] flex flex-col h-full">
          <div className="p-3 pb-2">
            <div className="flex items-center mb-2.5 px-1">
              <div className="p-1 mr-1">
                <FileText size={18} className="text-gray-400" />
              </div>
              <div className="flex p-1 bg-[#202020] rounded-lg">
                <button 
                  className={`flex items-center gap-1 mr-1 px-3 py-1.5 text-xs rounded-md transition-colors ${activeTab === 'vynaai' ? 'bg-[#DCC5A2] text-[#121212] font-medium' : 'bg-transparent text-[#999999] hover:bg-[#333333] hover:text-white'}`}
                  onClick={() => handleTabChange('vynaai')}
                >
                  <Sparkles size={12} />
                  <span>VynaAI</span>
                </button>
                <button 
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-md transition-colors ${activeTab === 'notepad' ? 'bg-[#DCC5A2] text-[#121212] font-medium' : 'bg-transparent text-[#999999] hover:bg-[#333333] hover:text-white'}`}
                  onClick={() => handleTabChange('notepad')}
                >
                  <span>Notepad</span>
                </button>
              </div>
            </div>
            <button 
              className="w-full mb-3 flex items-center justify-center gap-1.5 py-2 bg-[#DCC5A2] text-[#121212] font-medium rounded-md hover:bg-[#C6B190] transition-all"
              onClick={handleNewChat}
            >
              <Plus size={16} />
              <span className="text-sm">New chat</span>
            </button>
          </div>
          
          <div className="px-3 py-2">
            <h3 className="text-xs font-semibold text-[#777777] px-2 mb-1.5">RECENTS</h3>
            <div className="overflow-y-auto h-full max-h-[calc(100vh-180px)]">
              {conversations.map((conv) => (
                <div 
                  key={conv.id}
                  className={`flex items-center justify-between px-2 py-2.5 rounded-md text-sm cursor-pointer ${conv.active ? 'bg-[#252525] text-white' : 'text-[#BBBBBB] hover:bg-[#232323]'}`}
                  onClick={() => handleConversationClick(conv.id)}
                >
                  <div className="truncate">{conv.title}</div>
                  <button className="text-[#777777] hover:text-white p-1">
                    <MoreVertical size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-black">
          {/* Chat Header */}
          <div className="h-[50px] border-b border-[#202020] bg-black flex items-center px-6">
            <button className="p-1 mr-4 text-[#999999] hover:text-white">
              <ArrowLeft size={18} />
            </button>
            <h2 className="flex-1 text-center text-white font-medium">About solana</h2>
            <button className="p-1 ml-4 text-[#999999] hover:text-white">
              <ChevronDown size={18} />
            </button>
          </div>
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-black custom-scrollbar">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex message-appear ${message.sender === 'user' ? 'justify-end' : 'items-start'}`}
              >
                {message.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-[#DCC5A2] flex items-center justify-center flex-shrink-0 mr-3 ai-avatar">
                    <Sparkles size={16} color="#121212" />
                  </div>
                )}
                
                <div 
                  className={`rounded-xl px-4 py-3.5 max-w-[80%] ${
                    message.sender === 'user' 
                      ? 'bg-[#2A2A2A] text-white' 
                      : 'bg-[#232323] text-[#DDDDDD]'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line leading-relaxed">{message.content}</p>
                  
                  {message.sender === 'ai' && (
                    <div className="flex items-center gap-3 mt-3 text-[#777777] message-controls">
                      <button className="hover:text-[#DCC5A2] p-1">
                        <RefreshCw size={14} />
                      </button>
                      <button className="hover:text-[#DCC5A2] p-1">
                        <ThumbsUp size={14} />
                      </button>
                      <button className="hover:text-[#DCC5A2] p-1">
                        <ThumbsDown size={14} />
                      </button>
                      <button className="hover:text-[#DCC5A2] p-1">
                        <Info size={14} />
                      </button>
                      <button className="hover:text-[#DCC5A2] p-1">
                        <MoreVertical size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input Area */}
          <div className="px-6 py-4 border-t border-[#202020] bg-[#141414]">
            <div className="input-area flex flex-col">
              <div className="flex-grow mb-2">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Ask a question"
                  className="chat-input w-full h-[80px] px-4 py-3 text-sm"
                />
              </div>
              
              {/* Input controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5 text-[#999999]">
                  <button className="hover:text-[#DCC5A2] transition-colors" aria-label="Upload file">
                    <Paperclip size={16} />
                  </button>
                  <button className="hover:text-[#DCC5A2] transition-colors" aria-label="Record audio">
                    <Mic size={16} />
                  </button>
                  <button className="hover:text-[#DCC5A2] transition-colors" aria-label="Take photo">
                    <ImageIcon size={16} />
                  </button>
                </div>
                <button 
                  className="button-hover-effect rounded-lg px-5 py-1.5 bg-[#DCC5A2] text-[#121212] font-medium flex items-center gap-1.5 hover:bg-[#C6B190] transition-all text-xs"
                  aria-label="Send message"
                  onClick={handleSendMessage}
                >
                  <span>Send</span>
                  <Upload size={12} className="transform rotate-90" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}