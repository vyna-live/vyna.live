import { MessageType } from "@/pages/Home";
import InfoGraphicCard from "@/components/InfoGraphicCard";
import { Loader2, MonitorSmartphone, UserCircle2, BrainCircuit } from "lucide-react";

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
      <div className="glass-card p-8 text-center mb-8 animate-fade-in">
        <BrainCircuit className="h-16 w-16 mx-auto text-purple-500 mb-4 opacity-50" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Your Livestream Assistant</h3>
        <p className="text-gray-500 max-w-md mx-auto mb-6">
          Ask me about topics to discuss, facts to share, or anything else that can enhance your stream!
        </p>
        <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 mx-auto rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="glass-card p-4 shadow-lg rounded-2xl animate-fade-in">
        <div className="p-2 space-y-6">
          {messages.map((message) => (
            <div key={message.id} className="animate-fade-in">
              <div className="flex items-start space-x-3">
                {message.role === "user" ? (
                  <div className="bg-indigo-100 text-indigo-800 p-1.5 rounded-full">
                    <UserCircle2 className="h-6 w-6" />
                  </div>
                ) : (
                  <div className="bg-purple-100 text-purple-800 p-1.5 rounded-full">
                    <BrainCircuit className="h-6 w-6" />
                  </div>
                )}
                
                <div
                  className={`${
                    message.role === "user"
                      ? "bg-indigo-50 border border-indigo-100"
                      : "bg-white border border-purple-100 shadow-sm"
                  } text-gray-800 p-4 rounded-xl flex-1`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>

                  {message.hasInfoGraphic && message.infoGraphicData && (
                    <div className="mt-4">
                      <InfoGraphicCard
                        title={message.infoGraphicData.title}
                        content={message.infoGraphicData.content}
                        imageUrl={message.infoGraphicData.imageUrl}
                      />
                    </div>
                  )}
                  
                  {message.role === "assistant" && (
                    <div className="mt-3 flex justify-end">
                      <button
                        className="primary-button py-1.5 px-3 text-sm flex items-center space-x-1.5 group"
                        onClick={() => onTeleprompterClick(message.content)}
                      >
                        <MonitorSmartphone className="h-4 w-4 group-hover:animate-pulse" />
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
                <div className="bg-purple-100 text-purple-800 p-1.5 rounded-full">
                  <BrainCircuit className="h-6 w-6" />
                </div>
                <div className="bg-white border border-purple-100 shadow-sm text-gray-800 p-4 rounded-xl flex-1">
                  <div className="flex items-center space-x-3">
                    <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                    <span className="text-gray-500">Generating response...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
