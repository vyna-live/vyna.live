import { useState, useRef } from "react";
import { Send, Loader2, SearchIcon, FileText, ImageIcon, AlertCircle } from "lucide-react";
import FileUploader from "./FileUploader";

interface InputAreaProps {
  onSubmit: (message: string) => void;
  isLoading: boolean;
  sessionId?: number;
}

export default function InputArea({ onSubmit, isLoading, sessionId }: InputAreaProps) {
  const [message, setMessage] = useState("");
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{id: number, name: string}[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (message.trim() && !isLoading) {
      // Add file references if any
      let fullMessage = message;
      
      if (uploadedFiles.length > 0) {
        fullMessage += "\n\n[Files attached: " + 
          uploadedFiles.map(f => f.name).join(", ") + "]";
      }
      
      onSubmit(fullMessage);
      setMessage("");
      setUploadedFiles([]);
      
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Tab") {
      e.preventDefault();
      setMessage(prev => prev + " ");
    }
  };
  
  const handleFileUpload = async (file: File) => {
    try {
      setUploadingFiles(true);
      setUploadError(null);
      
      const formData = new FormData();
      formData.append("file", file);
      
      if (sessionId) {
        formData.append("sessionId", sessionId.toString());
      }
      
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload file");
      }
      
      const data = await response.json();
      
      if (data.success) {
        setUploadedFiles(prev => [
          ...prev, 
          { id: data.file.id, name: data.file.originalName }
        ]);
        
        // Suggest a more detailed prompt based on file type but let user edit before sending
        if (data.file.fileType.startsWith("image/")) {
          setMessage(prev => {
            const basePrompt = "Provide a comprehensive and detailed analysis of this image, including:";
            const details = [
              "- Visual elements and composition",
              "- Main subjects and objects",
              "- Colors, lighting, and mood",
              "- Context and potential meaning",
              "- Technical aspects (if relevant)",
              `The image filename is: ${data.file.originalName}`
            ].join("\n");
            
            // If there's existing text, append to it
            if (prev.trim()) {
              return `${prev}\n\n${basePrompt}\n${details}`;
            } else {
              return `${basePrompt}\n${details}`;
            }
          });
        } else {
          setMessage(prev => {
            const basePrompt = "Please extract and analyze the key information from this document, including:";
            const details = [
              "- Main topics and themes",
              "- Important facts, figures, and statistics",
              "- Key arguments or positions",
              "- Relevant context and background",
              "- Critical analysis of the content",
              `The document filename is: ${data.file.originalName}`
            ].join("\n");
            
            // If there's existing text, append to it
            if (prev.trim()) {
              return `${prev}\n\n${basePrompt}\n${details}`;
            } else {
              return `${basePrompt}\n${details}`;
            }
          });
        }
        
        // Focus the input so the user can edit the prompt before sending
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadError("Failed to upload file. Please try again.");
    } finally {
      setUploadingFiles(false);
    }
  };
  
  const openDocumentUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const openImageUpload = () => {
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
  };
  
  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    handleFileUpload(files[0]);
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    handleFileUpload(files[0]);
    
    // Reset the input
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  return (
    <div className="relative w-full">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.txt"
        onChange={handleDocumentChange}
      />
      
      <input
        ref={imageInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleImageChange}
      />
      
      <div className="relative border border-zinc-800 rounded-[14px] bg-[#2A2A2D] overflow-hidden">
        <div className="flex items-start">
          <div className="flex-grow flex items-start pt-3">
            <div className="px-3 text-zinc-500">
              <SearchIcon className="h-5 w-5" />
            </div>
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full py-2 px-1 bg-transparent border-none outline-none text-white resize-none min-h-[48px] max-h-[120px]" 
              placeholder=""
              rows={1}
              style={{
                overflow: 'auto',
                height: 'auto'
              }}
            />
          </div>
          
          <div className="flex items-center pr-3 mt-3">
            <div className="flex space-x-1 mr-2">
              <button 
                onClick={openDocumentUpload}
                disabled={uploadingFiles || isLoading}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white transition-colors"
                title="Upload document"
              >
                <FileText className="h-5 w-5" />
              </button>
              
              <button 
                onClick={openImageUpload}
                disabled={uploadingFiles || isLoading}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white transition-colors"
                title="Upload image"
              >
                <ImageIcon className="h-5 w-5" />
              </button>
            </div>
            
            <button
              onClick={handleSubmit}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={!message.trim() || isLoading || uploadingFiles}
            >
              {isLoading || uploadingFiles ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        
        {/* Uploaded files display */}
        {uploadedFiles.length > 0 && (
          <div className="px-4 py-2 border-t border-zinc-800 bg-zinc-900">
            <div className="text-xs text-zinc-400 mb-1">Attached files:</div>
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map(file => (
                <div key={file.id} className="flex items-center space-x-1 px-2 py-1 bg-zinc-800 rounded text-xs">
                  <FileText className="h-3 w-3 text-zinc-300" />
                  <span className="max-w-[150px] truncate text-white">{file.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {uploadError && (
        <div className="mt-2 text-xs text-red-500 flex items-center justify-center">
          <AlertCircle className="h-3 w-3 mr-1" />
          <span>{uploadError}</span>
        </div>
      )}
      
      <div className="mt-2 text-xs text-center text-zinc-500">
        <span className="mr-1">Press Enter to send</span>
      </div>
    </div>
  );
}
