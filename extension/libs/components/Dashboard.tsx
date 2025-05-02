import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAiChats, getNotepads, logout, getCurrentUser } from '@libs/utils/api';
import { clearUserData, getStoredSettings, User } from '@libs/utils/storage';
import { extractCurrentPageContent } from '@libs/utils/api';
import Logo from '@libs/components/ui/Logo';

export interface DashboardProps {
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean | null>>;
}

const Dashboard: React.FC<DashboardProps> = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [aiChats, setAiChats] = useState<any[]>([]);
  const [notepads, setNotepads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ai-chat' | 'notepad'>('ai-chat');
  const [currentPage, setCurrentPage] = useState<{ title: string; url: string; content: string } | null>(null);

  // Fetch user data and history on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Get current user data
        const userData = await getCurrentUser();
        setUser(userData);
        
        // Fetch AI chats and notepads in parallel
        const [aiChatsData, notepadsData] = await Promise.all([
          getAiChats(),
          getNotepads()
        ]);
        
        setAiChats(aiChatsData || []);
        setNotepads(notepadsData || []);
        
        // Try to extract current page content
        try {
          const settings = await getStoredSettings();
          if (settings.extractPageContent) {
            const pageContent = await extractCurrentPageContent();
            setCurrentPage(pageContent);
          }
        } catch (pageError) {
          console.error('Failed to extract page content:', pageError);
          // Don't set error state here, it's not critical
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load your data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      await clearUserData();
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Logout error:', err);
      // Even if API call fails, we can still clear local data
      await clearUserData();
      setIsAuthenticated(false);
    }
  };

  // Create new AI chat
  const handleNewAiChat = () => {
    navigate('/ai-chat');
  };

  // Create new notepad
  const handleNewNotepad = () => {
    navigate('/notepad');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="dashboard-container p-4">
      <header className="flex items-center justify-between mb-6">
        <Logo size={32} />
        
        <div className="flex items-center">
          <span className="text-sm font-medium mr-4">
            {user?.displayName || user?.username || 'User'}
          </span>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-600 hover:text-primary"
          >
            Sign out
          </button>
        </div>
      </header>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
          {error}
        </div>
      )}
      
      {currentPage && (
        <div className="current-page bg-gray-50 p-3 rounded-md mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-sm truncate">{currentPage.title}</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => navigate(`/ai-chat?page=${encodeURIComponent(currentPage.url)}`)}
                className="bg-primary/10 hover:bg-primary/20 text-primary text-xs py-1 px-2 rounded-md"
              >
                Ask Vyna
              </button>
              <button
                onClick={() => navigate(`/notepad?page=${encodeURIComponent(currentPage.url)}`)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs py-1 px-2 rounded-md"
              >
                Take Notes
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 truncate">{currentPage.url}</p>
        </div>
      )}
      
      <div className="tabs flex border-b mb-4">
        <button
          className={`tab py-2 px-4 text-sm font-medium ${activeTab === 'ai-chat' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
          onClick={() => setActiveTab('ai-chat')}
        >
          AI Chats
        </button>
        <button
          className={`tab py-2 px-4 text-sm font-medium ${activeTab === 'notepad' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
          onClick={() => setActiveTab('notepad')}
        >
          Notes
        </button>
      </div>
      
      <div className="content-area">
        {activeTab === 'ai-chat' ? (
          <>
            <button
              onClick={handleNewAiChat}
              className="w-full mb-4 flex items-center justify-center bg-primary text-white py-2 rounded-md font-medium hover:bg-primary/90 transition-colors"
            >
              <span className="mr-1">+</span> New Chat
            </button>
            
            {aiChats.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No chats yet. Start a new conversation!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {aiChats.map((chat) => (
                  <Link
                    key={chat.id}
                    to={`/ai-chat/${chat.id}`}
                    className="block bg-white hover:bg-gray-50 border rounded-md p-3"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm truncate">{chat.title}</h3>
                      <span className="text-xs text-gray-500">
                        {formatDate(chat.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {chat.lastMessage || 'No messages'}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <button
              onClick={handleNewNotepad}
              className="w-full mb-4 flex items-center justify-center bg-primary text-white py-2 rounded-md font-medium hover:bg-primary/90 transition-colors"
            >
              <span className="mr-1">+</span> New Note
            </button>
            
            {notepads.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No notes yet. Create your first note!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notepads.map((notepad) => (
                  <Link
                    key={notepad.id}
                    to={`/notepad/${notepad.id}`}
                    className="block bg-white hover:bg-gray-50 border rounded-md p-3"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm truncate">{notepad.title}</h3>
                      <span className="text-xs text-gray-500">
                        {formatDate(notepad.updatedAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {notepad.content.substring(0, 100) || 'Empty note'}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      
      <div className="mt-4 text-center">
        <Link
          to="/settings"
          className="text-xs text-gray-500 hover:text-primary"
        >
          Settings
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
