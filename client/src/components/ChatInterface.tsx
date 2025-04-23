import { MessageType } from "@/pages/Home";
import InfoGraphicCard from "@/components/InfoGraphicCard";
import { Loader2 } from "lucide-react";

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
    return null;
  }

  return (
    <div className="mb-6">
      <div className="space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="mb-4">
            <div
              className={`${
                message.role === "user"
                  ? "bg-[#E5E7EB] ml-auto"
                  : "bg-white shadow-sm border border-[#E5E7EB]"
              } text-[#1F2937] p-4 rounded-lg inline-block max-w-[80%]`}
            >
              <p>{message.content}</p>

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
              <div className="flex justify-end mt-2">
                <button
                  className="bg-gradient-to-r from-[#A259FF] to-[#4F46E5] text-white text-sm px-4 py-2 rounded-lg flex items-center"
                  onClick={() => onTeleprompterClick(message.content)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                    />
                  </svg>
                  Teleprompter Mode
                </button>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="mb-4">
            <div className="bg-white shadow-sm border border-[#E5E7EB] text-[#1F2937] p-4 rounded-lg inline-block">
              <div className="flex space-x-2">
                <Loader2 className="h-5 w-5 animate-spin text-[#A259FF]" />
                <span className="text-[#6B7280]">Vyna is thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
