import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Copy, X, ChevronLeft, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import AgoraVideo from './AgoraVideo';
import VynaChat from './VynaChat';
import GradientText from './GradientText';
import { MessageType } from '../types/chat';
import vpwwLogo from '@/assets/vpww.png';

// Define Note type
type Note = {
  id: string;
  title: string;
  content: string;
  date: Date;
};

interface StreamingRoomProps {
  channelName: string;
  title?: string;
  description?: string;
  rtmpDestinations?: string[];
  initialText?: string;
  onEnd?: () => void;
}

export default function StreamingRoom({
  channelName,
  title,
  description,
  rtmpDestinations = [],
  initialText = '',
  onEnd
}: StreamingRoomProps) {
  // State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerContent, setDrawerContent] = useState<'chat' | 'teleprompter'>('chat');
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [teleprompterText, setTeleprompterText] = useState(initialText);
  const [isLoading, setIsLoading] = useState(false);
  
  // Tab state for drawer
  const [activeTab, setActiveTab] = useState<'vynaai' | 'notepad'>('vynaai');
  
  // Notepad state
  const [notepadView, setNotepadView] = useState<'list' | 'new' | 'view'>('list');
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [savedNotes, setSavedNotes] = useState<Note[]>([
    {
      id: '1',
      title: 'Who is the best CODM gamer in Nigeria...',
      content: `I don't have definitive information about who the best Call of Duty Mobile (CODM) player in Nigeria is as of March 2025. My knowledge cutoff is October 2024, so I don't have access to current rankings, tournament results, or player statistics from March 2025.\n\nTo find accurate information about the top CODM players in Nigeria currently, I'd recommend:\n1. Checking official CODM tournament results for any Nigerian championships held in early 2025\n2. Looking at regional leaderboards within the game\n3. Following Nigerian esports organizations that field CODM teams\n4. Checking social media accounts of known Nigerian CODM content creators and competitive players\n5. Visiting Nigerian gaming forums or communities where this topic might be discussed\n\nIf you're interested in who was prominent in the Nigerian CODM scene before my knowledge cutoff, I could share information about players who were rising in popularity during 2024, but I can't make claims about who would be considered the best as of March 2025.`,
      date: new Date()
    },
    {
      id: '2',
      title: 'Who is the best CODM gamer in Nigeria...',
      content: `I don't have information about who was the best Call of Duty Mobile player in Nigeria as of March 2025, as my knowledge only extends to October 2024.`,
      date: new Date()
    },
    {
      id: '3',
      title: 'Who is the best CODM gamer in Nigeria...',
      content: `I don't have information about who was the best Call of Duty Mobile player in Nigeria as of March 2025, as my knowledge only extends to October 2024.`,
      date: new Date()
    },
    {
      id: '4',
      title: 'Who is the best CODM gamer in Nigeria...',
      content: `I don't have information about who was the best Call of Duty Mobile player in Nigeria as of March 2025, as my knowledge only extends to October 2024.`,
      date: new Date()
    },
    {
      id: '5',
      title: 'Who is the best CODM gamer in Nigeria...',
      content: `I don't have information about who was the best Call of Duty Mobile player in Nigeria as of March 2025, as my knowledge only extends to October 2024.`,
      date: new Date()
    },
    {
      id: '6',
      title: 'Who is the best CODM gamer in Nigeria...',
      content: `I don't have information about who was the best Call of Duty Mobile player in Nigeria as of March 2025, as my knowledge only extends to October 2024.`,
      date: new Date()
    }
  ]);
  
  const { toast } = useToast();

  // Message handlers
  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    // Add user message to chat
    const userMessage: MessageType = {
      id: Date.now().toString(),
      content: message,
      role: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Show loading state
    setIsLoading(true);
    
    try {
      // Send to AI and get response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }
      
      const data = await response.json();
      
      // Add AI response to chat
      const aiMessage: MessageType = {
        id: Date.now().toString(),
        content: data.message,
        role: 'assistant',
        timestamp: new Date(),
        hasInfoGraphic: !!data.infoGraphic,
        infoGraphicData: data.infoGraphic
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast({
        title: 'Error',
        description: 'Failed to get AI response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Teleprompter handlers
  const handleTeleprompterClick = (text: string) => {
    setTeleprompterText(text);
    setDrawerContent('teleprompter');
    
    toast({
      title: 'Added to teleprompter',
      description: 'The text has been added to your teleprompter',
    });
  };
  
  const handleCopyTeleprompter = () => {
    navigator.clipboard.writeText(teleprompterText);
    
    toast({
      title: 'Copied to clipboard',
      description: 'Teleprompter text has been copied to clipboard',
    });
  };
  
  const handleClearTeleprompter = () => {
    setTeleprompterText('');
    
    toast({
      title: 'Teleprompter cleared',
      description: 'Teleprompter text has been cleared',
    });
  };
  
  // Notepad handlers
  const handleNewNote = () => {
    setNotepadView('new');
    setNoteInput('');
  };
  
  const handleViewNote = (note: Note) => {
    setCurrentNote(note);
    setNotepadView('view');
  };
  
  const handleBackToNotesList = () => {
    setNotepadView('list');
    setCurrentNote(null);
  };
  
  const handleAddNote = () => {
    if (!noteInput.trim()) {
      toast({
        title: 'Note is empty',
        description: 'Please enter some text for your note',
        variant: 'destructive',
      });
      return;
    }
    
    const newNote = {
      id: Date.now().toString(),
      title: noteInput.length > 40 ? noteInput.substring(0, 40) + '...' : noteInput,
      content: noteInput,
      date: new Date()
    };
    
    setSavedNotes(prev => [newNote, ...prev]);
    setNotepadView('list');
    setNoteInput('');
    
    toast({
      title: 'Note added',
      description: 'Your note has been saved',
    });
  };
  
  const handleSendToTeleprompter = () => {
    if (currentNote) {
      setTeleprompterText(currentNote.content);
      
      toast({
        title: 'Added to teleprompter',
        description: 'Note content has been added to the teleprompter',
      });
    }
  };
  
  // Add streaming-mode class to body when component mounts
  useEffect(() => {
    document.body.classList.add('streaming-mode');
    
    return () => {
      // Remove streaming-mode class from body when component unmounts
      document.body.classList.remove('streaming-mode');
    };
  }, []);

  return (
    <div style={{margin: '8px'}} className="h-[calc(100vh-16px)] w-[calc(100vw-16px)] overflow-hidden bg-black relative rounded-2xl">
      {/* Top header row with Vyna logo - transparent background */}
      <div className="absolute top-0 left-0 right-0 z-30 px-4 py-2 flex items-center justify-between bg-transparent rounded-t-2xl">
        <div className="flex items-center">
          <img src={vpwwLogo} alt="Vyna.live" className="h-9" />
        </div>
        
        {!isDrawerOpen && (
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full overflow-hidden">
              <img src="https://i.pravatar.cc/100" alt="Divine Samuel" className="h-full w-full object-cover" />
            </div>
            <span className="text-white text-xs font-normal">Divine Samuel</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 6L8 10L12 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </div>
      
      {/* Second row with channel name and viewer count - transparent background */}
      <div className="absolute top-[48px] left-0 right-0 z-30 px-4 py-2 flex items-center justify-between bg-transparent">
        {/* Only show streamer info when drawer is not open */}
        {!isDrawerOpen && (
          <div className="flex items-center">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full overflow-hidden">
                <img src="https://i.pravatar.cc/100" alt="Divine Samuel" className="h-full w-full object-cover" />
              </div>
              <span className="text-white text-xs font-normal">Divine Samuel</span>
            </div>
            
            <div className="flex items-center mx-2">
              <span className="text-white/40 text-xs">•</span>
            </div>
          </div>
        )}

        {/* Center title */}
        <div className={isDrawerOpen ? "ml-4" : "absolute left-1/2 transform -translate-x-1/2"}>
          <span className="text-white text-xs font-medium">Jaja Games</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Only show viewer count when drawer is not open */}
          {!isDrawerOpen && (
            <div className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 12C14.4853 12 16.5 9.98528 16.5 7.5C16.5 5.01472 14.4853 3 12 3C9.51472 3 7.5 5.01472 7.5 7.5C7.5 9.98528 9.51472 12 12 12Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 20.25C3 16.6587 7.02944 13.75 12 13.75C16.9706 13.75 21 16.6587 21 20.25V20.5C21 20.7761 20.7761 21 20.5 21H3.5C3.22386 21 3 20.7761 3 20.5V20.25Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-white text-[11px]">123.5k</span>
            </div>
          )}
          
          {!isDrawerOpen && (
            <button 
              className="flex items-center justify-center hover:bg-white/10 p-1 rounded-md"
              onClick={() => setIsDrawerOpen(true)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 6L9 12L15 18" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 6L3 12L9 18" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Main content area with video */}
      <div className="flex h-full gap-4">
        {/* Main video area */}
        <div 
          className={cn(
            "transition-all duration-300 ease-in-out relative overflow-hidden rounded-2xl",
            isDrawerOpen 
              ? "w-[calc(100%-336px)]" // 320px width + 16px gap
              : "w-full"
          )}
        >
          {/* Video stream */}
          <div className="absolute inset-0 overflow-hidden">
            <AgoraVideo 
              channelName={channelName}
              mode="livestream"
              showControls={false}
              enableMultiplatform={rtmpDestinations.length > 0}
              rtmpDestinations={rtmpDestinations}
              onError={(error) => {
                toast({
                  title: 'Streaming Error',
                  description: error,
                  variant: 'destructive',
                });
                
                if (onEnd) {
                  onEnd();
                }
              }}
              className="h-full w-full object-cover"
            />
          </div>
          
          {/* Chat messages bottom left */}
          <div className="absolute left-4 bottom-24 flex flex-col gap-2 z-10 max-w-xs">
            <div className="flex items-start gap-2 animate-slide-up">
              <div className="h-6 w-6 rounded-full overflow-hidden bg-orange-500">
                <img src="https://i.pravatar.cc/100?img=20" alt="User" className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-white font-medium">Innocent Dive</span>
                <span className="text-xs text-white/90">How far my guys wetin dey happen</span>
              </div>
            </div>
            
            <div className="flex items-start gap-2 animate-slide-up animation-delay-100">
              <div className="h-6 w-6 rounded-full overflow-hidden bg-gray-600">
                <img src="https://i.pravatar.cc/100?img=30" alt="User" className="h-full w-full object-cover opacity-80" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-white font-medium">Godknows Ukari</span>
                <span className="text-xs text-white/90">How far my guys wetin dey happen</span>
              </div>
            </div>
            
            <div className="flex items-start gap-2 animate-slide-up animation-delay-200">
              <div className="h-6 w-6 rounded-full overflow-hidden bg-gradient-to-r from-yellow-500 to-pink-500">
                <img src="https://i.pravatar.cc/100?img=40" alt="User" className="h-full w-full object-cover opacity-90" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-white font-medium">Godknows Ukari</span>
                <span className="text-xs text-white/90">How far my guys wetin dey happen</span>
              </div>
            </div>
            
            <div className="flex items-center mt-1 animate-slide-up animation-delay-300">
              <span className="text-red-500 mr-1 text-xs">●</span>
              <span className="text-xs text-white font-medium">Goddess</span>
              <span className="text-xs text-white/70 ml-1">joined</span>
            </div>
          </div>
          
          {/* Control panel at bottom */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
            <div className="flex items-center gap-1 bg-[#333333]/80 backdrop-blur-md rounded-full px-1 py-1">
              {/* Microphone icon */}
              <button className="h-10 w-10 flex items-center justify-center rounded-full text-white hover:bg-white/10 bg-[#555555]/80">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 1C10.3431 1 9 2.34315 9 4V12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12V4C15 2.34315 13.6569 1 12 1Z" stroke="white" strokeWidth="1.5"/>
                  <path d="M8 11C8 13.2091 9.79086 15 12 15C14.2091 15 16 13.2091 16 11M6 11H18M12 15V19M8 23H16" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
              
              {/* Camera icon */}
              <button className="h-10 w-10 flex items-center justify-center rounded-full text-white hover:bg-white/10 bg-[#555555]/80">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="6" width="15" height="12" rx="2" stroke="white" strokeWidth="1.5"/>
                  <path d="M17 12L22 9V15L17 12Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                </svg>
              </button>
              
              {/* Emoji icon */}
              <button className="h-10 w-10 flex items-center justify-center rounded-full text-white hover:bg-white/10 bg-[#555555]/80">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5"/>
                  <path d="M7 14C8.5 16 9.5 17 12 17C14.5 17 15.5 16 17 14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="9" cy="10" r="1" fill="white"/>
                  <circle cx="15" cy="10" r="1" fill="white"/>
                </svg>
              </button>
              
              {/* Screen sharing icon */}
              <button className="h-10 w-10 flex items-center justify-center rounded-full text-white hover:bg-white/10 bg-[#555555]/80">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="4" width="20" height="16" rx="2" stroke="white" strokeWidth="1.5"/>
                  <path d="M8 12L12 8M12 8L16 12M12 8V16" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              {/* Text/Info icon (T) */}
              <button className="h-10 w-10 flex items-center justify-center rounded-full text-white hover:bg-white/10 bg-[#555555]/80">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5"/>
                  <path d="M8 8H16M12 8V16M8 16H16" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
              
              {/* End call button */}
              <button className="h-10 w-10 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Sidebar drawer with tabs that match the design in screenshot */}
        {isDrawerOpen && (
          <div className="w-[320px] h-full rounded-2xl overflow-hidden bg-black">
            {/* Custom header with buttons matching the design */}
            <div className="h-12 flex items-center px-2 border-b border-white/10 bg-black">
              <div className="flex items-center space-x-2 w-full">
                {/* Close button */}
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("DRAWER CLOSE BUTTON CLICKED: CLOSING DRAWER");
                    setIsDrawerOpen(false);
                  }}
                  className="h-8 w-8 flex items-center justify-center rounded hover:bg-white/10"
                  aria-label="Close panel"
                  id="drawerCloseButton"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 18L15 12L9 6M3 18L9 12L3 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                
                {/* VynaAI button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("VYNA AI BUTTON CLICKED: SETTING ACTIVE TAB TO VYNAAI");
                    setActiveTab('vynaai');
                  }}
                  className={`px-3 py-1 rounded-md flex items-center ${
                    activeTab === 'vynaai' 
                      ? 'bg-white text-black' 
                      : 'text-white/80'
                  }`}
                  id="vynaAIButton"
                >
                  <svg className="mr-1.5" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill={activeTab === 'vynaai' ? 'black' : 'white'} strokeWidth="1.5"/>
                  </svg>
                  VynaAI
                </button>
                
                {/* Notepad button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("NOTEPAD BUTTON CLICKED: SETTING ACTIVE TAB TO NOTEPAD");
                    setActiveTab('notepad');
                  }}
                  className={`px-3 py-1 rounded-md flex items-center ${
                    activeTab === 'notepad' 
                      ? 'bg-white text-black' 
                      : 'text-white/80'
                  }`}
                  id="notepadButton"
                >
                  <svg className="mr-1.5" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 4h12v16H6zm0 0h12v16H6z" stroke={activeTab === 'notepad' ? 'black' : 'white'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 8h6M9 12h6M9 16h4" stroke={activeTab === 'notepad' ? 'black' : 'white'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Notepad
                </button>
              </div>
            </div>
            
            {/* Tab content */}
            <div className="h-[calc(100%-48px)] bg-[#121212]">
              {activeTab === 'vynaai' ? (
                <VynaChat 
                  onClose={(e?: React.MouseEvent) => {
                    if (e) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                    console.log("VYNACHAT CLOSE HANDLER CALLED: CLOSING DRAWER");
                    setIsDrawerOpen(false);
                  }}
                  isInStreamView={true}
                  hideHeader={true} // Hide the header since we have our own
                />
              ) : (
                <div className="h-full bg-[#121212] flex flex-col">
                  {/* Notepad Views */}
                  {notepadView === 'list' && (
                    <div className="flex flex-col h-full bg-[#121212]">
                      <div className="px-4 py-2">
                        <h3 className="text-xs font-medium text-neutral-400 uppercase">RECENTS</h3>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto bg-[#121212]">
                        <div className="space-y-0">
                          {savedNotes.map((note) => (
                            <div 
                              key={note.id} 
                              className="px-4 py-3 hover:bg-[#1A1A1A] flex justify-between items-center border-b border-[#191919] cursor-pointer"
                              onClick={() => handleViewNote(note)}
                            >
                              <div className="flex-1">
                                <p className="text-sm text-white truncate">{note.title}</p>
                                <p className="text-xs text-white/60 truncate">{note.content.substring(0, 60)}</p>
                              </div>
                              <button className="text-white/60 p-1">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                                  <circle cx="6" cy="12" r="1.5" fill="currentColor"/>
                                  <circle cx="18" cy="12" r="1.5" fill="currentColor"/>
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="p-4 bg-[#121212] mt-auto">
                        <button 
                          className="w-full py-2 px-4 bg-[#D6C6AF] hover:bg-[#C6B69F] rounded-lg text-sm text-black flex items-center justify-center"
                          onClick={handleNewNote}
                        >
                          <span className="mr-1">+</span>
                          New note
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {notepadView === 'new' && (
                    <div className="flex flex-col h-full bg-[#121212]">
                      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
                        <h3 className="text-xl font-medium text-white mb-1">Research Notes</h3>
                        <p className="text-sm text-neutral-400 text-center mb-8">
                          Save important information for<br/>your stream
                        </p>
                        
                        <textarea 
                          className="w-full h-64 bg-[#1A1A1A] rounded-lg p-3 resize-none text-white border border-white/10 focus:outline-none focus:border-white/30 mb-8"
                          placeholder="Type a new note"
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                        ></textarea>
                        
                        <div className="w-full flex items-center">
                          <div className="flex items-center gap-2">
                            <button className="text-white/60 p-1">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21 14l-3 3H7a3 3 0 01-3-3V7a3 3 0 013-3h10a3 3 0 013 3v7zm-9-4v8m-4-4h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                            <button className="text-white/60 p-1">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 3v18m-9-9h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                            <button className="text-white/60 p-1">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 9h18m-18 6h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                          </div>
                          
                          <button 
                            className="ml-auto py-1 px-3 bg-[#D6C6AF] hover:bg-[#C6B69F] rounded-md text-sm text-black flex items-center"
                            onClick={handleAddNote}
                          >
                            <span className="mr-1">+</span>
                            Add note
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {notepadView === 'view' && currentNote && (
                    <div className="flex flex-col h-full bg-[#121212]">
                      <div className="px-4 py-3 flex items-center border-b border-white/10">
                        <button 
                          className="mr-2 p-1 hover:bg-white/10 rounded"
                          onClick={handleBackToNotesList}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <h3 className="text-sm font-medium truncate flex-1">{currentNote.title}</h3>
                        <button className="p-1 hover:bg-white/10 rounded">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 9L12 15L18 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#121212]">
                        <p className="text-sm text-white whitespace-pre-line">{currentNote.content}</p>
                      </div>
                      
                      <div className="p-4 bg-[#121212] mt-auto">
                        <button 
                          className="w-full py-2 px-4 bg-[#D6C6AF] hover:bg-[#C6B69F] rounded-lg text-sm text-black flex items-center justify-center"
                          onClick={handleSendToTeleprompter}
                        >
                          Teleprompter
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}