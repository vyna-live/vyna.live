import React, { useState } from 'react';
import { X, Upload, Calendar } from 'lucide-react';
import { Youtube } from 'react-feather';

interface CreateStreamDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: StreamFormData) => void;
}

export interface StreamFormData {
  title: string;
  description: string;
  destination: string[];
  coverImage?: File;
  privacy: 'public' | 'unlisted' | 'private';
  scheduledDate?: Date;
}

export default function CreateStreamDialog({ isOpen, onClose, onSubmit }: CreateStreamDialogProps) {
  const [formData, setFormData] = useState<StreamFormData>({
    title: '',
    description: '',
    destination: ['youtube'],
    privacy: 'unlisted',
    scheduledDate: undefined,
  });
  
  const [scheduleForLater, setScheduleForLater] = useState(false);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  if (!isOpen) return null;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handlePrivacyChange = (privacy: 'public' | 'unlisted' | 'private') => {
    setFormData(prev => ({ ...prev, privacy }));
  };
  
  const handleScheduleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScheduleForLater(e.target.checked);
    if (!e.target.checked) {
      setFormData(prev => ({ ...prev, scheduledDate: undefined }));
    }
  };
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setFormData(prev => ({ ...prev, scheduledDate: new Date(e.target.value) }));
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, coverImage: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.includes('image/png') || file.type.includes('image/jpeg') || file.type.includes('image/gif'))) {
      setFormData(prev => ({ ...prev, coverImage: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };
  
  // Add click outside handler to close the modal
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('modal-overlay')) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 modal-overlay">
      <div 
        className="bg-[#1C1C1C] w-full max-w-md rounded-lg shadow-lg overflow-hidden"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white text-xl font-medium flex items-center">
              <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 7l-7 5 7 5V7z" />
                <rect x="1" y="5" width="15" height="14" />
              </svg>
              Create live stream
            </h2>
            <button 
              onClick={onClose}
              className="text-zinc-400 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-white mb-1 text-sm">
                Stream title <span className="text-red-500">*</span>
              </label>
              <input 
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter a title for your stream"
                className="w-full p-3 bg-[#141414] text-white rounded border border-zinc-800 focus:border-zinc-600 focus:outline-none"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-white mb-1 text-sm">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Tell viewer about your stream"
                className="w-full p-3 bg-[#141414] text-white rounded border border-zinc-800 focus:border-zinc-600 focus:outline-none resize-none h-24"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-white mb-1 text-sm">
                Streaming destination
              </label>
              <div className="flex items-center p-3 bg-[#212121] rounded">
                <div className="flex items-center">
                  <span className="bg-red-600 p-1 rounded-sm mr-2">
                    <Youtube size={16} />
                  </span>
                  <span className="text-white">Youtube</span>
                </div>
                <input 
                  type="checkbox"
                  checked={formData.destination.includes('youtube')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData(prev => ({ ...prev, destination: [...prev.destination, 'youtube'] }));
                    } else {
                      setFormData(prev => ({ ...prev, destination: prev.destination.filter(d => d !== 'youtube') }));
                    }
                  }}
                  className="ml-auto h-5 w-5 rounded border-zinc-500 text-zinc-200 focus:ring-0"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-white mb-1 text-sm">
                Cover
              </label>
              <div 
                className="bg-[#303030] border-2 border-dashed border-zinc-600 rounded-md h-[150px] flex flex-col items-center justify-center cursor-pointer text-center p-4"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => document.getElementById('cover-upload')?.click()}
              >
                {coverImagePreview ? (
                  <div className="relative w-full h-full">
                    <img 
                      src={coverImagePreview} 
                      alt="Cover preview" 
                      className="w-full h-full object-cover rounded-md"
                    />
                    <div className="absolute top-2 right-2 bg-black/70 rounded-full p-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCoverImagePreview(null);
                          setFormData(prev => ({ ...prev, coverImage: undefined }));
                        }}
                        className="text-white hover:text-red-500"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload size={24} className="text-zinc-400 mb-2" />
                    <span className="text-zinc-300 underline">Upload a file</span>
                    <span className="text-zinc-400 text-sm mt-1">or drag and drop</span>
                    <span className="text-zinc-500 text-xs mt-1">PNG, JPG, GIF up to 2MB</span>
                  </>
                )}
                <input
                  type="file"
                  id="cover-upload"
                  onChange={handleFileChange}
                  accept="image/png,image/jpeg,image/gif"
                  className="hidden"
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-white mb-2 text-sm">
                Privacy
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="privacy"
                    checked={formData.privacy === 'public'}
                    onChange={() => handlePrivacyChange('public')}
                    className="mr-2 h-4 w-4"
                  />
                  <span className="text-white text-sm">Private (Anyone can join)</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="privacy"
                    checked={formData.privacy === 'unlisted'}
                    onChange={() => handlePrivacyChange('unlisted')}
                    className="mr-2 h-4 w-4"
                  />
                  <span className="text-white text-sm">Unlisted (Anyone with link can join)</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="privacy"
                    checked={formData.privacy === 'private'}
                    onChange={() => handlePrivacyChange('private')}
                    className="mr-2 h-4 w-4"
                  />
                  <span className="text-white text-sm">Private (Only you)</span>
                </label>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={scheduleForLater}
                  onChange={handleScheduleToggle}
                  className="mr-2 h-4 w-4"
                />
                <span className="text-white text-sm">Schedule for later</span>
              </label>
              
              {scheduleForLater && (
                <div className="mt-2 relative">
                  <div className="flex items-center w-full">
                    <Calendar size={18} className="mr-2 absolute left-3 text-zinc-400" />
                    <input
                      type="datetime-local"
                      min={new Date().toISOString().slice(0, 16)}
                      onChange={handleDateChange}
                      className="w-full p-2.5 pl-10 bg-[#242424] text-zinc-300 border border-zinc-700 rounded focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <button
              type="submit"
              className="w-full py-3 bg-[#D8C6AF] text-black font-medium rounded hover:bg-opacity-90 transition-opacity"
            >
              Join stream
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}