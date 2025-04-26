import React, { useState } from 'react';
import { X, Upload, Calendar } from 'lucide-react';
import { Youtube } from 'react-feather';
import { useToast } from '@/hooks/use-toast';

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
  // Egress settings for multiplatform streaming
  egressSettings?: {
    enabled: boolean;
    platforms: {
      youtube?: {
        enabled: boolean;
        streamKey?: string;
        streamUrl?: string;
      };
      twitch?: {
        enabled: boolean;
        streamKey?: string;
        streamUrl?: string;
      };
      facebook?: {
        enabled: boolean;
        streamKey?: string;
        streamUrl?: string;
      };
      custom?: {
        enabled: boolean;
        streamKey?: string;
        streamUrl?: string;
        name?: string;
      };
    };
  };
}

export default function CreateStreamDialog({ isOpen, onClose, onSubmit }: CreateStreamDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<StreamFormData>({
    title: '',
    description: '',
    destination: ['youtube'],
    privacy: 'unlisted',
    scheduledDate: undefined,
    egressSettings: {
      enabled: false,
      platforms: {
        youtube: {
          enabled: false,
          streamKey: '',
          streamUrl: 'rtmp://a.rtmp.youtube.com/live2'
        },
        twitch: {
          enabled: false,
          streamKey: '',
          streamUrl: 'rtmp://live.twitch.tv/app'
        },
        facebook: {
          enabled: false,
          streamKey: '',
          streamUrl: 'rtmps://live-api-s.facebook.com:443/rtmp'
        },
        custom: {
          enabled: false,
          streamKey: '',
          streamUrl: '',
          name: 'Custom RTMP'
        }
      }
    }
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
  
  const validateStreamKeys = () => {
    // Only validate if egress is enabled
    if (!formData.egressSettings?.enabled) {
      return true;
    }
    
    // Check if any platform is enabled but missing stream key
    const { platforms } = formData.egressSettings;
    
    if (platforms.youtube?.enabled && (!platforms.youtube.streamKey || platforms.youtube.streamKey.trim() === '')) {
      toast({
        title: "Missing YouTube Stream Key",
        description: "Please enter your YouTube stream key to stream to that platform.",
        variant: "destructive",
      });
      return false;
    }
    
    if (platforms.twitch?.enabled && (!platforms.twitch.streamKey || platforms.twitch.streamKey.trim() === '')) {
      toast({
        title: "Missing Twitch Stream Key",
        description: "Please enter your Twitch stream key to stream to that platform.",
        variant: "destructive",
      });
      return false;
    }
    
    if (platforms.custom?.enabled) {
      if (!platforms.custom.streamKey || platforms.custom.streamKey.trim() === '') {
        toast({
          title: "Missing Custom Stream Key",
          description: "Please enter the stream key for your custom RTMP destination.",
          variant: "destructive",
        });
        return false;
      }
      
      if (!platforms.custom.streamUrl || platforms.custom.streamUrl.trim() === '') {
        toast({
          title: "Missing RTMP URL",
          description: "Please enter the RTMP URL for your custom streaming destination.",
          variant: "destructive",
        });
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.title.trim()) {
      toast({
        title: "Missing Title",
        description: "Please enter a title for your stream.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate stream keys if multiplatform streaming is enabled
    if (!validateStreamKeys()) {
      return;
    }
    
    onSubmit(formData);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={() => onClose()}
    >
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
            
            {/* Multiplatform Streaming Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-white text-sm font-medium">
                  Multiplatform Streaming
                </label>
                <div className="relative inline-block w-10 align-middle select-none">
                  <input
                    type="checkbox"
                    id="multiplatform-toggle"
                    checked={formData.egressSettings?.enabled}
                    onChange={(e) => {
                      const isEnabled = e.target.checked;
                      setFormData(prev => ({
                        ...prev,
                        egressSettings: {
                          ...prev.egressSettings!,
                          enabled: isEnabled
                        }
                      }));
                    }}
                    className="sr-only"
                  />
                  <label
                    htmlFor="multiplatform-toggle"
                    className={`block h-6 overflow-hidden rounded-full cursor-pointer ${
                      formData.egressSettings?.enabled ? 'bg-[#A67D44]' : 'bg-zinc-600'
                    }`}
                  >
                    <span
                      className={`block h-6 w-6 rounded-full bg-white transform transition-transform ${
                        formData.egressSettings?.enabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    ></span>
                  </label>
                </div>
              </div>
              
              {formData.egressSettings?.enabled && (
                <div className="space-y-3 mt-3 bg-[#242424] p-3 rounded-md">
                  <p className="text-zinc-300 text-xs mb-2">
                    Stream simultaneously to multiple platforms by connecting your accounts
                  </p>
                  
                  {/* YouTube */}
                  <div className="border-b border-zinc-700 pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className="bg-red-600 p-1 rounded-sm mr-2">
                          <Youtube size={16} className="text-white" />
                        </span>
                        <span className="text-white text-sm">YouTube</span>
                      </div>
                      <div className="relative inline-block w-10 align-middle select-none">
                        <input
                          type="checkbox"
                          id="youtube-toggle"
                          checked={formData.egressSettings?.platforms.youtube?.enabled}
                          onChange={(e) => {
                            const isEnabled = e.target.checked;
                            setFormData(prev => ({
                              ...prev,
                              egressSettings: {
                                ...prev.egressSettings!,
                                platforms: {
                                  ...prev.egressSettings!.platforms,
                                  youtube: {
                                    ...prev.egressSettings!.platforms.youtube!,
                                    enabled: isEnabled
                                  }
                                }
                              }
                            }));
                          }}
                          className="sr-only"
                        />
                        <label
                          htmlFor="youtube-toggle"
                          className={`block h-6 overflow-hidden rounded-full cursor-pointer ${
                            formData.egressSettings?.platforms.youtube?.enabled ? 'bg-[#A67D44]' : 'bg-zinc-600'
                          }`}
                        >
                          <span
                            className={`block h-6 w-6 rounded-full bg-white transform transition-transform ${
                              formData.egressSettings?.platforms.youtube?.enabled ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          ></span>
                        </label>
                      </div>
                    </div>
                    
                    {formData.egressSettings?.platforms.youtube?.enabled && (
                      <div className="mt-2">
                        <label className="block text-white mb-1 text-xs">
                          YouTube Stream Key
                        </label>
                        <input 
                          type="password"
                          value={formData.egressSettings?.platforms.youtube?.streamKey || ''}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              egressSettings: {
                                ...prev.egressSettings!,
                                platforms: {
                                  ...prev.egressSettings!.platforms,
                                  youtube: {
                                    ...prev.egressSettings!.platforms.youtube!,
                                    streamKey: e.target.value
                                  }
                                }
                              }
                            }));
                          }}
                          placeholder="Enter your YouTube stream key"
                          className="w-full p-2 bg-[#141414] text-white rounded border border-zinc-800 focus:border-zinc-600 focus:outline-none text-sm"
                        />
                        <div className="text-gray-400 text-xs mt-1">
                          Get your stream key from YouTube Studio
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Twitch */}
                  <div className="border-b border-zinc-700 pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className="bg-purple-600 p-1 rounded-sm mr-2">
                          <svg className="w-4 h-4 text-white" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 5V18.6L8.8 23.4H14.8L18.4 19.8H23.6L19.7 6.58V0H7.6V5H4Z" fill="currentColor"/>
                            <path d="M15 8H17V14H15V8Z" fill="white"/>
                            <path d="M10 8H12V14H10V8Z" fill="white"/>
                          </svg>
                        </span>
                        <span className="text-white text-sm">Twitch</span>
                      </div>
                      <div className="relative inline-block w-10 align-middle select-none">
                        <input
                          type="checkbox"
                          id="twitch-toggle"
                          checked={formData.egressSettings?.platforms.twitch?.enabled}
                          onChange={(e) => {
                            const isEnabled = e.target.checked;
                            setFormData(prev => ({
                              ...prev,
                              egressSettings: {
                                ...prev.egressSettings!,
                                platforms: {
                                  ...prev.egressSettings!.platforms,
                                  twitch: {
                                    ...prev.egressSettings!.platforms.twitch!,
                                    enabled: isEnabled
                                  }
                                }
                              }
                            }));
                          }}
                          className="sr-only"
                        />
                        <label
                          htmlFor="twitch-toggle"
                          className={`block h-6 overflow-hidden rounded-full cursor-pointer ${
                            formData.egressSettings?.platforms.twitch?.enabled ? 'bg-[#A67D44]' : 'bg-zinc-600'
                          }`}
                        >
                          <span
                            className={`block h-6 w-6 rounded-full bg-white transform transition-transform ${
                              formData.egressSettings?.platforms.twitch?.enabled ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          ></span>
                        </label>
                      </div>
                    </div>
                    
                    {formData.egressSettings?.platforms.twitch?.enabled && (
                      <div className="mt-2">
                        <label className="block text-white mb-1 text-xs">
                          Twitch Stream Key
                        </label>
                        <input 
                          type="password"
                          value={formData.egressSettings?.platforms.twitch?.streamKey || ''}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              egressSettings: {
                                ...prev.egressSettings!,
                                platforms: {
                                  ...prev.egressSettings!.platforms,
                                  twitch: {
                                    ...prev.egressSettings!.platforms.twitch!,
                                    streamKey: e.target.value
                                  }
                                }
                              }
                            }));
                          }}
                          placeholder="Enter your Twitch stream key"
                          className="w-full p-2 bg-[#141414] text-white rounded border border-zinc-800 focus:border-zinc-600 focus:outline-none text-sm"
                        />
                        <div className="text-gray-400 text-xs mt-1">
                          Get your stream key from Twitch Dashboard
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Custom RTMP */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className="bg-gray-600 p-1 rounded-sm mr-2">
                          <svg className="w-4 h-4 text-white" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                        </span>
                        <span className="text-white text-sm">Custom RTMP</span>
                      </div>
                      <div className="relative inline-block w-10 align-middle select-none">
                        <input
                          type="checkbox"
                          id="custom-toggle"
                          checked={formData.egressSettings?.platforms.custom?.enabled}
                          onChange={(e) => {
                            const isEnabled = e.target.checked;
                            setFormData(prev => ({
                              ...prev,
                              egressSettings: {
                                ...prev.egressSettings!,
                                platforms: {
                                  ...prev.egressSettings!.platforms,
                                  custom: {
                                    ...prev.egressSettings!.platforms.custom!,
                                    enabled: isEnabled
                                  }
                                }
                              }
                            }));
                          }}
                          className="sr-only"
                        />
                        <label
                          htmlFor="custom-toggle"
                          className={`block h-6 overflow-hidden rounded-full cursor-pointer ${
                            formData.egressSettings?.platforms.custom?.enabled ? 'bg-[#A67D44]' : 'bg-zinc-600'
                          }`}
                        >
                          <span
                            className={`block h-6 w-6 rounded-full bg-white transform transition-transform ${
                              formData.egressSettings?.platforms.custom?.enabled ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          ></span>
                        </label>
                      </div>
                    </div>
                    
                    {formData.egressSettings?.platforms.custom?.enabled && (
                      <div className="mt-2 space-y-2">
                        <div>
                          <label className="block text-white mb-1 text-xs">
                            RTMP URL
                          </label>
                          <input 
                            type="text"
                            value={formData.egressSettings?.platforms.custom?.streamUrl || ''}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                egressSettings: {
                                  ...prev.egressSettings!,
                                  platforms: {
                                    ...prev.egressSettings!.platforms,
                                    custom: {
                                      ...prev.egressSettings!.platforms.custom!,
                                      streamUrl: e.target.value
                                    }
                                  }
                                }
                              }));
                            }}
                            placeholder="rtmp://your-rtmp-server.com/live"
                            className="w-full p-2 bg-[#141414] text-white rounded border border-zinc-800 focus:border-zinc-600 focus:outline-none text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-white mb-1 text-xs">
                            Stream Key
                          </label>
                          <input 
                            type="password"
                            value={formData.egressSettings?.platforms.custom?.streamKey || ''}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                egressSettings: {
                                  ...prev.egressSettings!,
                                  platforms: {
                                    ...prev.egressSettings!.platforms,
                                    custom: {
                                      ...prev.egressSettings!.platforms.custom!,
                                      streamKey: e.target.value
                                    }
                                  }
                                }
                              }));
                            }}
                            placeholder="Enter your stream key"
                            className="w-full p-2 bg-[#141414] text-white rounded border border-zinc-800 focus:border-zinc-600 focus:outline-none text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-white mb-1 text-xs">
                            Platform Name (Optional)
                          </label>
                          <input 
                            type="text"
                            value={formData.egressSettings?.platforms.custom?.name || ''}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                egressSettings: {
                                  ...prev.egressSettings!,
                                  platforms: {
                                    ...prev.egressSettings!.platforms,
                                    custom: {
                                      ...prev.egressSettings!.platforms.custom!,
                                      name: e.target.value
                                    }
                                  }
                                }
                              }));
                            }}
                            placeholder="e.g. Facebook, TikTok, etc."
                            className="w-full p-2 bg-[#141414] text-white rounded border border-zinc-800 focus:border-zinc-600 focus:outline-none text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="mb-6">
              <div className="flex items-center">
                <input 
                  type="checkbox"
                  id="schedule-later"
                  checked={scheduleForLater}
                  onChange={handleScheduleToggle}
                  className="mr-2 h-4 w-4 rounded border-zinc-500 text-zinc-200 focus:ring-0"
                />
                <label htmlFor="schedule-later" className="text-white text-sm">
                  Schedule for later
                </label>
              </div>
              
              {scheduleForLater && (
                <div className="mt-3">
                  <div className="flex items-center bg-[#141414] p-2 rounded border border-zinc-800">
                    <Calendar size={16} className="text-zinc-400 mr-2" />
                    <input 
                      type="datetime-local"
                      onChange={handleDateChange}
                      className="bg-transparent text-white focus:outline-none w-full"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-zinc-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#A67D44] hover:bg-[#8C6A3A] text-white rounded focus:outline-none"
              >
                Join Stream
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}