import { MessageType } from "@/pages/Home";
import InfoGraphicCard from "@/components/InfoGraphicCard";
import { Loader2, MonitorSmartphone, FileText } from "lucide-react";

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
      <div className="flex flex-col items-center justify-center h-full py-20 px-4 text-center">
        <h1 className="text-4xl font-normal mb-8">What do you want to know?</h1>
        
        <div className="w-full max-w-2xl mb-12">
          <div className="border border-[hsl(var(--ai-border))] bg-[hsl(var(--ai-card))] rounded-xl p-4 text-[hsl(var(--ai-text-secondary))] text-center">
            Ask for livestreaming tips, scripts, or content ideas
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-2xl">
          <div className="perplexity-card p-4">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-lg bg-[hsl(180,85%,15%)] flex items-center justify-center mb-3">
                <MonitorSmartphone className="h-6 w-6 text-[hsl(var(--ai-teal))]" />
              </div>
              <span className="text-sm text-center">Ask for a teleprompter script</span>
            </div>
          </div>
          
          <div className="perplexity-card p-4">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-lg bg-[hsl(180,85%,15%)] flex items-center justify-center mb-3">
                <FileText className="h-6 w-6 text-[hsl(var(--ai-teal))]" />
              </div>
              <span className="text-sm text-center">Get content ideas for your stream</span>
            </div>
          </div>
          
          <div className="perplexity-card p-4">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-lg bg-[hsl(180,85%,15%)] flex items-center justify-center mb-3">
                <svg className="h-6 w-6 text-[hsl(var(--ai-teal))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-sm text-center">Optimize your streaming setup</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <div className="max-w-3xl mx-auto">
        {messages.map((message, index) => (
          <div key={message.id} className="animate-fade-in">
            {message.role === "user" ? (
              <div className="px-4 py-6 text-lg">
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center text-white font-medium">
                    U
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="whitespace-pre-wrap leading-relaxed bg-gray-100 dark:bg-zinc-800 p-3 rounded-[14px]">
                      {message.content}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-4 py-6 bg-[#2A2A2D] border-t border-b border-zinc-800 rounded-[14px]">
                <div className="max-w-3xl mx-auto">
                  <div className="flex items-start">
                    <div className="w-8 h-8 flex-shrink-0">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#65D3DC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                      </svg>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="mb-1 text-sm text-[hsl(var(--ai-text-secondary))]">Livestream AI</div>
                      <div className="prose prose-invert max-w-none">
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
                            return <h4 key={i} className="font-bold mt-4 mb-2">{line}</h4>;
                          }
                          
                          // Regular text line
                          return line.trim().length > 0 ? (
                            <p key={i} className="my-3 leading-relaxed">{line}</p>
                          ) : (
                            <br key={i} />
                          );
                        })}
                      </div>

                      {message.hasInfoGraphic && message.infoGraphicData && (
                        <div className="mt-4 perplexity-card p-4">
                          <InfoGraphicCard
                            title={message.infoGraphicData.title}
                            content={message.infoGraphicData.content}
                            imageUrl={message.infoGraphicData.imageUrl}
                          />
                        </div>
                      )}
                      
                      <div className="mt-4 flex items-center justify-end space-x-3">
                        <button
                          className="flex items-center justify-center w-8 h-8 text-zinc-400 hover:text-white transition-colors"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 4v16h16V4H4zm2 14V6h12v12H6z" fill="currentColor"/>
                            <path d="M8 8h8v8H8V8z" fill="currentColor"/>
                          </svg>
                        </button>
                        <button
                          className="flex items-center justify-center w-8 h-8 text-zinc-400 hover:text-white transition-colors"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 14l6-6l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button
                          className="flex items-center justify-center w-8 h-8 text-zinc-400 hover:text-white transition-colors"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 10l6 6l6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button
                          className="flex items-center justify-center w-8 h-8 text-zinc-400 hover:text-white transition-colors"
                          onClick={() => onTeleprompterClick(message.content)}
                        >
                          <span className="font-bold">T</span>
                        </button>
                        <button
                          className="flex items-center justify-center w-8 h-8 text-zinc-400 hover:text-white transition-colors"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="animate-fade-in px-4 py-6 bg-[#2A2A2D] border-t border-b border-zinc-800 rounded-[14px]">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-start">
                <div className="w-8 h-8 flex-shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#65D3DC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center space-x-3">
                    <Loader2 className="h-5 w-5 animate-spin text-[hsl(var(--ai-accent))]" />
                    <span className="text-white">Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
