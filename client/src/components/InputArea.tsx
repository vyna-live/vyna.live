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
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

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
      
      if (inputRef.current) {
        inputRef.current.focus();
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
        
        // Update message to mention the file
        if (data.file.fileType.startsWith("image/")) {
          setMessage(prev => 
            prev + (prev.endsWith(" ") || prev === "" ? "" : " ") + 
            `Analyze this image: ${data.file.originalName}`
          );
        } else {
          setMessage(prev => 
            prev + (prev.endsWith(" ") || prev === "" ? "" : " ") + 
            `Extract key information from this document: ${data.file.originalName}`
          );
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
      
      <div className="relative border border-[hsl(var(--ai-border))] rounded-xl bg-[hsl(var(--ai-card))] overflow-hidden">
        <div className="flex items-center">
          <div className="flex-grow flex items-center">
            <div className="px-3 text-[hsl(var(--ai-text-secondary))]">
              <SearchIcon className="h-5 w-5" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="w-full py-3 px-1 bg-transparent border-none outline-none text-[hsl(var(--ai-text-primary))]" 
              placeholder="Ask about your stream or research..."
            />
          </div>
          
          <div className="flex items-center pr-3">
            <div className="flex space-x-1 mr-2">
              <button 
                onClick={openDocumentUpload}
                disabled={uploadingFiles || isLoading}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-r from-[#5D1C34] to-[#A67D44] text-[#EFE9E1] transition-all disabled:opacity-50 hover:shadow-md"
                title="Upload document"
              >
                <FileText className="h-5 w-5" />
              </button>
              
              <button 
                onClick={openImageUpload}
                disabled={uploadingFiles || isLoading}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-r from-[#A67D44] to-[#899481] text-[#EFE9E1] transition-all disabled:opacity-50 hover:shadow-md"
                title="Upload image"
              >
                <ImageIcon className="h-5 w-5" />
              </button>
            </div>
            
            <button
              onClick={handleSubmit}
              className="w-9 h-9 flex items-center justify-center bg-gradient-to-r from-[#899481] to-[#5D1C34] rounded-lg text-[#EFE9E1] disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition-all"
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
          <div className="px-4 py-2 border-t border-[hsl(var(--ai-border))] bg-[hsl(var(--ai-background))]">
            <div className="text-xs text-[hsl(var(--ai-text-secondary))] mb-1">Attached files:</div>
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map(file => (
                <div key={file.id} className="flex items-center space-x-1 px-2 py-1 bg-[hsl(var(--ai-card-glass))] rounded text-xs">
                  <FileText className="h-3 w-3 text-[hsl(var(--ai-teal))]" />
                  <span className="max-w-[150px] truncate">{file.name}</span>
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
      
      <div className="mt-2 text-xs text-center text-[hsl(var(--ai-text-secondary))]">
        <span className="mr-1">Research</span>
        <span className="px-1.5 py-0.5 rounded border border-[hsl(var(--ai-border))] bg-[hsl(var(--ai-card))]">Tab</span>
      </div>
    </div>
  );
}
