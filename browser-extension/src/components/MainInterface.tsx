import React, { useState } from 'react';
import AIChatTab from './AIChatTab';
import NotepadTab from './NotepadTab';

interface User {
  id: number;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

interface MainInterfaceProps {
  user: User;
  onLogout: () => void;
}

const MainInterface: React.FC<MainInterfaceProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'notepad'>('chat');
  
  return (
    <div className="flex flex-col h-full bg-[#1a1a1a] text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-[#333333]">
        <div className="flex items-center">
          <div className="text-2xl font-light mr-1 text-[#CDBCAB]">
            <span className="font-normal">Vyna</span>
            <span className="text-xs align-top ml-0.5">.live</span>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-full bg-gray-300 overflow-hidden mr-2">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.displayName || user.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#a67d44] flex items-center justify-center text-white text-xs">
                  {(user.displayName || user.username).charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <span className="text-sm font-medium">{user.displayName || user.username}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex space-x-1 p-3 border-b border-[#333333]">
        <button
          className={`flex items-center space-x-1 py-1 px-3 rounded-md ${activeTab === 'chat' ? 'bg-[#2a2a2a]' : 'hover:bg-[#2a2a2a]/50'}`}
          onClick={() => setActiveTab('chat')}
        >
          <div className="w-5 h-5 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <span>VynaAI</span>
        </button>
        
        <button
          className={`flex items-center space-x-1 py-1 px-3 rounded-md ${activeTab === 'notepad' ? 'bg-[#2a2a2a]' : 'hover:bg-[#2a2a2a]/50'}`}
          onClick={() => setActiveTab('notepad')}
        >
          <div className="w-5 h-5 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <span>Notepad</span>
        </button>
        
        <button className="ml-auto text-white/70 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </button>
      </div>
      
      {/* Active Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' ? <AIChatTab /> : <NotepadTab />}
      </div>
      
      {/* Footer */}
      <div className="py-1 px-3 border-t border-[#333333] text-center">
        <div className="flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#CDBCAB] mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="text-xs text-[#CDBCAB]">vynalive.com</span>
        </div>
      </div>
    </div>
  );
};

export default MainInterface;