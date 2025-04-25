import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import ChatInterface from "@/components/ChatInterface";
import InputArea from "@/components/InputArea";
import Teleprompter from "@/components/Teleprompter";
import Logo from "@/components/Logo";
import GradientText from "@/components/GradientText";
import { InfoGraphic } from "@shared/schema";
import { 
  ArrowLeft, 
  X,
  Expand, 
  FileText, 
  ImageIcon, 
  Mic, 
  Languages as Translate, 
  FileType,
  Video,
  Search as SearchIcon,
  CalendarDays,
  MonitorSmartphone,
  Plus
} from "lucide-react";
import { format } from "date-fns";

export type MessageType = {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  hasInfoGraphic?: boolean;
  infoGraphicData?: InfoGraphic;
  title?: string;
  category?: string;
};

export type ChatHistoryItem = {
  id: string;
  title: string;
  preview: string;
  date: Date;
  category: string;
  icon: string;
  messages: MessageType[];
};

export default function Home() {
  const [activePanel, setActivePanel] = useState<"history" | "chat">("chat");
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [teleprompterVisible, setTeleprompterVisible] = useState(false);
  const [teleprompterText, setTeleprompterText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentChat, setCurrentChat] = useState<ChatHistoryItem | null>(null);
  const [, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Sample chat history (for demonstration)
  useEffect(() => {
    // This would come from a database in a real app
    const sampleHistory: ChatHistoryItem[] = [
      {
        id: "1",
        title: "Livestream Prep",
        preview: "How to engage with viewers",
        date: new Date(2025, 3, 23),
        category: "Research",
        icon: "search",
        messages: []
      },
      {
        id: "2",
        title: "Equipment Setup",
        preview: "Best camera settings for indoor streaming",
        date: new Date(2025, 3, 22),
        category: "Technical",
        icon: "settings",
        messages: []
      }
    ];
    
    setChatHistory(sampleHistory);
  }, []);

  // Add current chat to history
  useEffect(() => {
    if (messages.length > 0 && !currentChat) {
      const userMessage = messages.find(m => m.role === "user");
      const messageContent = userMessage?.content || "";
      const title = messageContent.slice(0, 30) + (messageContent.length > 30 ? "..." : "") || "New Chat";
      
      const newChat: ChatHistoryItem = {
        id: Date.now().toString(),
        title,
        preview: messageContent.slice(0, 50) + (messageContent.length > 50 ? "..." : "") || "",
        date: new Date(),
        category: "Research",
        icon: "search",
        messages: [...messages]
      };
      
      setCurrentChat(newChat);
      setChatHistory(prev => [newChat, ...prev]);
    } else if (currentChat && messages.length > 0) {
      // Update current chat
      setCurrentChat({
        ...currentChat,
        messages: [...messages]
      });
      
      // Update in history
      setChatHistory(prev => 
        prev.map(chat => 
          chat.id === currentChat.id 
            ? {...chat, messages: [...messages]} 
            : chat
        )
      );
    }
  }, [messages, currentChat]);

  const handleSubmit = async (message: string) => {
    if (!message.trim()) return;

    // Add user message
    const userMessageId = Date.now().toString();
    const userMessage: MessageType = {
      id: userMessageId,
      content: message,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Call the API to get a response
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      
      // Add AI response message
      const aiMessage: MessageType = {
        id: Date.now().toString(),
        content: data.text,
        role: "assistant",
        timestamp: new Date(),
        hasInfoGraphic: data.hasInfoGraphic,
        infoGraphicData: data.hasInfoGraphic ? data.infoGraphicData : undefined,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error fetching AI response:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptClick = (promptText: string) => {
    handleSubmit(promptText);
  };

  const showTeleprompter = (text: string) => {
    setTeleprompterText(text);
    setTeleprompterVisible(true);
  };

  const startLivestream = () => {
    // Navigate to livestream page with teleprompter text if available
    const queryParams = teleprompterText 
      ? `?text=${encodeURIComponent(teleprompterText)}` 
      : '';
    setLocation(`/livestream${queryParams}`);
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentChat(null);
    setActivePanel("chat");
  };

  const loadChat = (chatId: string) => {
    const chat = chatHistory.find(c => c.id === chatId);
    if (chat) {
      setMessages(chat.messages);
      setCurrentChat(chat);
      setActivePanel("chat");
    }
  };

  // Group chats by day
  const chatsByDay = chatHistory.reduce((acc, chat) => {
    const dateStr = format(chat.date, 'yyyy-MM-dd');
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(chat);
    return acc;
  }, {} as Record<string, ChatHistoryItem[]>);

  // Format dates for display
  const formatChatDay = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return 'Today';
    } else if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
      return 'Yesterday';
    } else {
      return format(date, 'MMMM d');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch(category.toLowerCase()) {
      case 'research': return <SearchIcon className="h-4 w-4" />;
      case 'technical': return <FileType className="h-4 w-4" />;
      default: return <SearchIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left sidebar - research history */}
      <div className="w-64 h-full bg-[hsl(var(--ai-background))] border-r border-[hsl(var(--ai-border))] flex flex-col">
        <div className="py-4 px-4 flex items-center">
          <Logo size="md" variant="full" className="h-8 max-w-[120px]" />
        </div>
        
        <div className="px-3 py-4">
          <button
            onClick={startNewChat}
            className="w-full flex items-center justify-center space-x-1 bg-gradient-to-r from-[#A67D44] to-[#5D1C34] hover:from-[#B68D54] hover:to-[#6D2C44] text-[#EFE9E1] px-4 py-2 rounded-full text-sm font-medium shadow-md hover:shadow-lg transition-all"
          >
            <span>New Research Session</span>
            <span className="ml-1 opacity-90 text-xs">+</span>
          </button>
        </div>
        
        {/* Research history section */}
        <div className="flex-1 px-3 overflow-y-auto">
          <div className="mb-2 text-xs text-[hsl(var(--ai-text-secondary))] font-medium uppercase tracking-wider px-3 py-1">
            Recent Research
          </div>
          
          <div className="space-y-1.5">
            {Object.entries(chatsByDay).map(([dateStr, sessions]) => (
              <div key={dateStr} className="mb-3">
                <div className="text-xs text-[hsl(var(--ai-text-secondary))] px-3 py-1">
                  {formatChatDay(dateStr)}
                </div>
                
                {sessions.map(session => (
                  <button
                    key={session.id}
                    onClick={() => loadChat(session.id)}
                    className={`flex items-start w-full px-3 py-2 text-sm text-left rounded-lg transition-all ${
                      currentChat?.id === session.id 
                        ? 'bg-gradient-to-r from-[#5D1C34]/20 to-[#A67D44]/10 shadow-sm border border-[#A67D44]/20 text-[#CDBCAB]'
                        : 'text-[hsl(var(--ai-text-secondary))] hover:bg-[hsl(var(--ai-card))] hover:shadow-sm'
                    }`}
                  >
                    <div className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0">
                      {getCategoryIcon(session.category)}
                    </div>
                    <div className="overflow-hidden flex-1">
                      <div className="font-medium truncate">{session.title}</div>
                      <div className="text-xs opacity-70 truncate">{session.preview}</div>
                    </div>
                  </button>
                ))}
              </div>
            ))}
            
            {chatHistory.length === 0 && (
              <div className="text-center py-8 px-3">
                <div className="w-12 h-12 mx-auto rounded-lg bg-gradient-to-r from-[#5D1C34] to-[#A67D44] flex items-center justify-center mb-3 shadow-md">
                  <SearchIcon className="h-6 w-6 text-[#CDBCAB]" />
                </div>
                <p className="text-sm text-[#CDBCAB]">
                  No research history yet
                </p>
                <p className="text-xs text-[hsl(var(--ai-text-secondary))] mt-2">
                  Start a new research session to see it here
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-3 border-t border-[hsl(var(--ai-border))]">
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-teal-700 flex items-center justify-center text-white">
                V
              </div>
              <div className="ml-2">
                <div className="text-sm font-medium">Livestreamer</div>
              </div>
            </div>
            
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-r from-[#5D1C34] to-[#A67D44] hover:shadow-md transition-all text-[#EFE9E1]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col h-full">
        {/* Chat header */}
        <div className="h-14 border-b border-[hsl(var(--ai-border))] flex items-center justify-between px-6">
          <div className="flex items-center">
            <Logo size="sm" showText={false} variant="auto" className="w-auto h-7" />
            <div className="h-6 mx-3 border-r border-[hsl(var(--ai-border))]"></div>
            <GradientText 
              text="AI Research Assistant" 
              preset="warm"
              className="text-base font-semibold" 
              typingSpeed={80}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => {
                // Upload logo feature
                document.getElementById('logo-upload')?.click();
              }}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-gradient-to-r from-[#5D1C34] to-[#A67D44] hover:shadow-md transition-all text-[#EFE9E1]"
              title="Upload logo"
            >
              <ImageIcon className="h-4 w-4" />
            </button>
            
            <input 
              id="logo-upload" 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={async (e) => {
                const files = e.target.files;
                if (!files || files.length === 0) return;
                
                const file = files[0];
                const formData = new FormData();
                formData.append("logo", file);
                
                try {
                  const response = await fetch("/api/logo", {
                    method: "POST",
                    body: formData,
                  });
                  
                  if (!response.ok) {
                    throw new Error("Failed to upload logo");
                  }
                  
                  // Force refresh
                  window.location.reload();
                } catch (error) {
                  console.error("Error uploading logo:", error);
                }
              }}
            />
            
            <button 
              onClick={startLivestream}
              className="flex items-center space-x-1 bg-gradient-to-r from-[#A67D44] to-[#5D1C34] hover:from-[#B68D54] hover:to-[#6D2C44] text-white px-4 py-1.5 rounded-full text-sm font-medium transition-all shadow-md hover:shadow-lg"
            >
              <Video className="h-4 w-4" />
              <span>Go Live</span>
            </button>
          </div>
        </div>
        
        {/* Welcome message when no messages */}
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[hsl(var(--ai-background))] to-[hsl(var(--ai-background))]">
            <div className="max-w-2xl w-full text-center">
              <div className="mb-6">
                <GradientText 
                  text="Welcome to vyna.live" 
                  preset="earthy"
                  className="text-4xl font-bold" 
                  typingSpeed={70}
                />
              </div>
              
              <p className="text-[hsl(var(--ai-text-secondary))] mb-10 max-w-lg mx-auto">
                Your AI-powered research assistant for creating engaging livestream content.
                Upload files, ask questions, and get a teleprompter script ready for your stream.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                <div 
                  className="relative group overflow-hidden rounded-xl bg-gradient-to-br from-[hsl(var(--ai-card))] to-[hsl(var(--ai-card-glass))] p-5 border border-[#5D1C34]/20 cursor-pointer transition-all duration-300 hover:shadow-lg shadow-md"
                  onClick={() => handleSubmit("Create a teleprompter script for my gaming livestream about the latest PlayStation releases")}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-[#5D1C34] to-[#6D2C44] flex items-center justify-center mb-3 transform group-hover:scale-110 transition-transform shadow-md">
                      <MonitorSmartphone className="h-6 w-6 text-[#CDBCAB]" />
                    </div>
                    <h3 className="text-[hsl(var(--ai-text-primary))] font-medium mb-2">Teleprompter</h3>
                    <p className="text-xs text-[hsl(var(--ai-text-secondary))]">Generate streaming scripts from any topic</p>
                  </div>
                </div>
                
                <div 
                  className="relative group overflow-hidden rounded-xl bg-gradient-to-br from-[hsl(var(--ai-card))] to-[hsl(var(--ai-card-glass))] p-5 border border-[#A67D44]/20 cursor-pointer transition-all duration-300 hover:shadow-lg shadow-md"
                  onClick={() => handleSubmit("Research trending topics for tech livestreams this week")}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-[#A67D44] to-[#B68D54] flex items-center justify-center mb-3 transform group-hover:scale-110 transition-transform shadow-md">
                      <SearchIcon className="h-6 w-6 text-[#EFE9E1]" />
                    </div>
                    <h3 className="text-[hsl(var(--ai-text-primary))] font-medium mb-2">Research</h3>
                    <p className="text-xs text-[hsl(var(--ai-text-secondary))]">Find trending topics and insights</p>
                  </div>
                </div>
                
                <div 
                  className="relative group overflow-hidden rounded-xl bg-gradient-to-br from-[hsl(var(--ai-card))] to-[hsl(var(--ai-card-glass))] p-5 border border-[#899481]/20 cursor-pointer transition-all duration-300 hover:shadow-lg shadow-md"
                  onClick={() => {
                    // Trigger file upload dialog
                    document.getElementById('main-file-upload')?.click();
                  }}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-[#899481] to-[#99A491] flex items-center justify-center mb-3 transform group-hover:scale-110 transition-transform shadow-md">
                      <FileText className="h-6 w-6 text-[#EFE9E1]" />
                    </div>
                    <h3 className="text-[hsl(var(--ai-text-primary))] font-medium mb-2">Upload Content</h3>
                    <p className="text-xs text-[hsl(var(--ai-text-secondary))]">Analyze files for your streams</p>
                  </div>
                </div>
              </div>
              
              <input 
                id="main-file-upload" 
                type="file" 
                className="hidden" 
                onChange={(e) => {
                  const files = e.target.files;
                  if (!files || files.length === 0) return;
                  
                  const file = files[0];
                  const fileExt = file.name.split('.').pop()?.toLowerCase();
                  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt || '');
                  
                  if (isImage) {
                    handleSubmit(`Analyze this image and suggest livestream topics related to it: ${file.name}`);
                  } else {
                    handleSubmit(`Extract key points from this document for my livestream: ${file.name}`);
                  }
                  
                  // Reset the input
                  if (e.target) {
                    e.target.value = '';
                  }
                }}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <ChatInterface 
              messages={messages} 
              onTeleprompterClick={showTeleprompter}
              isLoading={isLoading}
            />
          </div>
        )}
        
        {/* Input area */}
        <div className="p-4 border-t border-[hsl(var(--ai-border))]">
          <div className="mx-auto max-w-2xl">
            <InputArea onSubmit={handleSubmit} isLoading={isLoading} sessionId={parseInt(currentChat?.id || '0')} />
          </div>
        </div>
      </div>

      {/* Teleprompter modal */}
      {teleprompterVisible && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setTeleprompterVisible(false)}>
          <div className="bg-[hsl(var(--ai-card))] rounded-2xl shadow-xl w-full max-w-3xl mx-auto" onClick={(e) => e.stopPropagation()}>
            <div className="h-[60vh] p-6 relative">
              <button 
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-r from-[#A67D44] to-[#5D1C34] text-[#EFE9E1] transition-all hover:shadow-md"
                onClick={() => setTeleprompterVisible(false)}
              >
                <X className="h-5 w-5" />
              </button>
              <div className="h-full">
                <Teleprompter 
                  text={teleprompterText} 
                  onClose={() => setTeleprompterVisible(false)} 
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}