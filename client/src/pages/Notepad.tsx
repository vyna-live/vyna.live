import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  ChevronDown, 
  MoreVertical, 
  Plus, 
  Sparkles, 
  FileText,
  Paperclip,
  Mic,
  Image as ImageIcon,
  Upload
} from "lucide-react";
import Logo from "@/components/Logo";
import "../pages/VynaAIChat.css";

interface Note {
  id: number;
  title: string;
  content: string;
  active: boolean;
  createdAt: Date;
}

// Sample notes data
const sampleNotes: Note[] = [
  { 
    id: 1, 
    title: "About solana",
    content: "Solana is like a super-fast playground where people build fun digital toys! Imagine you have special digital blocks that everyone can see and nobody can break. People use these blocks to make games, share pictures, and trade special toys.\n\nWhen you want to play with someone else's blocks, you just ask the playground, and zoom! It happens really fast, faster than saying \"one-two-three!\"\n\nThe playground has special helpers called SOL that help you play with all the toys. Everyone takes turns being nice and making sure all the blocks stay in the right places.\n\nThat's Solana - a speedy digital playground where people build cool things together!",
    active: true,
    createdAt: new Date()
  },
  { 
    id: 2, 
    title: "Who is the best CODM gamer in Nigeria as of...",
    content: "I don't have information about who was the best Call of Duty Mobile player in Nigeria as of March 2025, as my knowledge cutoff date is before this time. To find the most accurate and up-to-date information, I would recommend checking official CODM tournament results, leaderboards specific to Nigeria, or gaming community forums where Nigerian players are active.",
    active: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60)
  },
  { 
    id: 3, 
    title: "Who is the best CODM gamer in Nigeria as of...",
    content: "I don't have information about who was the best Call of Duty Mobile player in Nigeria as of March 2025, as my knowledge cutoff date is before this time. To find the most accurate and up-to-date information, I would recommend checking official CODM tournament results, leaderboards specific to Nigeria, or gaming community forums where Nigerian players are active.",
    active: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2)
  },
  { 
    id: 4, 
    title: "Who is the best CODM gamer in Nigeria as of...",
    content: "I don't have information about who was the best Call of Duty Mobile player in Nigeria as of March 2025, as my knowledge cutoff date is before this time. To find the most accurate and up-to-date information, I would recommend checking official CODM tournament results, leaderboards specific to Nigeria, or gaming community forums where Nigerian players are active.",
    active: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3)
  },
  { 
    id: 5, 
    title: "Who is the best CODM gamer in Nigeria as of...",
    content: "I don't have information about who was the best Call of Duty Mobile player in Nigeria as of March 2025, as my knowledge cutoff date is before this time. To find the most accurate and up-to-date information, I would recommend checking official CODM tournament results, leaderboards specific to Nigeria, or gaming community forums where Nigerian players are active.",
    active: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4)
  },
  { 
    id: 6, 
    title: "Who is the best CODM gamer in Nigeria as of...",
    content: "I don't have information about who was the best Call of Duty Mobile player in Nigeria as of March 2025, as my knowledge cutoff date is before this time. To find the most accurate and up-to-date information, I would recommend checking official CODM tournament results, leaderboards specific to Nigeria, or gaming community forums where Nigerian players are active.",
    active: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5)
  }
];

