import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AIChatTabProps {
  messages: Message[];
  onSendMessage: (message: string, commentaryStyle?: string) => Promise<any>;
  userId: number;
}

const AIChatTab: React.FC<AIChatTabProps> = ({ messages, onSendMessage, userId }) => {
  const [messageInput, setMessageInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentaryStyle, setCommentaryStyle] = useState<'play-by-play' | 'color' | undefined>(undefined);
  
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // Scroll to bottom of messages container when messages change
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  const handleSendMessage = async () => {
    if (messageInput.trim() === '' || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      await onSendMessage(messageInput, commentaryStyle);
      setMessageInput('');
      setCommentaryStyle(undefined);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setIsSubmitting(true);
      
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64data = reader.result?.toString().split(',')[1];
          
          // Call API to process the file
          const response = await chrome.runtime.sendMessage({
            type: 'API_REQUEST',
            data: {
              endpoint: '/api/upload',
              method: 'POST',
              body: {
                userId,
                fileData: base64data,
                fileName: file.name,
                fileType: file.type
              }
            }
          });
          
          if (response.success) {
            setMessageInput(`Analyzing file: ${file.name}`);
            await handleSendMessage();
          }
        } catch (error) {
          console.error('File upload error:', error);
        } finally {
          setIsSubmitting(false);
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('File handling error:', error);
      setIsSubmitting(false);
    }
    
    // Reset file input
    event.target.value = '';
  };
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        try {
          setIsSubmitting(true);
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          
          // Convert audio blob to base64
          const reader = new FileReader();
          reader.onloadend = async () => {
            try {
              const base64data = reader.result?.toString().split(',')[1];
              
              // Call API to process the audio
              const response = await chrome.runtime.sendMessage({
                type: 'API_REQUEST',
                data: {
                  endpoint: '/api/transcribe',
                  method: 'POST',
                  body: { userId, audioData: base64data }
                }
              });
              
              if (response.success && response.data?.text) {
                setMessageInput(response.data.text);
              }
            } catch (error) {
              console.error('Audio transcription error:', error);
            } finally {
              setIsSubmitting(false);
            }
          };
          
          reader.readAsDataURL(audioBlob);
        } catch (error) {
          console.error('Audio processing error:', error);
          setIsSubmitting(false);
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Media recording error:', error);
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all audio tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };
  
  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  const triggerImageInput = () => {
    imageInputRef.current?.click();
  };
  
  const toggleCommentaryStyle = (style: 'play-by-play' | 'color') => {
    if (commentaryStyle === style) {
      setCommentaryStyle(undefined);
    } else {
      setCommentaryStyle(style);
    }
  };
  
  return (
    <div className="tab-content active h-full flex flex-col">
      {messages.length > 0 ? (
        <div className="messages-container" ref={messagesContainerRef}>
          {messages.map((message, index) => (
            <div key={message.id || index} className={`message ${message.role}`}>
              {message.role === 'assistant' && (
                <div className="avatar">
                  <img src="../assets/vyna-avatar.svg" alt="Vyna AI" width="32" height="32" />
                </div>
              )}
              <div className="message-content">
                {message.content}
              </div>
              {message.role === 'user' && (
                <div className="avatar">
                  <img src="../assets/user-avatar.svg" alt="User" width="32" height="32" />
                </div>
              )}
            </div>
          ))}
          
          {isSubmitting && (
            <div className="message assistant">
              <div className="avatar">
                <img src="../assets/vyna-avatar.svg" alt="Vyna AI" width="32" height="32" />
              </div>
              <div className="message-content">
                <div className="loading-indicator"></div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="empty-state">
          <div className="icon-container">
            <img className="empty-state-icon" src="../assets/vynaai-icon.svg" alt="VynaAI" width="32" height="32" />
          </div>
          <h2>VynaAI</h2>
          <p>Ask questions to quickly research topics while streaming</p>
        </div>
      )}
      
      <div className="input-area">
        <div className="input-container">
          <div className="input-tools">
            <button className="tool-button" onClick={triggerFileInput}>
              <svg className="tool-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button 
              className={`tool-button ${isRecording ? 'bg-red-600/20 text-red-500' : ''}`} 
              onClick={handleMicClick}
            >
              <svg className="tool-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="tool-button" onClick={triggerImageInput}>
              <svg className="tool-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="21 15 16 10 5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button 
              className={`ml-auto px-2 py-0.5 text-xs rounded-full ${commentaryStyle === 'play-by-play' ? 'bg-blue-600/20 text-blue-400' : 'bg-gray-700/40 text-gray-400'}`}
              onClick={() => toggleCommentaryStyle('play-by-play')}
              title="Play-by-Play Commentary"
            >
              PP
            </button>
            <button 
              className={`ml-1 px-2 py-0.5 text-xs rounded-full ${commentaryStyle === 'color' ? 'bg-green-600/20 text-green-400' : 'bg-gray-700/40 text-gray-400'}`}
              onClick={() => toggleCommentaryStyle('color')}
              title="Color Commentary"
            >
              CC
            </button>
          </div>
          <div className="input-row">
            <textarea 
              className="input-field" 
              placeholder="Message" 
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isSubmitting}
              rows={1}
            ></textarea>
            <button 
              className="rounded-full p-2 bg-primary text-white disabled:opacity-50"
              onClick={handleSendMessage}
              disabled={messageInput.trim() === '' || isSubmitting}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <input 
        type="file" 
        id="file-input" 
        className="hidden" 
        accept=".pdf,.doc,.docx,.txt"
        ref={fileInputRef}
        onChange={handleFileUpload}
      />
      <input 
        type="file" 
        id="image-input" 
        className="hidden" 
        accept="image/*"
        ref={imageInputRef}
        onChange={handleFileUpload}
      />
    </div>
  );
};

export default AIChatTab;