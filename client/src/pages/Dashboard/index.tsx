import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import Logo from '@/components/Logo';
import { ChevronRight, LogIn, LogOut, Settings, User, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import CreateStreamDialog, { StreamFormData } from '@/components/CreateStreamDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Dashboard() {
  const [isStreamDialogOpen, setIsStreamDialogOpen] = useState(false);
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  
  // Alternating between the two image types
  const getImageForIndex = (index: number) => {
    if (index % 2 === 0) {
      return "/images/re.jpg";
    } else {
      return "/images/view.jpg";
    }
  };

  // Content description based on image type
  const getContentType = (index: number) => {
    if (index % 2 === 0) {
      return { label: "FAMILY", title: "Family Fun Activities & Games" };
    } else {
      return { label: "GAMING", title: "RGB Setup & PS5 Controller Review" };
    }
  };

  // Custom CSS for exactly 16px spacing between cards
  const containerStyle = {
    width: '100%',
    maxWidth: '821px', // Width for 3 cards of 263px each + 16px gaps
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,

  };

  const cardsContainerStyle = {
    display: 'flex' as const,
    flexWrap: 'wrap' as const,
    gap: '16px',
    width: '100%',
    justifyContent: 'center' as const,
  };

  const headerStyle = {
    display: 'flex' as const,
    justifyContent: 'space-between' as const, 
    alignItems: 'center' as const,
    width: '100%',
    marginBottom: '20px'
  };

  // Define a function to handle start streaming click
  const handleStartStreamingClick = () => {
    if (!isAuthenticated) {
      // Redirect to auth page with referrer as current page
      navigate('/auth?referrer=/');
    } else {
      // Open stream dialog if authenticated
      setIsStreamDialogOpen(true);
    }
  };
  
  // Define a function to handle submit form data
  const handleStreamFormSubmit = async (formData: StreamFormData) => {
    try {
      console.log('Stream form submitted:', formData);
      setIsStreamDialogOpen(false);
      
      // Generate channel name from title by replacing spaces with underscores
      const channelName = formData.title.trim().replace(/\s+/g, '_');
      
      // Update stream session with form data
      const response = await fetch('/api/user/stream-session/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          streamTitle: formData.title,
          description: formData.description,
          channelName: channelName, // Set the channel name based on title
          destination: formData.destination,
          coverImage: formData.coverImagePath || '', // Use the path returned from the upload endpoint
          privacy: formData.privacy,
          scheduled: !!formData.scheduledDate,
          streamDate: formData.scheduledDate,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update stream settings');
      }
      
      // Navigate to the livestream page without query parameters
      // The LivestreamInterface will get the data from the database
      navigate('/livestream');
    } catch (error) {
      console.error('Error updating stream session:', error);
      // Could add toast notification here
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col">
      {/* Stream Dialog */}
      <CreateStreamDialog 
        isOpen={isStreamDialogOpen} 
        onClose={() => setIsStreamDialogOpen(false)}
        onSubmit={handleStreamFormSubmit}
      />
      
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between">
        <Link href="/" className="transition-opacity hover:opacity-80">
          <Logo variant="light" size="sm" className="h-6" />
        </Link>
        
        <div className="flex items-center">
          {isLoading ? (
            <div className="w-6 h-6 rounded-full animate-pulse bg-zinc-700"></div>
          ) : isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center space-x-2 bg-zinc-900/50 backdrop-blur-sm px-2 py-1 rounded-sm cursor-pointer hover:bg-zinc-800/60 transition-colors">
                  <div className="w-[24px] h-[24px] rounded-full overflow-hidden">
                    <img 
                      src={user.avatarUrl || "https://randomuser.me/api/portraits/men/32.jpg"} 
                      alt={user.displayName || user.username} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-white text-sm font-medium">{user.displayName || user.username}</span>
                  <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800 text-white shadow-lg">
                <DropdownMenuLabel className="text-zinc-400 border-b border-zinc-800 pb-2">
                  My Account
                </DropdownMenuLabel>
                <DropdownMenuItem className="text-white hover:bg-zinc-800 cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="text-white hover:bg-zinc-800 cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem 
                  className="text-red-500 hover:bg-zinc-800 hover:text-red-500 cursor-pointer"
                  onClick={() => {
                    logout();
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Button asChild variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                <Link href="/auth?referrer=/">
                  <LogIn className="w-4 h-4 mr-1" />
                  Sign In
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="text-white border-zinc-700 hover:bg-zinc-800">
                <Link href="/auth?referrer=/">
                  <UserPlus className="w-4 h-4 mr-1" />
                  Sign Up
                </Link>
              </Button>
            </div>
          )}
        </div>
      </header>
      
      {/* Sidebar toggle */}
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-10">
        <button className="bg-zinc-900/80 backdrop-blur-sm p-1.5 text-zinc-400 hover:text-white rounded-sm">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 5l7 7-7 7M5 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      
      {/* Main content */}
      <main className="flex-1 max-w-[1024px] mx-auto w-full">
        {/* Hero section */}
        <section className="mb-16 text-center mt-12">
          <h1 className="text-[48px] font-bold mb-4 tracking-tight bg-gradient-to-r from-[#5D1C34] via-[#A67D44] to-[#CDBCAB] text-transparent bg-clip-text">Research first, go live next!</h1>
          <p className="text-zinc-400 text-base max-w-2xl mx-auto mb-10">
            Start your own live stream with AI-powered research tools or join 
            other creators' streams to learn and engage.
          </p>
          
          <div className="flex items-center justify-center space-x-4">
            <button 
              onClick={handleStartStreamingClick}
              className="flex items-center space-x-2 px-6 py-3 bg-[#D8C6AF] text-black font-medium hover:opacity-90 transition-opacity rounded-sm"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 7l-7 5 7 5V7z" />
                <rect x="1" y="5" width="15" height="14" />
              </svg>
              <span>Start streaming</span>
            </button>
            
            <Link href="/join-stream" className="flex items-center space-x-2 px-6 py-3 bg-[#2B2B2B] text-white font-medium hover:opacity-90 transition-opacity rounded-sm">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="6" width="20" height="12" />
                <line x1="6" y1="10" x2="6" y2="10" />
                <line x1="10" y1="10" x2="10" y2="10" />
                <line x1="14" y1="10" x2="14" y2="10" />
                <line x1="18" y1="10" x2="18" y2="10" />
                <line x1="6" y1="14" x2="6" y2="14" />
                <line x1="10" y1="14" x2="14" y2="14" strokeWidth="4" />
                <line x1="18" y1="14" x2="18" y2="14" />
              </svg>
              <span>Join stream</span>
            </Link>
          </div>
        </section>
        
        {/* Upcoming streams section */}
        <section className="mb-16">
          <div style={containerStyle}>
            <div style={headerStyle}>
              <h2 className="text-lg font-semibold text-white">Upcoming</h2>
              <Link href="/streams/upcoming" className="flex items-center text-zinc-400 hover:text-white transition-colors">
                <span className="text-sm">See all</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            
            <div style={cardsContainerStyle}>
              {[1, 2, 3].map((item, index) => {
                const content = getContentType(index);
                const channelName = `channel-${index + 1}`;
                return (
                  <Link 
                    key={item} 
                    href={`/stream/${channelName}`}
                    className="overflow-hidden w-[263px] h-[219px] rounded-sm relative block transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg"
                  >
                    <img 
                      src={getImageForIndex(index)}
                      alt={content.title} 
                      className="w-full h-full object-cover"
                    />
                    <div className="bg-black/30 backdrop-blur-sm absolute bottom-0 left-0 right-0 p-4">
                      <div className="text-xs uppercase text-zinc-300 mb-1">
                        {content.label}
                      </div>
                      <h3 className="text-white text-sm font-medium">
                        {content.title}
                      </h3>
                      <div className="flex items-center mt-2">
                        <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse mr-2"></div>
                        <span className="text-white text-xs">Live now</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
        
        {/* Saved streams section */}
        <section>
          <div style={containerStyle}>
            <div style={headerStyle}>
              <h2 className="text-lg font-semibold text-white">Saved</h2>
              <Link href="/streams/saved" className="flex items-center text-zinc-400 hover:text-white transition-colors">
                <span className="text-sm">See all</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            
            <div style={cardsContainerStyle}>
              {[1, 2, 3].map((item, index) => {
                // Reverse the image pattern for the saved section
                const content = getContentType(index + 1);
                const channelName = `saved-${index + 1}`;
                return (
                  <Link 
                    key={item} 
                    href={`/stream/${channelName}`}
                    className="overflow-hidden w-[263px] h-[219px] rounded-sm relative block transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg"
                  >
                    <img 
                      src={getImageForIndex(index + 1)}
                      alt={content.title} 
                      className="w-full h-full object-cover"
                    />
                    <div className="bg-black/30 backdrop-blur-sm absolute bottom-0 left-0 right-0 p-4">
                      <div className="text-xs uppercase text-zinc-300 mb-1">
                        {content.label}
                      </div>
                      <h3 className="text-white text-sm font-medium">
                        {content.title}
                      </h3>
                      <div className="flex items-center mt-2">
                        <span className="text-white text-xs">Recorded • 2 days ago</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}