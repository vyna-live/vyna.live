import { useState } from "react";
import Header from "@/components/Header";
import PromptSuggestions from "@/components/PromptSuggestions";
import ChatInterface from "@/components/ChatInterface";
import InputArea from "@/components/InputArea";
import Teleprompter from "@/components/Teleprompter";
import { InfoGraphic } from "@shared/schema";

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

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <Header username="John" />
      
      <PromptSuggestions onPromptClick={handlePromptClick} />
      
      <ChatInterface 
        messages={messages} 
        onTeleprompterClick={showTeleprompter}
        isLoading={isLoading}
      />
      
      <InputArea onSubmit={handleSubmit} isLoading={isLoading} />
      
      {teleprompterVisible && (
        <Teleprompter 
          text={teleprompterText} 
          onClose={() => setTeleprompterVisible(false)} 
        />
      )}
    </div>
  );
}
