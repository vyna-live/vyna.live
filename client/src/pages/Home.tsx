import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import PromptSuggestions from "@/components/PromptSuggestions";
import ChatInterface from "@/components/ChatInterface";
import InputArea from "@/components/InputArea";
import Teleprompter from "@/components/Teleprompter";
import { InfoGraphic } from "@shared/schema";
import { Video, X } from "lucide-react";

export type MessageType = {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  hasInfoGraphic?: boolean;
  infoGraphicData?: InfoGraphic;
};

export default function Home() {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [teleprompterVisible, setTeleprompterVisible] = useState(false);
  const [teleprompterText, setTeleprompterText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

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

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <Header username="John" />
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">AI Research Assistant</h2>
        <button
          onClick={startLivestream}
          className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Video className="h-5 w-5" />
          <span>Go Live</span>
        </button>
      </div>
      
      <PromptSuggestions onPromptClick={handlePromptClick} />
      
      <ChatInterface 
        messages={messages} 
        onTeleprompterClick={showTeleprompter}
        isLoading={isLoading}
      />
      
      <InputArea onSubmit={handleSubmit} isLoading={isLoading} />
      
      {teleprompterVisible && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setTeleprompterVisible(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-auto" onClick={(e) => e.stopPropagation()}>
            <div className="h-[60vh] p-6 relative">
              <button 
                className="absolute top-4 right-4 bg-gray-200 hover:bg-gray-300 p-2 rounded-full"
                onClick={() => setTeleprompterVisible(false)}
              >
                <X className="h-5 w-5 text-gray-700" />
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
