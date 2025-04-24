import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import PromptSuggestions from "@/components/PromptSuggestions";
import ChatInterface from "@/components/ChatInterface";
import InputArea from "@/components/InputArea";
import Teleprompter from "@/components/Teleprompter";
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
  MonitorSmartphone
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

  // Helper to get icon component
  const getIcon = (name: string) => {
    switch(name) {
      case 'file': return <FileText />;
      case 'image': return <ImageIcon />;
      case 'translate': return <Translate />;
      case 'audio': return <Mic />;
      default: return <SearchIcon />;
    }
  };

  return (
    <div className="h-screen flex flex-col p-4">
      <div className="flex-grow">
        {/* Mobile view handling */}
        {isMobile ? (
          // Mobile view - show either history or chat
          <div className="w-full h-full">
            {activePanel === "history" ? (
              // History panel (mobile)
              <div className="glassmorphic flex-grow flex flex-col overflow-hidden h-full">
                <div className="p-4 flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">History</h2>
                  <button 
                    onClick={() => setActivePanel("chat")}
                    className="ai-action-button"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="flex-grow overflow-y-auto p-3">
                  {Object.keys(chatsByDay).sort().reverse().map(dateStr => (
                    <div key={dateStr} className="mb-6">
                      <h3 className="text-sm font-medium text-[hsl(var(--ai-text-secondary))] mb-3">{formatChatDay(dateStr)}</h3>
                      <div className="space-y-3">
                        {chatsByDay[dateStr].map(chat => (
                          <div 
                            key={chat.id} 
                            className="ai-card p-3 cursor-pointer transition-colors hover:bg-[hsl(var(--ai-card))]"
                            onClick={() => loadChat(chat.id)}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center space-x-2">
                                <div className="bg-[hsl(var(--ai-card))] p-1.5 rounded-full">
                                  {getCategoryIcon(chat.category)}
                                </div>
                                <span className="font-medium text-sm">{chat.title}</span>
                              </div>
                              <div className="flex items-center text-xs text-[hsl(var(--ai-text-secondary))] space-x-1">
                                <CalendarDays className="h-3 w-3" />
                                <span>{format(chat.date, 'dd MMMM')}</span>
                              </div>
                            </div>
                            <p className="text-sm text-[hsl(var(--ai-text-secondary))] truncate">{chat.preview}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Chat panel (mobile)
              <div className="glassmorphic flex-grow flex flex-col overflow-hidden h-full">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => setActivePanel("history")}
                      className="ai-action-button"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h2 className="text-2xl font-semibold">Livestream AI</h2>
                  </div>
                  <button 
                    onClick={startLivestream}
                    className="ai-primary-button ai-glow flex items-center space-x-1 px-3 py-1.5 text-sm"
                  >
                    <Video className="h-4 w-4" />
                    <span>Go Live</span>
                  </button>
                </div>
                
                <div className="flex-grow overflow-y-auto">
                  <ChatInterface 
                    messages={messages} 
                    onTeleprompterClick={showTeleprompter}
                    isLoading={isLoading}
                  />
                </div>
                
                <div className="p-3">
                  <div className="flex justify-between space-x-2 mb-3">
                    <div 
                      className="ai-feature-button flex-1"
                      onClick={() => handleSubmit("Create a teleprompter script for my livestream about the latest gaming news")}
                    >
                      <div className="w-10 h-10 bg-purple-800 rounded-lg flex items-center justify-center mb-1">
                        <MonitorSmartphone className="h-5 w-5 text-purple-200" />
                      </div>
                      <span>Teleprompter</span>
                    </div>
                    <div 
                      className="ai-feature-button flex-1"
                      onClick={() => handleSubmit("Generate image ideas for my gaming livestream thumbnail")}
                    >
                      <div className="w-10 h-10 bg-amber-800 rounded-lg flex items-center justify-center mb-1">
                        <ImageIcon className="h-5 w-5 text-amber-200" />
                      </div>
                      <span>Images</span>
                    </div>
                  </div>
                  
                  <InputArea onSubmit={handleSubmit} isLoading={isLoading} />
                </div>
              </div>
            )}
          </div>
        ) : (
          // Desktop view - single joined panel with divider
          <div className="w-full h-full glassmorphic overflow-hidden flex">
            {/* History sidebar */}
            <div className="w-1/3 flex flex-col overflow-hidden">
              <div className="p-4">
                <h2 className="text-2xl font-semibold">History</h2>
              </div>
              
              <div className="flex-grow overflow-y-auto p-3">
                {Object.keys(chatsByDay).sort().reverse().map(dateStr => (
                  <div key={dateStr} className="mb-6">
                    <h3 className="text-sm font-medium text-[hsl(var(--ai-text-secondary))] mb-3">{formatChatDay(dateStr)}</h3>
                    <div className="space-y-3">
                      {chatsByDay[dateStr].map(chat => (
                        <div 
                          key={chat.id} 
                          className="ai-card p-3 cursor-pointer transition-colors hover:bg-[hsl(var(--ai-card))]"
                          onClick={() => loadChat(chat.id)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              <div className="bg-[hsl(var(--ai-card))] p-1.5 rounded-full">
                                {getCategoryIcon(chat.category)}
                              </div>
                              <span className="font-medium text-sm">{chat.title}</span>
                            </div>
                            <div className="flex items-center text-xs text-[hsl(var(--ai-text-secondary))] space-x-1">
                              <CalendarDays className="h-3 w-3" />
                              <span>{format(chat.date, 'dd MMMM')}</span>
                            </div>
                          </div>
                          <p className="text-sm text-[hsl(var(--ai-text-secondary))] truncate">{chat.preview}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Divider */}
            <div className="ai-divider"></div>
            
            {/* Chat area */}
            <div className="w-2/3 flex flex-col overflow-hidden">
              <div className="p-4 flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Livestream AI</h2>
                <button 
                  onClick={startLivestream}
                  className="ai-primary-button ai-glow flex items-center space-x-1 px-3 py-1.5"
                >
                  <Video className="h-4 w-4" />
                  <span>Go Live</span>
                </button>
              </div>
              
              <div className="flex-grow overflow-y-auto">
                <ChatInterface 
                  messages={messages} 
                  onTeleprompterClick={showTeleprompter}
                  isLoading={isLoading}
                />
              </div>
              
              <div className="p-4 border-t border-[hsl(var(--ai-border))]">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div 
                    className="ai-feature-button ai-glow"
                    onClick={() => handleSubmit("Create a teleprompter script for my livestream about the latest gaming news")}
                  >
                    <div className="w-10 h-10 bg-purple-800 rounded-lg flex items-center justify-center mb-1">
                      <MonitorSmartphone className="h-5 w-5 text-purple-200" />
                    </div>
                    <span>Teleprompter</span>
                  </div>
                  <div 
                    className="ai-feature-button ai-glow"
                    onClick={() => handleSubmit("Generate image ideas for my gaming livestream thumbnail")}
                  >
                    <div className="w-10 h-10 bg-amber-800 rounded-lg flex items-center justify-center mb-1">
                      <ImageIcon className="h-5 w-5 text-amber-200" />
                    </div>
                    <span>Images</span>
                  </div>
                  <div 
                    className="ai-feature-button ai-glow"
                    onClick={() => handleSubmit("Translate this to Spanish: Hello viewers, welcome to today's livestream!")}
                  >
                    <div className="w-10 h-10 bg-indigo-800 rounded-lg flex items-center justify-center mb-1">
                      <Translate className="h-5 w-5 text-indigo-200" />
                    </div>
                    <span>Translate</span>
                  </div>
                </div>
                
                <InputArea onSubmit={handleSubmit} isLoading={isLoading} />
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Teleprompter modal */}
      {teleprompterVisible && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setTeleprompterVisible(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-auto" onClick={(e) => e.stopPropagation()}>
            <div className="h-[60vh] p-6 relative">
              <button 
                className="absolute top-4 right-4 ai-action-button"
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
