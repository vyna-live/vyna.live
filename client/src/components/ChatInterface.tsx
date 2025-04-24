import { MessageType } from "@/pages/Home";
import InfoGraphicCard from "@/components/InfoGraphicCard";
import { Loader2, MonitorSmartphone, UserCircle2, BrainCircuit, FileText } from "lucide-react";

interface ChatInterfaceProps {
  messages: MessageType[];
  onTeleprompterClick: (text: string) => void;
  isLoading: boolean;
}

export default function ChatInterface({
  messages,
  onTeleprompterClick,
  isLoading,
}: ChatInterfaceProps) {
  if (messages.length === 0 && !isLoading) {
    return (
      <div className="p-8 text-center mb-8 animate-fade-in">
        <div className="mb-4 flex justify-center">
          <img 
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&h=150&q=80" 
            alt="AI Assistant" 
            className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
          />
        </div>
        <h3 className="text-xl font-semibold mb-2">Hi, Streamer!</h3>
        <p className="text-[hsl(var(--ai-text-secondary))] max-w-md mx-auto mb-6">
          How can I help you with your livestream today?
        </p>
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          <div className="ai-card p-3 flex flex-col items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium">Analyze Documents</span>
          </div>
          <div className="ai-card p-3 flex flex-col items-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
              <MonitorSmartphone className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-sm font-medium">Teleprompter Script</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="space-y-6">
        {messages.map((message) => (
          <div key={message.id} className="animate-fade-in">
            <div className="flex items-start space-x-3 mb-1">
              {message.role === "user" ? (
                <div className="ai-avatar overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&h=100&q=80" 
                    alt="User" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="ai-avatar overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&h=100&q=80" 
                    alt="AI Assistant" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="flex-1">
                <div
                  className={`${
                    message.role === "user"
                      ? "ai-user-bubble"
                      : "ai-assistant-bubble"
                  } mb-2`}
                >
                  <div className="whitespace-pre-wrap prose prose-sm max-w-none">
                    {message.content.split('\n').map((line, i) => {
                      // Check if the line starts with a bullet or number
                      const isList = line.trim().match(/^(-|\d+\.)\s.+/);
                      
                      // For bullet points, add more spacing
                      if (isList) {
                        return <p key={i} className="my-1 ml-2">{line}</p>;
                      }
                      
                      // Check if line is a heading (all caps or ends with colon)
                      const isHeading = line.trim() === line.trim().toUpperCase() && line.trim().length > 3 || 
                                       line.trim().endsWith(':');
                      
                      if (isHeading && line.trim().length > 0) {
                        return <h4 key={i} className="font-bold mt-3 mb-2">{line}</h4>;
                      }
                      
                      // Regular text line
                      return line.trim().length > 0 ? (
                        <p key={i} className="my-1.5">{line}</p>
                      ) : (
                        <br key={i} />
                      );
                    })}
                  </div>

                  {message.hasInfoGraphic && message.infoGraphicData && (
                    <div className="mt-4">
                      <InfoGraphicCard
                        title={message.infoGraphicData.title}
                        content={message.infoGraphicData.content}
                        imageUrl={message.infoGraphicData.imageUrl}
                      />
                    </div>
                  )}
                </div>
                
                {message.role === "assistant" && (
                  <div className="flex justify-end px-1">
                    <button
                      className="flex items-center space-x-1.5 text-sm text-[hsl(var(--ai-accent))] hover:underline transition-colors"
                      onClick={() => onTeleprompterClick(message.content)}
                    >
                      <MonitorSmartphone className="h-4 w-4" />
                      <span>Use as Teleprompter</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="animate-fade-in">
            <div className="flex items-start space-x-3">
              <div className="ai-avatar overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&h=100&q=80" 
                  alt="AI Assistant" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="ai-assistant-bubble">
                <div className="flex items-center space-x-3">
                  <Loader2 className="h-5 w-5 animate-spin text-[hsl(var(--ai-accent))]" />
                  <span className="text-gray-500">Typing...</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
