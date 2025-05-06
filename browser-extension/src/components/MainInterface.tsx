import React, { useState, useEffect } from 'react';
import AIChatTab from './AIChatTab';
import NotepadTab from './NotepadTab';

interface User {
  id: number;
  username: string;
  email: string;
  displayName?: string;
}

interface MainInterfaceProps {
  user: User;
  onLogout: () => Promise<void>;
}

type Tab = 'vynaai' | 'notepad';

const MainInterface: React.FC<MainInterfaceProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<Tab>('vynaai');
  const [messages, setMessages] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Load AI chat messages
        const messagesResponse = await chrome.runtime.sendMessage({
          type: 'API_REQUEST',
          data: {
            endpoint: `/api/ai-chats/${user.id}`,
            method: 'GET'
          }
        });
        
        if (messagesResponse.success) {
          setMessages(messagesResponse.data || []);
        }
        
        // Load notepad notes
        const notesResponse = await chrome.runtime.sendMessage({
          type: 'API_REQUEST',
          data: {
            endpoint: `/api/notepads/${user.id}`,
            method: 'GET'
          }
        });
        
        if (notesResponse.success) {
          setNotes(notesResponse.data || []);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [user.id]);
  
  const handleTabClick = (tab: Tab) => {
    setActiveTab(tab);
  };
  
  const handleSendMessage = async (message: string, commentaryStyle?: string) => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'API_REQUEST',
        data: {
          endpoint: '/api/ai-chat/send',
          method: 'POST',
          body: {
            userId: user.id,
            message,
            commentaryStyle
          }
        }
      });
      
      if (response.success && response.data) {
        // Update messages with the new message and response
        setMessages(prevMessages => [...prevMessages, response.data]);
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to send message');
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  };
  
  const handleAddNote = async (content: string) => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'API_REQUEST',
        data: {
          endpoint: '/api/notepad/add',
          method: 'POST',
          body: {
            userId: user.id,
            content
          }
        }
      });
      
      if (response.success && response.data) {
        // Update notes with the new note
        setNotes(prevNotes => [...prevNotes, response.data]);
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to add note');
    } catch (error) {
      console.error('Add note error:', error);
      throw error;
    }
  };
  
  return (
    <div className="main-interface">
      <header className="header">
        <img className="header-logo" src="../assets/vyna-logo.svg" alt="Vyna.live" width="84" height="28" />
      </header>
      
      <div className="tabs">
        <div 
          className={`tab ${activeTab === 'vynaai' ? 'active' : ''}`}
          onClick={() => handleTabClick('vynaai')}
        >
          <svg className="tab-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
            <path d="M12 3L14.5 8.5H9.5L12 3Z" fill="currentColor"/>
            <path d="M22 12L16.5 14.5V9.5L22 12Z" fill="currentColor"/>
            <path d="M12 21L9.5 15.5H14.5L12 21Z" fill="currentColor"/>
            <path d="M2 12L7.5 9.5V14.5L2 12Z" fill="currentColor"/>
            <path d="M12 8L16 12L12 16L8 12L12 8Z" fill="currentColor"/>
          </svg>
          VynaAI
        </div>
        <div 
          className={`tab ${activeTab === 'notepad' ? 'active' : ''}`}
          onClick={() => handleTabClick('notepad')}
        >
          <svg className="tab-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
            <path d="M19 3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19Z" fill="currentColor"/>
            <path d="M17 7H7V9H17V7Z" fill="currentColor"/>
            <path d="M17 11H7V13H17V11Z" fill="currentColor"/>
            <path d="M13 15H7V17H13V15Z" fill="currentColor"/>
          </svg>
          Notepad
        </div>
      </div>
      
      <div className="content">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="loading-indicator"></div>
          </div>
        ) : (
          <>
            {activeTab === 'vynaai' && (
              <AIChatTab 
                messages={messages} 
                onSendMessage={handleSendMessage} 
                userId={user.id} 
              />
            )}
            
            {activeTab === 'notepad' && (
              <NotepadTab 
                notes={notes} 
                onAddNote={handleAddNote} 
                userId={user.id} 
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MainInterface;