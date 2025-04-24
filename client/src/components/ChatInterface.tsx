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
      <div className="p-8 text-center animate-fade-in flex flex-col items-center justify-center h-full">
        <div className="mb-8 flex justify-center">
          <img 
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&h=150&q=80" 
            alt="AI Assistant" 
            className="w-28 h-28 rounded-full object-cover border-2 border-[hsl(var(--ai-accent))] shadow-[0_0_15px_rgba(124,58,237,0.5)]"
          />
        </div>
        <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Ready to Improve Your Stream?</h2>
        <p className="text-[hsl(var(--ai-text-secondary))] text-xl max-w-lg mx-auto mb-10">
          I can help prepare scripts, generate ideas, and make your content shine.
        </p>
        <p className="text-[hsl(var(--ai-text-secondary))] opacity-80 max-w-sm mb-6">
          Try asking me to create a teleprompter script or suggest topics for your next stream.
        </p>
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