export default function Notepad() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'vynaai' | 'notepad'>('notepad');
  const [notes, setNotes] = useState<Note[]>(sampleNotes);
  const [inputValue, setInputValue] = useState("");
  const [currentTitle, setCurrentTitle] = useState("About solana");
  const [currentNoteContent, setCurrentNoteContent] = useState(sampleNotes[0].content);
  
  const contentRef = useRef<HTMLDivElement>(null);
  
  const handleLogin = () => {
    setLocation("/auth");
  };
  
  const handleTabChange = (tab: 'vynaai' | 'notepad') => {
    setActiveTab(tab);
    if (tab === 'vynaai') {
      setLocation("/ai-chat");
    }
  };
  
  const handleNewNote = () => {
    // Create a new blank note
    const newNote: Note = {
      id: notes.length + 1,
      title: "New note",
      content: "",
      active: true,
      createdAt: new Date()
    };
    
    // Update notes list
    const updatedNotes = notes.map(note => ({
      ...note,
      active: false
    }));
    
    setNotes([newNote, ...updatedNotes]);
    setCurrentTitle("New note");
    setCurrentNoteContent("");
  };
  
  const handleNoteClick = (id: number) => {
    const updatedNotes = notes.map(note => ({
      ...note,
      active: note.id === id
    }));
    
    setNotes(updatedNotes);
    
    // Update current note content
    const selectedNote = notes.find(note => note.id === id);
    if (selectedNote) {
      setCurrentTitle(selectedNote.title);
      setCurrentNoteContent(selectedNote.content);
    }
  };
  
  const handleAddNote = () => {
    if (inputValue.trim() === "") return;
    
    // Find the active note
    const activeNote = notes.find(note => note.active);
    
    if (activeNote) {
      // Update its content
      const updatedNotes = notes.map(note => {
        if (note.id === activeNote.id) {
          const updatedContent = note.content 
            ? `${note.content}\n\n${inputValue}` 
            : inputValue;
          
          // Set the title if it's a new note
          const updatedTitle = note.title === "New note" && !note.content
            ? (inputValue.length > 30 ? inputValue.substring(0, 30) + "..." : inputValue)
            : note.title;
            
          return {
            ...note,
            content: updatedContent,
            title: updatedTitle
          };
        }
        return note;
      });
      
      setNotes(updatedNotes);
      
      // Update the current note content
      const updatedNote = updatedNotes.find(note => note.active);
      if (updatedNote) {
        setCurrentNoteContent(updatedNote.content);
        setCurrentTitle(updatedNote.title);
      }
    } else {
      // No active note, create one
      handleNewNote();
    }
    
    setInputValue("");
  };
  
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddNote();
    }
  };
  
  // Get a preview of the note content (first 60 characters)
  const getNotePreview = (content: string) => {
    return content.length > 60 
      ? content.substring(0, 60) + "..." 
      : content;
  };

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Header */}
      <header className="flex items-center justify-between h-[60px] px-6 border-b border-[#202020] bg-black z-10">
        <div className="flex items-center">
          <Logo size="sm" />
        </div>
        <button 
          onClick={handleLogin}
          className="rounded-full px-4 py-1.5 text-white bg-[#252525] hover:bg-[#303030] transition-all text-sm font-medium"
        >
          Login
        </button>
      </header>

      {/* Main content with spacing from navbar */}
      <div className="flex flex-1 p-4 pt-4 overflow-hidden">
        {/* Sidebar with spacing */}
        <aside className="w-[270px] bg-[#1A1A1A] rounded-lg flex flex-col h-full mr-4 overflow-hidden">
          <div className="p-3 pb-2">
            <div className="flex items-center mb-2.5 px-1">
              <div className="p-1 mr-1">
                <FileText size={18} className="text-gray-400" />
              </div>
              <div className="flex p-1 bg-[#202020] rounded-lg">
                <button 
                  className={`flex items-center gap-1 mr-1 px-3 py-1.5 text-xs rounded-md transition-colors ${activeTab === 'vynaai' ? 'bg-[#DCC5A2] text-[#121212] font-medium' : 'bg-transparent text-[#999999] hover:bg-[#333333] hover:text-white'}`}
                  onClick={() => handleTabChange('vynaai')}
                >
                  <Sparkles size={12} />
                  <span>VynaAI</span>
                </button>
                <button 
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-md transition-colors ${activeTab === 'notepad' ? 'bg-[#DCC5A2] text-[#121212] font-medium' : 'bg-transparent text-[#999999] hover:bg-[#333333] hover:text-white'}`}
                  onClick={() => handleTabChange('notepad')}
                >
                  <span>Notepad</span>
                </button>
              </div>
            </div>
            <button 
              className="w-full mb-3 flex items-center justify-center gap-1.5 py-2 bg-[#DCC5A2] text-[#121212] font-medium rounded-md hover:bg-[#C6B190] transition-all"
              onClick={handleNewNote}
            >
              <Plus size={16} />
              <span className="text-sm">New note</span>
            </button>
          </div>
          
          <div className="px-3 py-2">
            <h3 className="text-xs font-semibold text-[#777777] px-2 mb-1.5">RECENTS</h3>
            <div className="overflow-y-auto h-full max-h-[calc(100vh-220px)] custom-scrollbar pb-3">
              {notes.map((note) => (
                <div 
                  key={note.id}
                  className={`flex flex-col px-2 py-2.5 rounded-md text-sm cursor-pointer mb-1 ${note.active ? 'bg-[#252525]' : 'hover:bg-[#232323]'}`}
                  onClick={() => handleNoteClick(note.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className={`truncate font-medium ${note.active ? 'text-white' : 'text-[#BBBBBB]'}`}>
                      {note.title}
                    </div>
                    <button className="text-[#777777] hover:text-white p-1">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                  <div className="text-[#777777] text-xs mt-1 line-clamp-2">
                    {getNotePreview(note.content)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Note Area */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-black rounded-lg">
          {/* Note Header */}
          <div className="h-[50px] border-b border-[#202020] bg-black flex items-center px-6 rounded-t-lg">
            <h2 className="flex-1 text-center flex items-center justify-center text-white font-medium">
              {currentTitle}
              <button className="p-1 ml-2 text-[#999999] hover:text-white">
                <ChevronDown size={16} />
              </button>
            </h2>
          </div>
          
          {/* Note Content Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-black">
            {currentNoteContent ? (
              <div 
                ref={contentRef}
                className="text-[#DDDDDD] text-sm leading-relaxed whitespace-pre-line"
              >
                {currentNoteContent}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center px-4 empty-state-animation">
                <h2 className="text-3xl font-bold text-white mb-3">Notepad</h2>
                <p className="text-[#BBBBBB] text-sm max-w-[400px]">
                  Take notes while streaming or researching
                </p>
              </div>
            )}
          </div>
          
          {/* Input Area */}
          <div className="p-4 bg-black rounded-b-lg">
            <div className="input-area flex flex-col bg-[#1A1A1A] rounded-lg p-3">
              <div className="flex-grow mb-2">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Type your note"
                  className="chat-input w-full h-[60px] px-3 py-2 text-sm bg-transparent"
                />
              </div>
              
              {/* Input controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5 text-[#999999]">
                  <button className="hover:text-[#DCC5A2] transition-colors" aria-label="Upload file">
                    <Paperclip size={16} />
                  </button>
                  <button className="hover:text-[#DCC5A2] transition-colors" aria-label="Record audio">
                    <Mic size={16} />
                  </button>
                  <button className="hover:text-[#DCC5A2] transition-colors" aria-label="Take photo">
                    <ImageIcon size={16} />
                  </button>
                </div>
                <button 
                  className="button-hover-effect rounded-lg px-5 py-1.5 bg-[#DCC5A2] text-[#121212] font-medium flex items-center gap-1.5 hover:bg-[#C6B190] transition-all text-xs"
                  aria-label="Add note"
                  onClick={handleAddNote}
                >
                  <span>Add note</span>
                  <Plus size={12} />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}