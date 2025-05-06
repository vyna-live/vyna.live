import React, { useState, useRef } from 'react';

interface Note {
  id: number;
  title: string;
  content: string;
  createdAt: string;
}

interface NotepadTabProps {
  notes: Note[];
  onAddNote: (content: string) => Promise<any>;
  userId: number;
}

const NotepadTab: React.FC<NotepadTabProps> = ({ notes, onAddNote, userId }) => {
  const [noteInput, setNoteInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  
  const handleAddNote = async () => {
    if (noteInput.trim() === '' || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      await onAddNote(noteInput);
      setNoteInput('');
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleAddNote();
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
            setNoteInput(prev => `${prev ? prev + '\n\n' : ''}File: ${file.name}`);
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
                setNoteInput(prev => `${prev ? prev + '\n\n' : ''}${response.data.text}`);
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
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  return (
    <div className="tab-content active h-full flex flex-col">
      {notes.length > 0 ? (
        <div className="notes-container">
          {notes.map(note => (
            <div key={note.id} className="note">
              <div className="note-title flex justify-between items-center">
                <span>{note.title || 'Untitled Note'}</span>
                <span className="text-xs text-white/50">{formatDate(note.createdAt)}</span>
              </div>
              <div className="note-text">{note.content}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>Research Notes</h2>
          <p>Save important information for your stream</p>
        </div>
      )}
      
      <div className="input-area">
        <div className="input-container">
          <div className="input-row">
            <textarea 
              className="input-field" 
              placeholder="Type a new note" 
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isSubmitting}
              rows={3}
            ></textarea>
          </div>
          <div className="flex justify-between items-center mt-2">
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
            </div>
            <button 
              className="add-button"
              onClick={handleAddNote}
              disabled={noteInput.trim() === '' || isSubmitting}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="add-button-text">Add note</span>
            </button>
          </div>
        </div>
      </div>
      
      <input 
        type="file" 
        id="note-file-input" 
        className="hidden" 
        accept=".pdf,.doc,.docx,.txt"
        ref={fileInputRef}
        onChange={handleFileUpload}
      />
      <input 
        type="file" 
        id="note-image-input" 
        className="hidden" 
        accept="image/*"
        ref={imageInputRef}
        onChange={handleFileUpload}
      />
    </div>
  );
};

export default NotepadTab;