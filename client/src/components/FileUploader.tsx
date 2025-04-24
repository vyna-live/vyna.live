import { useState, useRef } from 'react';
import { Upload, X, FileText, Image, AlertCircle, Loader2 } from 'lucide-react';

interface FileUploaderProps {
  onUpload: (file: File) => Promise<void>;
  acceptedTypes?: string;
  maxSizeMB?: number;
  variant?: 'button' | 'dropzone';
  icon?: React.ReactNode;
  label?: string;
  className?: string;
}

export default function FileUploader({
  onUpload,
  acceptedTypes = '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png',
  maxSizeMB = 10,
  variant = 'button',
  icon = <Upload className="h-4 w-4" />,
  label = 'Upload',
  className = '',
}: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    await processFile(file);
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await processFile(file);
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  
  const processFile = async (file: File) => {
    // Validate file type
    const fileType = file.type;
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    const isAcceptedType = acceptedTypes
      .split(',')
      .some(type => {
        const cleanType = type.trim();
        return cleanType.startsWith('.') 
          ? `.${fileExtension}` === cleanType
          : fileType.includes(cleanType.replace('*', ''));
      });
    
    if (!isAcceptedType) {
      setError(`Invalid file type. Accepted types: ${acceptedTypes}`);
      return;
    }
    
    // Validate file size
    if (file.size > maxSizeBytes) {
      setError(`File size exceeds the maximum of ${maxSizeMB}MB`);
      return;
    }
    
    setError(null);
    
    try {
      setIsUploading(true);
      await onUpload(file);
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };
  
  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const getFileTypeIcon = () => {
    if (acceptedTypes.includes('image')) {
      return <Image className="h-5 w-5 text-[hsl(var(--ai-teal))]" />;
    }
    return <FileText className="h-5 w-5 text-[hsl(var(--ai-teal))]" />;
  };
  
  // Button variant
  if (variant === 'button') {
    return (
      <div className={className}>
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes}
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={openFileDialog}
          disabled={isUploading}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-[hsl(180,85%,15%)] text-[hsl(var(--ai-text-secondary))] hover:text-[hsl(var(--ai-teal))] transition-colors"
          title={`Upload ${acceptedTypes.includes('image') ? 'image' : 'document'}`}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            getFileTypeIcon()
          )}
        </button>
        
        {error && (
          <div className="mt-2 text-xs text-red-500 flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }
  
  // Dropzone variant
  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        onChange={handleFileChange}
        className="hidden"
      />
      
      <div
        onClick={openFileDialog}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
          ${dragActive 
            ? 'border-[hsl(var(--ai-accent))] bg-[hsl(var(--ai-accent))]/10' 
            : 'border-[hsl(var(--ai-border))] hover:border-[hsl(var(--ai-accent))]'
          }
        `}
      >
        <div className="flex flex-col items-center">
          {isUploading ? (
            <Loader2 className="h-10 w-10 text-[hsl(var(--ai-accent))] animate-spin mb-3" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-[hsl(180,85%,15%)] flex items-center justify-center mb-3">
              {getFileTypeIcon()}
            </div>
          )}
          
          <p className="text-sm text-[hsl(var(--ai-text-secondary))]">
            {isUploading 
              ? 'Uploading...' 
              : dragActive 
                ? 'Drop file here' 
                : `Drag and drop or click to upload ${acceptedTypes.includes('image') ? 'an image' : 'a document'}`
            }
          </p>
          <p className="text-xs text-[hsl(var(--ai-text-secondary))] mt-1">
            Max size: {maxSizeMB}MB
          </p>
        </div>
      </div>
      
      {error && (
        <div className="mt-2 text-sm text-red-500 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}