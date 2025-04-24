import { useState, useEffect } from "react";
import { useLocation } from "wouter";
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

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left sidebar - always visible */}
      <div className="w-56 h-full bg-[hsl(var(--ai-background))] border-r border-[hsl(var(--ai-border))] flex flex-col">
        <div className="py-4 px-4 flex items-center">
          <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
            <path d="M18.0002 0L23.6784 6.69459H12.3219L18.0002 0Z" fill="#40C4D0"/>
            <path d="M12.3219 6.69458L18.0002 0L18.0002 6.69458H12.3219Z" fill="#65D3DC"/>
            <path d="M23.6781 6.69458L18 0L18 6.69458H23.6781Z" fill="#1AA7B3"/>
            <path d="M0 18.0002L6.69459 12.3219V23.6784L0 18.0002Z" fill="#65D3DC"/>
            <path d="M6.69458 23.6781L0 18L6.69458 18L6.69458 23.6781Z" fill="#1AA7B3"/>
            <path d="M6.69458 12.3219L0 18L6.69458 18L6.69458 12.3219Z" fill="#40C4D0"/>
            <path d="M36.0002 18.0002L29.3056 23.6784V12.3219L36.0002 18.0002Z" fill="#40C4D0"/>
            <path d="M29.3054 12.3219L36 18L29.3054 18L29.3054 12.3219Z" fill="#1AA7B3"/>
            <path d="M29.3054 23.6781L36 18L29.3054 18L29.3054 23.6781Z" fill="#65D3DC"/>
            <path d="M18.0002 36.0002L12.3219 29.3056H23.6784L18.0002 36.0002Z" fill="#40C4D0"/>
            <path d="M23.6781 29.3054L18 36L18 29.3054H23.6781Z" fill="#65D3DC"/>
            <path d="M12.3219 29.3054L18 36L18 29.3054H12.3219Z" fill="#1AA7B3"/>
            <path d="M18 11.6393L11.6393 18L18 24.3607L24.3607 18L18 11.6393Z" fill="#133C40"/>
          </svg>
          <span className="ml-2 text-lg font-medium">perplexity</span>
        </div>
        
        <div className="px-3 py-4">
          <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-white bg-[hsl(var(--ai-background))] hover:bg-[hsl(var(--ai-card))] rounded-lg transition-colors">
            <span className="mr-1">New Thread</span>
            <span className="ml-auto text-xs opacity-70">Ctrl I</span>
          </button>
        </div>
        
        <nav className="flex-1 px-3">
          <div className="space-y-2">
            <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-[hsl(var(--ai-text-secondary))] hover:bg-[hsl(var(--ai-card))] rounded-lg transition-colors">
              <svg className="h-5 w-5 mr-2 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Home</span>
            </button>
            
            <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-[hsl(var(--ai-text-secondary))] hover:bg-[hsl(var(--ai-card))] rounded-lg transition-colors">
              <svg className="h-5 w-5 mr-2 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Discover</span>
            </button>
            
            <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-[hsl(var(--ai-text-secondary))] hover:bg-[hsl(var(--ai-card))] rounded-lg transition-colors">
              <svg className="h-5 w-5 mr-2 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>Library</span>
            </button>
          </div>
        </nav>
        
        <div className="p-3 border-t border-[hsl(var(--ai-border))]">
          <div className="flex items-center p-2">
            <div className="w-8 h-8 rounded-full bg-teal-700 flex items-center justify-center text-white">
              D
            </div>
            <div className="ml-2">
              <div className="text-sm font-medium">User</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col h-full">
        {/* Chat header */}
        <div className="h-14 border-b border-[hsl(var(--ai-border))] flex items-center justify-between px-4">
          <h1 className="text-lg font-medium">Livestream AI</h1>
          <div className="flex items-center space-x-2">
            <button className="w-9 h-9 flex items-center justify-center rounded-full bg-[hsl(var(--ai-card))] hover:bg-[hsl(var(--ai-card-glass))] transition-colors">
              <svg className="h-5 w-5 text-[hsl(var(--ai-text-secondary))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </button>
            
            <button 
              onClick={startLivestream}
              className="flex items-center space-x-1 bg-[hsl(var(--ai-accent))] text-black px-4 py-1.5 rounded-full text-sm"
            >
              <Video className="h-4 w-4" />
              <span>Go Live</span>
            </button>
          </div>
        </div>
        
        {/* Main chat area */}
        <div className="flex-1 overflow-y-auto">
          <ChatInterface 
            messages={messages} 
            onTeleprompterClick={showTeleprompter}
            isLoading={isLoading}
          />
        </div>
        
        {/* Input area */}
        <div className="p-4 border-t border-[hsl(var(--ai-border))]">
          <div className="mx-auto max-w-2xl">
            <div className="mb-4">
              <div className="flex space-x-3">
                <div 
                  className="perplexity-card flex-1 p-3 cursor-pointer hover:bg-[hsl(var(--ai-card-glass))]"
                  onClick={() => handleSubmit("Create a teleprompter script for my livestream about the latest gaming news")}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-[hsl(180,85%,15%)] flex items-center justify-center">
                      <MonitorSmartphone className="h-4 w-4 text-[hsl(var(--ai-teal))]" />
                    </div>
                    <span className="ml-2 text-sm">Teleprompter</span>
                  </div>
                </div>
                
                <div 
                  className="perplexity-card flex-1 p-3 cursor-pointer hover:bg-[hsl(var(--ai-card-glass))]"
                  onClick={() => handleSubmit("Generate image ideas for my gaming livestream thumbnail")}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-[hsl(180,85%,15%)] flex items-center justify-center">
                      <ImageIcon className="h-4 w-4 text-[hsl(var(--ai-teal))]" />
                    </div>
                    <span className="ml-2 text-sm">Images</span>
                  </div>
                </div>
                
                <div 
                  className="perplexity-card flex-1 p-3 cursor-pointer hover:bg-[hsl(var(--ai-card-glass))]"
                  onClick={() => handleSubmit("Translate this to Spanish: Hello viewers, welcome to today's livestream!")}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-[hsl(180,85%,15%)] flex items-center justify-center">
                      <Translate className="h-4 w-4 text-[hsl(var(--ai-teal))]" />
                    </div>
                    <span className="ml-2 text-sm">Translate</span>
                  </div>
                </div>
              </div>
            </div>
            
            <InputArea onSubmit={handleSubmit} isLoading={isLoading} />
          </div>
        </div>
      </div>

      {/* Teleprompter modal */}
      {teleprompterVisible && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setTeleprompterVisible(false)}>
          <div className="bg-[hsl(var(--ai-card))] rounded-2xl shadow-xl w-full max-w-3xl mx-auto" onClick={(e) => e.stopPropagation()}>
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