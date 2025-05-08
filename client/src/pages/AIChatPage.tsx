import { useState } from "react";
import { useLocation } from "wouter";
import { 
  ArrowLeft, 
  ChevronDown, 
  FileText, 
  MessageSquare,
  MoreHorizontal, 
  Plus, 
  Sparkles,
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

type ChatMessage = {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
};

type Conversation = {
  id: string;
  title: string;
  lastUpdated: Date;
  isActive?: boolean;
};

export default function AIChatPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'vynaai' | 'notepad'>('vynaai');
  const [conversations, setConversations] = useState<Conversation[]>([
    { id: '1', title: 'About Solana', lastUpdated: new Date(), isActive: true },
    { id: '2', title: 'Web3 Development', lastUpdated: new Date(Date.now() - 86400000) },
    { id: '3', title: 'AI and Blockchain', lastUpdated: new Date(Date.now() - 172800000) },
    { id: '4', title: 'Smart Contract Security', lastUpdated: new Date(Date.now() - 259200000) },
  ]);
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: '1', 
      content: "Can you tell me about Solana?", 
      sender: 'user', 
      timestamp: new Date(Date.now() - 300000) 
    },
    { 
      id: '2', 
      content: "Solana is a high-performance blockchain platform designed for decentralized applications and cryptocurrencies. It's known for its extremely high throughput and low transaction costs, making it popular for DeFi applications, NFTs, and various Web3 projects.\n\nKey features of Solana include:\n\n1. High throughput: Solana can process thousands of transactions per second, far more than many other popular blockchains.\n\n2. Low transaction fees: Typically less than $0.01 per transaction.\n\n3. Fast finality time: Transactions are confirmed quickly, usually in less than a second.\n\n4. Proof of History (PoH): A unique consensus mechanism that timestamps transactions to improve efficiency.\n\n5. Proof of Stake (PoS): Used in combination with PoH for network security and decentralization.\n\nSolana's native cryptocurrency is SOL, which is used for transaction fees and staking in the network.", 
      sender: 'ai', 
      timestamp: new Date(Date.now() - 240000) 
    },
    { 
      id: '3', 
      content: "What programming languages can I use with Solana?", 
      sender: 'user', 
      timestamp: new Date(Date.now() - 180000) 
    },
    { 
      id: '4', 
      content: "For Solana development, you can use several programming languages, with Rust being the primary and most commonly used option. Here's a breakdown of the languages you can use with Solana:\n\n1. Rust: The primary language for Solana smart contract (program) development. Solana's programming model is designed around Rust, offering optimal performance and safety features.\n\n2. C/C++: You can write Solana programs in C or C++, which are then compiled to the Berkeley Packet Filter (BPF) bytecode that Solana runs.\n\n3. JavaScript/TypeScript: While not used for writing the on-chain programs themselves, JS/TS are extensively used for:\n   - Interacting with Solana programs through the Solana Web3.js library\n   - Building front-end applications that connect to Solana\n   - Creating scripts for testing and deployment\n\n4. Python: Used primarily for testing, scripting, and interacting with the Solana blockchain through libraries like solana-py.\n\n5. Anchor Framework: While not a language itself, Anchor is a popular framework for Solana development that provides a higher-level abstraction over Rust, making development more accessible and reducing boilerplate code.\n\nIf you're new to Solana development, starting with the Anchor framework might be the most approachable option, as it simplifies many of the complexities while still leveraging Rust's performance benefits.", 
      sender: 'ai', 
      timestamp: new Date(Date.now() - 120000) 
    }
  ]);

  const handleLogin = () => {
    setLocation("/auth");
  };

  const handleBack = () => {
    setLocation("/");
  };

  const switchTab = (tab: 'vynaai' | 'notepad') => {
    setActiveTab(tab);
  };

  const handleSendMessage = () => {
    // Implementation would go here
  };

  return (
    <div className="flex h-screen flex-col bg-[#121212]">
      {/* Header */}
      <header className="flex items-center justify-between h-[70px] px-6 md:px-8 bg-[#1A1A1A] border-b border-[#333333]">
        <div className="flex items-center">
          <Logo size="md" />
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
        <div className="flex w-[280px] bg-[#1A1A1A] border-r border-[#333333] flex-col">
          <div className="flex p-4">
            <div className="flex flex-1 mr-2">
              <button 
                className={`flex items-center gap-1 mr-2 px-3 py-1.5 text-xs rounded-md transition-colors ${activeTab === 'vynaai' ? 'bg-[#252525] text-white' : 'bg-transparent text-[#999999] hover:bg-[#333333] hover:text-white'}`}
                onClick={() => switchTab('vynaai')}
              >
                <Sparkles size={12} />
                <span>VynaAI</span>
              </button>
              <button 
                className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-md transition-colors ${activeTab === 'notepad' ? 'bg-[#252525] text-white' : 'bg-transparent text-[#999999] hover:bg-[#333333] hover:text-white'}`}
                onClick={() => switchTab('notepad')}
              >
                <FileText size={12} />
                <span>Notepad</span>
              </button>
            </div>
          </div>

          <button className="mx-4 mb-4 flex items-center justify-center gap-2 rounded-md px-4 py-2 bg-[#DCC5A2] text-[#121212] text-sm font-medium hover:bg-[#C6B190] transition-all">
            <Plus size={16} />
            <span>New chat</span>
          </button>

          <div className="px-4 py-2">
            <h3 className="text-xs font-medium text-[#777777] mb-2">RECENTS</h3>
            <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-240px)]">
              {conversations.map(conversation => (
                <div 
                  key={conversation.id}
                  className={`flex items-center justify-between rounded-md px-3 py-2 ${conversation.isActive ? 'bg-[#252525]' : 'hover:bg-[#1E1E1E]'}`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare size={14} className="text-[#999999]" />
                    <span className="text-sm text-[#CCCCCC] truncate">{conversation.title}</span>
                  </div>
                  <button className="text-[#777777] hover:text-white">
                    <MoreHorizontal size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-[#121212]">
          {/* Chat Title Bar */}
          <div className="flex items-center h-[50px] px-4 border-b border-[#333333] bg-[#1A1A1A]">
            <button 
              onClick={handleBack}
              className="p-1 mr-3 text-[#999999] hover:text-white rounded-md hover:bg-[#252525]"
            >
              <ArrowLeft size={18} />
            </button>
            <h2 className="flex-1 text-center text-white font-medium">About Solana</h2>
            <button className="p-1 text-[#999999] hover:text-white">
              <ChevronDown size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {messages.map(message => (
              <div 
                key={message.id} 
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${message.sender === 'user' ? 'bg-[#252525] rounded-2xl rounded-tr-sm' : 'bg-[#1E1E1E] rounded-2xl rounded-tl-sm'} px-4 py-3`}>
                  {message.sender === 'ai' && (
                    <div className="flex items-center mb-2">
                      <div className="w-6 h-6 bg-[#DCC5A2] rounded-full flex items-center justify-center mr-2">
                        <Sparkles size={12} className="text-[#121212]" />
                      </div>
                      <span className="text-xs font-medium text-[#DCC5A2]">Vyna</span>
                    </div>
                  )}
                  <div className="text-sm text-[#CCCCCC] whitespace-pre-line">{message.content}</div>
                  
                  {message.sender === 'ai' && (
                    <div className="flex items-center mt-3 space-x-2">
                      <button className="p-1 text-[#777777] hover:text-white" title="Regenerate">
                        <RefreshCw size={14} />
                      </button>
                      <button className="p-1 text-[#777777] hover:text-white" title="Thumbs up">
                        <ThumbsUp size={14} />
                      </button>
                      <button className="p-1 text-[#777777] hover:text-white" title="Thumbs down">
                        <ThumbsDown size={14} />
                      </button>
                      <button className="p-1 text-[#777777] hover:text-white" title="More info">
                        <Info size={14} />
                      </button>
                      <button className="p-1 text-[#777777] hover:text-white" title="Options">
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-[#1A1A1A] border-t border-[#333333]">
            <div className="max-w-4xl mx-auto">
              <div className="input-area mb-3">
                <textarea
                  placeholder="Ask your question"
                  className="w-full h-[100px] bg-[#1A1A1A] text-[#CCCCCC] rounded-lg px-4 py-3 outline-none text-sm resize-none border border-[#333333] focus:border-[#DCC5A2] focus:ring-1 focus:ring-[#DCC5A2]/20 transition-all"
                />
              </div>
              
              {/* Input controls */}
              <div className="flex items-center justify-between max-w-4xl mx-auto">
                <div className="flex items-center gap-5 text-white opacity-70">
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
                  onClick={handleSendMessage}
                  className="button-hover-effect rounded-lg px-5 py-1.5 bg-[#DCC5A2] text-[#121212] font-medium flex items-center gap-1.5 hover:bg-[#C6B190] transition-all text-sm"
                >
                  <span>Send</span>
                  <Upload size={14} className="transform rotate-90" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}