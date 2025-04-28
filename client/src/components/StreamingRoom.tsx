import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Copy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import AgoraVideo from './AgoraVideo';
import ChatInterface from './ChatInterface';
import InputArea from './InputArea';
import GradientText from './GradientText';
import { MessageType } from '../types/chat';

interface StreamingRoomProps {
  channelName: string;
  title?: string;
  description?: string;
  rtmpDestinations?: string[];
  initialText?: string;
  onEnd?: () => void;
}

export default function StreamingRoom({
  channelName,
  title,
  description,
  rtmpDestinations = [],
  initialText = '',
  onEnd
}: StreamingRoomProps) {
  // State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerContent, setDrawerContent] = useState<'chat' | 'teleprompter'>('chat');
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [teleprompterText, setTeleprompterText] = useState(initialText);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Message handlers
  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    // Add user message to chat
    const userMessage: MessageType = {
      id: Date.now().toString(),
      content: message,
      role: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Show loading state
    setIsLoading(true);
    
    try {
      // Send to AI and get response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }
      
      const data = await response.json();
      
      // Add AI response to chat
      const aiMessage: MessageType = {
        id: Date.now().toString(),
        content: data.message,
        role: 'assistant',
        timestamp: new Date(),
        hasInfoGraphic: !!data.infoGraphic,
        infoGraphicData: data.infoGraphic
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast({
        title: 'Error',
        description: 'Failed to get AI response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Teleprompter handlers
  const handleTeleprompterClick = (text: string) => {
    setTeleprompterText(text);
    setDrawerContent('teleprompter');
    
    toast({
      title: 'Added to teleprompter',
      description: 'The text has been added to your teleprompter',
    });
  };
  
  const handleCopyTeleprompter = () => {
    navigator.clipboard.writeText(teleprompterText);
    
    toast({
      title: 'Copied to clipboard',
      description: 'Teleprompter text has been copied to clipboard',
    });
  };
  
  const handleClearTeleprompter = () => {
    setTeleprompterText('');
    
    toast({
      title: 'Teleprompter cleared',
      description: 'Teleprompter text has been cleared',
    });
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-black relative">
      {/* Top header row with Vyna logo and user - exactly matching navbar.png */}
      <div className="absolute top-0 left-0 right-0 z-30 px-4 py-2 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center">
          <svg width="64" height="28" viewBox="0 0 223 54" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M62.2324 5.62617C66.5003 5.62617 70.0549 8.93703 70.0549 12.9267C70.0549 16.9163 66.5003 20.2272 62.2324 20.2272C57.9644 20.2272 54.4099 16.9163 54.4099 12.9267C54.4099 8.93703 57.9644 5.62617 62.2324 5.62617ZM62.2324 17.0932C58.8232 17.0932 56.1104 15.0896 56.1104 12.9267C56.1104 10.7637 58.8232 8.7601 62.2324 8.7601C65.6416 8.7601 68.3544 10.7637 68.3544 12.9267C68.3544 15.0896 65.6416 17.0932 62.2324 17.0932Z" fill="white"/>
            <path d="M152.891 7.76582H167.15V12.1302H161.159V34.0566H156.93V12.1302H152.891V7.76582Z" fill="white"/>
            <path d="M182.079 22.5336C182.079 27.9232 178.525 34.1998 171.283 34.1998C166.201 34.1998 163.024 31.1693 163.024 27.0694H167.253C167.253 29.2323 168.872 30.7891 171.283 30.7891C174.692 30.7891 177.099 28.0521 177.099 22.5336V7.76582H182.079V22.5336Z" fill="white"/>
            <path d="M192.21 7.76582H197.19V11.6334C198.365 10.831 199.937 10.0286 201.511 10.0286C206.593 10.0286 209.577 13.0591 209.577 19.0528C209.577 25.4039 206.288 28.2922 201.511 28.2922C199.632 28.2922 197.969 27.7954 196.794 26.565V34.0566H192.21V7.76582ZM201.053 24.8815C203.58 24.8815 205.703 22.7185 205.703 19.0528C205.703 15.387 203.58 13.2241 201.053 13.2241C199.326 13.2241 198.05 13.9386 197.19 14.9791V22.6768C198.05 23.7173 199.326 24.8815 201.053 24.8815Z" fill="white"/>
            <path d="M114.9 21.4931H119.074V34.0566H114.9V31.8072C113.725 33.1807 112.152 34.1998 110.172 34.1998C106.762 34.1998 104.235 31.9504 104.235 27.2126V14.836H108.409V26.4218C108.409 29.2323 109.584 30.7891 111.87 30.7891C114.156 30.7891 114.9 28.7855 114.9 25.9751V14.836H119.074V21.4931Z" fill="white"/>
            <path d="M131.02 14.6928C133.547 14.6928 135.374 15.9232 136.55 17.8089V10.1718H140.724V34.0566H136.55V31.2329C135.374 33.1186 133.547 34.349 131.02 34.349C125.938 34.349 122.761 29.2323 122.761 24.5209C122.761 19.8095 125.938 14.6928 131.02 14.6928ZM130.867 30.9323C133.394 30.9323 135.833 28.7693 135.833 24.5209C135.833 20.2724 133.394 18.1095 130.867 18.1095C128.34 18.1095 125.901 20.2724 125.901 24.5209C125.901 28.7693 128.34 30.9323 130.867 30.9323Z" fill="white"/>
            <path d="M146.09 10.1718H151.019V34.0566H146.09V10.1718Z" fill="white"/>
            <path d="M146.09 7.62264H151.019V3.38416H146.09V7.62264Z" fill="white"/>
            <path d="M221.386 16.6444C221.386 12.2696 219.101 7.62263 215.386 5.16668C211.671 2.71072 207.193 1.76401 203.325 2.56642V1.76401C197.223 0.298993 192.184 0.301635 187.615 1.77459C183.046 3.24754 180.056 6.03508 179.033 9.89762C176.811 10.7 175.127 12.4293 175.127 14.3151V14.8619H170.499V14.3151C170.499 12.4293 168.816 10.7 166.594 9.89762C165.571 6.03508 162.581 3.24754 158.012 1.77459C153.443 0.301635 148.404 0.298993 142.301 1.76401V2.56642C138.434 1.76401 133.956 2.71072 130.241 5.16668C126.526 7.62263 124.241 12.2696 124.241 16.6444V17.1912V17.738V19.9009V20.4478C124.241 24.8226 126.526 29.4696 130.241 31.9255C132.363 33.342 134.638 34.1174 136.845 34.1913V34.1914H136.947C137.984 34.1914 139.015 34.0753 140.01 33.8264V33.0239C141.711 33.4276 143.539 33.5933 145.444 33.5933C147.348 33.5933 149.176 33.4276 150.878 33.0239V33.8264C153.217 34.398 155.377 34.2241 157.059 33.3809C158.741 32.5376 159.945 30.9985 160.1 29.1127C162.323 28.3103 164.006 26.581 164.006 24.6953C164.006 24.5762 163.996 24.4597 163.983 24.3444C164.169 23.9223 164.273 23.4596 164.273 22.9784V22.9783H168.902V22.9784C168.902 23.4596 169.006 23.9223 169.191 24.3444C169.178 24.4597 169.169 24.5762 169.169 24.6953C169.169 26.581 170.853 28.3103 173.075 29.1127C173.23 30.9985 174.434 32.5376 176.116 33.3809C177.798 34.2241 179.958 34.398 182.297 33.8264V33.0239C183.999 33.4276 185.827 33.5933 187.731 33.5933C189.636 33.5933 191.464 33.4276 193.165 33.0239V33.8264C194.16 34.0753 195.191 34.1914 196.228 34.1914H196.33V34.1913C198.537 34.1174 200.812 33.342 202.934 31.9255C206.649 29.4696 208.934 24.8226 208.934 20.4478V19.9009V17.738V17.1912V16.6444C208.934 16.4913 208.928 16.3398 208.921 16.1896C209.106 15.7676 209.211 15.3048 209.211 14.8236H209.211V14.3151C209.211 12.4293 207.528 10.7 205.305 9.89762C204.283 6.03508 201.292 3.24754 196.723 1.77459C192.155 0.301635 187.116 0.298993 181.013 1.76401V2.56642C177.145 1.76401 172.667 2.71072 168.952 5.16668C165.238 7.62263 162.953 12.2696 162.953 16.6444H167.582C167.582 13.9222 168.969 10.9685 171.411 9.36309C173.853 7.75772 177.043 7.2108 179.947 7.81333C178.719 8.8721 177.861 10.0252 177.491 11.2783C176.878 13.2651 177.17 15.3703 177.816 17.1912H165.267C165.267 14.469 163.88 11.5154 161.438 9.91C159.121 8.3848 156.162 7.81333 153.353 8.15962C154.581 9.21839 155.438 10.3715 155.809 11.6246C156.656 14.469 155.582 17.4559 155.246 17.738H135.929C135.594 17.4559 134.52 14.469 135.367 11.6246C135.737 10.3715 136.594 9.21839 137.822 8.15962C135.013 7.81333 132.055 8.3848 129.737 9.91C127.295 11.5154 125.909 14.469 125.909 17.1912H136.36C136.853 15.7382 137.086 14.1229 136.651 12.6709C136.165 11.0656 135.06 9.73208 133.616 8.87936C135.933 8.87936 137.994 9.57442 139.592 10.7C141.188 11.8256 142.301 13.3935 142.487 14.9617H146.598C146.784 13.3935 147.896 11.8256 149.493 10.7C151.091 9.57442 153.152 8.87936 155.469 8.87936C154.024 9.73208 152.92 11.0656 152.434 12.6709C151.999 14.1229 152.231 15.7382 152.724 17.1912H171.276C171.77 15.7382 172.002 14.1229 171.567 12.6709C171.081 11.0656 169.976 9.73208 168.532 8.87936C170.849 8.87936 172.91 9.57442 174.508 10.7C176.106 11.8256 177.219 13.3935 177.405 14.9617H181.516C181.702 13.3935 182.815 11.8256 184.413 10.7C186.01 9.57442 188.071 8.87936 190.388 8.87936C188.944 9.73208 187.84 11.0656 187.354 12.6709C186.918 14.1229 187.151 15.7382 187.644 17.1912H198.096C198.096 14.469 196.71 11.5154 194.268 9.91C191.949 8.3848 188.991 7.81333 186.182 8.15962C187.41 9.21839 188.267 10.3715 188.637 11.6246C189.484 14.469 188.411 17.4559 188.075 17.738H175.526C176.172 15.3703 176.464 13.2651 175.851 11.2783C175.48 10.0252 174.623 8.8721 173.395 7.81333C176.299 7.2108 179.489 7.75772 181.931 9.36309C184.373 10.9685 185.759 13.9222 185.759 16.6444H190.388C190.388 12.2696 188.103 7.62263 184.388 5.16668C180.674 2.71072 176.195 1.76401 172.328 2.56642V1.76401C166.226 0.298993 161.186 0.301635 156.618 1.77459C152.049 3.24754 149.058 6.03508 148.036 9.89762C145.813 10.7 144.13 12.4293 144.13 14.3151V14.8619H143.045V14.3151C143.045 12.4293 141.362 10.7 139.14 9.89762C138.117 6.03508 135.126 3.24754 130.558 1.77459C125.989 0.301635 120.949 0.298993 114.847 1.76401V2.56642C110.979 1.76401 106.501 2.71072 102.786 5.16668C99.0714 7.62263 96.7864 12.2696 96.7864 16.6444V17.1912V17.738V19.9009V20.4478C96.7864 24.8226 99.0714 29.4696 102.786 31.9255C106.501 34.3815 110.979 35.3282 114.847 34.5258V33.7234C120.949 35.1884 125.989 35.1858 130.558 33.7128C135.126 32.2398 138.117 29.4523 139.14 25.5898C141.362 24.7873 143.045 23.058 143.045 21.1722V20.6254H144.13V21.1722C144.13 23.058 145.813 24.7873 148.036 25.5898C149.058 29.4523 152.049 32.2398 156.618 33.7128C161.186 35.1858 166.226 35.1884 172.328 33.7234V34.5258C176.195 35.3282 180.674 34.3815 184.388 31.9255C188.103 29.4696 190.388 24.8226 190.388 20.4478V19.9009V17.738V17.1912V16.6444H185.759C185.759 19.3666 184.373 22.3203 181.931 23.9256C179.489 25.531 176.299 26.078 173.395 25.4754C174.623 24.4166 175.48 23.2635 175.851 22.0104C176.464 20.0236 176.172 17.9185 175.526 16.0976H188.075C188.411 16.3797 189.484 19.3666 188.637 22.2111C188.267 23.4642 187.41 24.6173 186.182 25.6761C188.991 26.0224 191.949 25.4508 194.268 23.9256C196.71 22.3203 198.096 19.3666 198.096 16.6444H187.644C187.151 18.0975 186.918 19.7128 187.354 21.1648C187.84 22.7701 188.944 24.1036 190.388 24.9563C188.071 24.9563 186.01 24.2613 184.413 23.1357C182.815 22.0101 181.702 20.4422 181.516 18.874H177.405C177.219 20.4422 176.106 22.0101 174.508 23.1357C172.91 24.2613 170.849 24.9563 168.532 24.9563C169.976 24.1036 171.081 22.7701 171.567 21.1648C172.002 19.7128 171.77 18.0975 171.276 16.6444H152.724C152.231 18.0975 151.999 19.7128 152.434 21.1648C152.92 22.7701 154.024 24.1036 155.469 24.9563C153.152 24.9563 151.091 24.2613 149.493 23.1357C147.896 22.0101 146.784 20.4422 146.598 18.874H142.487C142.301 20.4422 141.188 22.0101 139.592 23.1357C137.994 24.2613 135.933 24.9563 133.616 24.9563C135.06 24.1036 136.165 22.7701 136.651 21.1648C137.086 19.7128 136.853 18.0975 136.36 16.6444H125.909C125.909 19.3666 127.295 22.3203 129.737 23.9256C132.055 25.4508 135.013 26.0224 137.822 25.6761C136.594 24.6173 135.737 23.4642 135.367 22.2111C134.52 19.3666 135.594 16.3797 135.929 16.0976H155.246C155.582 16.3797 156.656 19.3666 155.809 22.2111C155.438 23.4642 154.581 24.6173 153.353 25.6761C156.162 26.0224 159.121 25.4508 161.438 23.9256C163.88 22.3203 165.267 19.3666 165.267 16.6444H177.816C177.17 17.9185 176.878 20.0236 177.491 22.0104C177.861 23.2635 178.719 24.4166 179.947 25.4754C177.043 26.078 173.853 25.531 171.411 23.9256C168.969 22.3203 167.582 19.3666 167.582 16.6444H162.953Z" fill="#CEB897"/>
            <path d="M91.4727 21.4967V19.5427H86.2726V25.4338H88.4726V22.8967H89.6726L91.4727 25.4338H94.0727L91.7726 22.5968C91.9726 22.5369 92.0726 22.4769 92.2726 22.417C92.7726 22.2372 92.9726 21.9375 92.9726 21.4967V21.4366C92.8726 20.6357 92.3726 21.3366 91.4727 21.4967ZM88.5726 21.3366H89.7726C90.1726 21.3366 90.3726 21.4366 90.3726 21.7363C90.3726 21.9974 90.1726 22.0974 89.7726 22.0974H88.5726V21.3366Z" fill="white"/>
            <path d="M98.8727 19.4827C96.3727 19.4827 94.3727 20.9046 94.3727 22.4765C94.3727 24.0484 96.3727 25.4703 98.8727 25.4703C101.373 25.4703 103.373 24.0484 103.373 22.4765C103.373 20.9046 101.373 19.4827 98.8727 19.4827ZM98.9727 23.9684C97.9727 23.9684 96.9727 23.3077 96.9727 22.486C96.9727 21.6644 97.9727 21.0037 98.9727 21.0037C99.9727 21.0037 100.873 21.6644 100.873 22.486C100.873 23.3077 99.9727 23.9684 98.9727 23.9684Z" fill="white"/>
            <path d="M83.8725 22.5969C83.8725 21.0961 82.6725 19.5952 81.1725 19.5427H75.4724V25.4338H80.9725C82.5725 25.4338 83.8725 24.0979 83.8725 22.5969ZM80.9725 23.9139H77.6724V21.0624H80.9725C81.6725 21.0624 82.0725 21.7771 82.0725 22.4918C82.0725 23.2065 81.6725 23.9139 80.9725 23.9139Z" fill="white"/>
            <path d="M35.0721 14.1219C35.0721 20.3992 29.9721 25.4338 23.6721 25.4338C17.3721 25.4338 12.272 20.3992 12.272 14.1219C12.272 7.84463 17.3721 2.81006 23.6721 2.81006C29.9721 2.81006 35.0721 7.84463 35.0721 14.1219Z" fill="white"/>
            <path d="M27.9721 14.1219C27.9721 16.5963 26.072 18.5 23.5721 18.5C21.0721 18.5 19.1721 16.5963 19.1721 14.1219C19.1721 11.6475 21.0721 9.74377 23.5721 9.74377C26.072 9.74377 27.9721 11.6475 27.9721 14.1219Z" fill="#CEB897"/>
            <path d="M35.0721 38.5781C35.0721 44.8554 29.9721 49.89 23.6721 49.89C17.3721 49.89 12.272 44.8554 12.272 38.5781C12.272 32.3009 17.3721 27.2663 23.6721 27.2663C29.9721 27.2663 35.0721 32.3009 35.0721 38.5781Z" fill="#CEB897"/>
            <path d="M47.3722 38.5781C47.3722 44.8554 42.2721 49.89 35.9722 49.89C29.6722 49.89 24.5721 44.8554 24.5721 38.5781C24.5721 32.3009 29.6722 27.2663 35.9722 27.2663C42.2721 27.2663 47.3722 32.3009 47.3722 38.5781Z" fill="#CEB897"/>
          </svg>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full overflow-hidden">
            <img src="https://i.pravatar.cc/100" alt="Divine Samuel" className="h-full w-full object-cover" />
          </div>
          <span className="text-white text-xs font-normal">Divine Samuel</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 6L8 10L12 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      
      {/* Second row with user info, channel name and viewer count - exactly matching navbar.png */}
      <div className="absolute top-[48px] left-0 right-0 z-30 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full overflow-hidden">
              <img src="https://i.pravatar.cc/100" alt="Divine Samuel" className="h-full w-full object-cover" />
            </div>
            <span className="text-white text-xs font-normal">Divine Samuel</span>
          </div>
          
          <div className="flex items-center mx-2">
            <span className="text-white/40 text-xs">•</span>
          </div>
        </div>

        {/* Center title */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <span className="text-white text-xs font-medium">Jaja Games</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12C14.4853 12 16.5 9.98528 16.5 7.5C16.5 5.01472 14.4853 3 12 3C9.51472 3 7.5 5.01472 7.5 7.5C7.5 9.98528 9.51472 12 12 12Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 20.25C3 16.6587 7.02944 13.75 12 13.75C16.9706 13.75 21 16.6587 21 20.25V20.5C21 20.7761 20.7761 21 20.5 21H3.5C3.22386 21 3 20.7761 3 20.5V20.25Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-white text-[11px]">123.5k</span>
          </div>
          
          {!isDrawerOpen && (
            <button 
              className="flex items-center justify-center"
              onClick={() => setIsDrawerOpen(true)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 6L9 12L15 18" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 6L3 12L9 18" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Main content area with video */}
      <div className="flex h-full">
        {/* Main video area */}
        <div 
          className={cn(
            "transition-all duration-300 ease-in-out relative h-full overflow-hidden",
            isDrawerOpen 
              ? "w-[calc(100%-320px)]" 
              : "w-full"
          )}
        >
          {/* Video stream - full screen */}
          <div className="absolute inset-0">
            <AgoraVideo 
              channelName={channelName}
              mode="livestream"
              showControls={false}
              enableMultiplatform={rtmpDestinations.length > 0}
              rtmpDestinations={rtmpDestinations}
              onError={(error) => {
                toast({
                  title: 'Streaming Error',
                  description: error,
                  variant: 'destructive',
                });
                
                if (onEnd) {
                  onEnd();
                }
              }}
              className="h-full w-full object-cover"
            />
          </div>
          
          {/* Chat messages bottom left - exactly as in 1st view.png */}
          <div className="absolute left-4 bottom-20 flex flex-col gap-2 z-10 max-w-xs">
            <div className="flex items-start gap-2 animate-slide-up">
              <div className="h-6 w-6 rounded-full overflow-hidden bg-orange-500/80">
                <img src="https://i.pravatar.cc/100?img=20" alt="User" className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-white font-medium">Innocent Dive</span>
                <span className="text-xs text-white/80">How far my guys wetin dey happen</span>
              </div>
            </div>
            
            <div className="flex items-start gap-2 animate-slide-up animation-delay-100">
              <div className="h-6 w-6 rounded-full overflow-hidden">
                <img src="https://i.pravatar.cc/100?img=30" alt="User" className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-white font-medium">Godknows Ukari</span>
                <span className="text-xs text-white/80">How far my guys wetin dey happen</span>
              </div>
            </div>
            
            <div className="flex items-start gap-2 animate-slide-up animation-delay-200">
              <div className="h-6 w-6 rounded-full overflow-hidden bg-gradient-to-r from-yellow-500 to-pink-500">
                <img src="https://i.pravatar.cc/100?img=40" alt="User" className="h-full w-full object-cover opacity-90" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-white font-medium">Godknows Ukari</span>
                <span className="text-xs text-white/80">How far my guys wetin dey happen</span>
              </div>
            </div>
            
            <div className="flex items-center mt-1 animate-slide-up animation-delay-300">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                <span className="text-xs text-white font-medium">Goddess</span>
              </div>
              <span className="text-xs text-white/70 ml-1">joined</span>
            </div>
          </div>
          
          {/* Control panel at bottom - exactly as in bottom.png */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
            <div className="flex items-center gap-1 bg-[#333333]/80 backdrop-blur-md rounded-full px-1 py-1">
              {/* Microphone icon */}
              <button className="h-10 w-10 flex items-center justify-center rounded-full text-white hover:bg-white/10 bg-[#555555]/80">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 1C10.3431 1 9 2.34315 9 4V12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12V4C15 2.34315 13.6569 1 12 1Z" fill="white"/>
                  <path d="M7 8V12C7 14.7614 9.23858 17 12 17C14.7614 17 17 14.7614 17 12V8M12 19V23M8 23H16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              {/* Camera icon */}
              <button className="h-10 w-10 flex items-center justify-center rounded-full text-white hover:bg-white/10 bg-[#555555]/80">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="6" width="15" height="12" rx="2" fill="white"/>
                  <path d="M22 9.76795C22 9.28299 22 9.04051 21.8977 8.91235C21.8078 8.80007 21.6739 8.73332 21.5348 8.72488C21.3766 8.71517 21.1926 8.81353 20.8245 9.01025L17 11.0001V13.0001L20.8245 14.99C21.1926 15.1867 21.3766 15.285 21.5348 15.2753C21.6739 15.2669 21.8078 15.2001 21.8977 15.0879C22 14.9597 22 14.7172 22 14.2323V9.76795Z" fill="white"/>
                </svg>
              </button>
              
              {/* Emoji icon */}
              <button className="h-10 w-10 flex items-center justify-center rounded-full text-white hover:bg-white/10 bg-[#555555]/80">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill="white"/>
                  <path d="M8 14C8 14 9 16 12 16C15 16 16 14 16 14" stroke="#333" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="8.5" cy="10.5" r="1.5" fill="#333"/>
                  <circle cx="15.5" cy="10.5" r="1.5" fill="#333"/>
                </svg>
              </button>
              
              {/* Share icon */}
              <button className="h-10 w-10 flex items-center justify-center rounded-full text-white hover:bg-white/10 bg-[#555555]/80">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 9.5V14.5C7 16.7091 8.79086 18.5 11 18.5H16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M12 7.5L16 3.5M16 3.5L16 7.5M16 3.5L12 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20.4 14.8889C20.4 16.8021 18.8418 18.3555 16.9222 18.3998C16.9222 18.3998 16.8863 18.4 16.85 18.4H16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              
              {/* Info icon */}
              <button className="h-10 w-10 flex items-center justify-center rounded-full text-white hover:bg-white/10 bg-[#555555]/80">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill="white"/>
                  <path d="M12 7H12.01M11 12H12V16H13" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              {/* End call button */}
              <button className="h-10 w-10 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 text-white">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 5L5 19M5 5L19 19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Sidebar drawer */}
        {isDrawerOpen && (
          <div className="w-[320px] h-full bg-black text-white border-l border-white/10">
            {/* Tabs header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex gap-2">
                <button
                  className={`px-3 py-1 rounded-md text-sm flex items-center ${
                    drawerContent === 'chat' 
                      ? 'bg-white text-black' 
                      : 'bg-transparent text-white border border-white/20'
                  }`}
                  onClick={() => setDrawerContent('chat')}
                >
                  <svg className="mr-1.5" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 11.6667L6.65 11.41L4.66667 10.2083V11.6667H4.08333V2.91666C4.08335 2.76196 4.14481 2.61358 4.25421 2.50418C4.36361 2.39478 4.51198 2.33333 4.66669 2.33333C4.8214 2.33333 4.96977 2.39478 5.07917 2.50418C5.18857 2.61358 5.25002 2.76196 5.25003 2.91666V2.91666L8.16669 2.91666C8.3214 2.91666 8.46977 2.97816 8.57917 3.08754C8.68857 3.19694 8.75003 3.34531 8.75003 3.5C8.75003 3.65471 8.6886 3.80308 8.57919 3.91247C8.46979 4.02187 8.32142 4.08333 8.16672 4.08333L5.25003 4.08333V9.33333L6.65 10.1733L8.05 9.33333V8.45833H8.75003V9.33333L7 10.5L6.65 10.7508V11.6667H7Z" fill={drawerContent === 'chat' ? 'black' : 'white'}/>
                  </svg>
                  VynaAI
                </button>
                
                <button
                  className={`px-3 py-1 rounded-md text-sm flex items-center ${
                    drawerContent === 'teleprompter' 
                      ? 'bg-white text-black' 
                      : 'bg-transparent text-white border border-white/20'
                  }`}
                  onClick={() => setDrawerContent('teleprompter')}
                >
                  <svg className="mr-1.5" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.6667 4.66667V12.25H2.33333V4.66667" stroke={drawerContent === 'teleprompter' ? 'black' : 'white'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12.8333 1.75H1.16667V4.66667H12.8333V1.75Z" stroke={drawerContent === 'teleprompter' ? 'black' : 'white'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M5.83333 7H8.16667" stroke={drawerContent === 'teleprompter' ? 'black' : 'white'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Notepad
                </button>
              </div>
              
              <button 
                className="p-1.5 rounded-full hover:bg-white/10"
                onClick={() => setIsDrawerOpen(false)}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.5 3.5L3.5 10.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3.5 3.5L10.5 10.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            
            {/* Drawer content */}
            <div className="h-[calc(100%-48px)]">
              {drawerContent === 'chat' ? (
                <div className="flex flex-col h-full">
                  {/* RECENTS header */}
                  <div className="p-4 pb-2">
                    <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">RECENTS</h3>
                  </div>
                  
                  {/* Chat history */}
                  <div className="flex-1 overflow-y-auto px-4">
                    <div className="space-y-3">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="p-3 border border-white/10 rounded-xl">
                          <p className="text-sm text-white line-clamp-2">Who is the best CODM gamer in Nigeria right now?</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* New chat button */}
                  <div className="p-4">
                    <button className="w-full py-2 px-4 bg-white/10 hover:bg-white/15 rounded-lg text-sm flex items-center justify-center">
                      <svg className="mr-2" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 2.91666V11.0833" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2.91666 7H11.0833" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      New chat
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  {/* Teleprompter content */}
                  <div className="flex-1 p-4 overflow-y-auto">
                    {teleprompterText ? (
                      <div className="text-xl font-medium leading-relaxed">
                        <GradientText 
                          text={teleprompterText} 
                          preset="warm" 
                          showCursor={true}
                          typingSpeed={0}
                        />
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-center">
                        <div>
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-800 flex items-center justify-center">
                            <svg width="28" height="28" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M11.6667 4.66667V12.25H2.33333V4.66667" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M12.8333 1.75H1.16667V4.66667H12.8333V1.75Z" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M5.83333 7H8.16667" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                          <h4 className="text-lg font-medium mb-2">No content yet</h4>
                          <p className="text-sm text-neutral-500">
                            Click the "Add to Teleprompter" button in a chat to add content here.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Teleprompter actions */}
                  {teleprompterText && (
                    <div className="p-4 border-t border-white/10 flex justify-end">
                      <button 
                        className="px-3 py-1.5 rounded-md border border-white/20 text-white text-sm mr-2 flex items-center"
                        onClick={handleClearTeleprompter}
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Clear
                      </button>
                      <button 
                        className="px-3 py-1.5 rounded-md border border-white/20 text-white text-sm flex items-center"
                        onClick={handleCopyTeleprompter}
                      >
                        <Copy className="h-3.5 w-3.5 mr-1" />
                        Copy
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}