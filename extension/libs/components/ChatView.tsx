import React, { useState, useEffect, useRef } from 'react';

interface ChatMessage {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface ChatSession {
  id: number;
  title: string;
  createdAt: string;
  messages?: ChatMessage[];
}

interface ChatViewProps {
  userId?: number;
}

const ChatView: React.FC<ChatViewProps> = ({ userId }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [commentaryStyle, setCommentaryStyle] = useState<'play-by-play' | 'color'>('color');
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Fetch user's chat sessions
  useEffect(() => {
    if (userId) {
      fetchChatSessions();
    }
  }, [userId]);

  // Scroll to bottom of messages
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChatSessions = async () => {
    try {
      setIsLoading(true);
      // Get token from storage
      chrome.storage.local.get(['token'], async (result) => {
        if (result.token) {
          const response = await fetch(`https://vyna.live/api/ai-chat-sessions/${userId}`, {
            headers: {
              'Authorization': `Bearer ${result.token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setSessions(data);
            
            // Select the most recent session if available
            if (data.length > 0) {
              const latestSession = data[0]; // Assuming sorted by latest
              setCurrentSession(latestSession);
              fetchChatMessages(latestSession.id);
            }
          }
        }
      });
    } catch (error) {
      console.error('Failed to fetch chat sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChatMessages = async (sessionId: number) => {
    try {
      // Get token from storage
      chrome.storage.local.get(['token'], async (result) => {
        if (result.token) {
          const response = await fetch(`https://vyna.live/api/ai-chat-messages/${sessionId}`, {
            headers: {
              'Authorization': `Bearer ${result.token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setMessages(data.map((msg: any) => ({
              id: msg.id,
              role: msg.isUser ? 'user' : 'assistant',
              content: msg.content,
              timestamp: msg.createdAt
            })));
          }
        }
      });
    } catch (error) {
      console.error('Failed to fetch chat messages:', error);
    }
  };

  const createNewChat = async () => {
    try {
      setIsLoading(true);
      // Get token from storage
      chrome.storage.local.get(['token'], async (result) => {
        if (result.token) {
          const response = await fetch('https://vyna.live/api/ai-chat-sessions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${result.token}`
            },
            body: JSON.stringify({
              hostId: userId,
              title: 'New Chat'
            })
          });
          
          if (response.ok) {
            const newSession = await response.json();
            setSessions(prev => [newSession, ...prev]);
            setCurrentSession(newSession);
            setMessages([]);
          }
        }
      });
    } catch (error) {
      console.error('Failed to create new chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentSession || !userId) return;
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // Get token from storage
      chrome.storage.local.get(['token'], async (result) => {
        if (result.token) {
          // Save user message
          const saveResponse = await fetch('https://vyna.live/api/ai-chat-messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${result.token}`
            },
            body: JSON.stringify({
              sessionId: currentSession.id,
              hostId: userId,
              content: inputMessage,
              isUser: true
            })
          });
          
          if (saveResponse.ok) {
            // Get AI response
            const aiResponse = await fetch('https://vyna.live/api/ai/chat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${result.token}`
              },
              body: JSON.stringify({
                message: inputMessage,
                commentaryStyle: commentaryStyle,
                sessionId: currentSession.id
              })
            });
            
            if (aiResponse.ok) {
              const data = await aiResponse.json();
              setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.response
              }]);
              
              // Update session title if it's a new chat
              if (currentSession.title === 'New Chat' && data.title) {
                const updatedSession = { ...currentSession, title: data.title };
                setCurrentSession(updatedSession);
                setSessions(prev => prev.map(s => 
                  s.id === currentSession.id ? updatedSession : s
                ));
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const selectSession = (session: ChatSession) => {
    setCurrentSession(session);
    fetchChatMessages(session.id);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar - Session List */}
      <div className="w-1/3 bg-zinc-900 border-r border-zinc-800 overflow-y-auto">
        <div className="p-2">
          <button
            onClick={createNewChat}
            className="w-full py-2 bg-primary/10 text-primary text-sm rounded flex items-center justify-center"
          >
            <span>New Chat</span>
          </button>
        </div>
        
        <div className="mt-2">
          {sessions.map(session => (
            <div 
              key={session.id}
              className={`p-2 text-sm cursor-pointer hover:bg-zinc-800 ${currentSession?.id === session.id ? 'bg-zinc-800' : ''}`}
              onClick={() => selectSession(session)}
            >
              <div className="truncate">{session.title}</div>
              <div className="text-xs text-zinc-500">
                {new Date(session.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-zinc-950">
          {messages.map((msg, idx) => (
            <div key={idx} className={`mb-4 ${msg.role === 'user' ? 'pl-8' : 'pr-8'}`}>
              <div className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-zinc-800 ml-auto' : 'bg-zinc-900'}`}>
                <div className="text-sm">{msg.content}</div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
            </div>
          )}
          <div ref={messageEndRef} />
        </div>
        
        {/* Input Area */}
        <div className="border-t border-zinc-800 p-3">
          <div className="flex gap-2 mb-2">
            <button 
              onClick={() => setCommentaryStyle('play-by-play')}
              className={`px-3 py-1 text-xs rounded-full ${commentaryStyle === 'play-by-play' ? 'bg-primary text-black' : 'bg-zinc-800 text-zinc-400'}`}
            >
              Play-by-Play
            </button>
            <button 
              onClick={() => setCommentaryStyle('color')}
              className={`px-3 py-1 text-xs rounded-full ${commentaryStyle === 'color' ? 'bg-primary text-black' : 'bg-zinc-800 text-zinc-400'}`}
            >
              Color Commentary
            </button>
          </div>
          <div className="flex">
            <textarea
              className="flex-1 p-2 bg-zinc-800 border border-zinc-700 rounded-l text-white resize-none"
              rows={2}
              placeholder="Type your message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="px-4 bg-primary text-black rounded-r"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatView;