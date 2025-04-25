import React from 'react';
import { Link } from 'wouter';
import Logo from '@/components/Logo';
import { ChevronRight, Video, Monitor } from 'lucide-react';

// Import images
import streamCardImage from '@/assets/stream-card.jpg';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-zinc-800/50">
        <Link href="/" className="transition-opacity hover:opacity-80">
          <Logo variant="light" size="sm" className="h-8" />
        </Link>
        
        <div className="flex items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <img 
                src="https://randomuser.me/api/portraits/men/32.jpg" 
                alt="Divine Samuel" 
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-white font-medium text-sm">Divine Samuel</span>
            <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </header>
      
      {/* Sidebar toggle */}
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-10">
        <button className="bg-zinc-900/80 backdrop-blur-sm p-1.5 rounded-full text-zinc-400 hover:text-white">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 5l7 7-7 7M5 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      
      {/* Main content */}
      <main className="flex-1 px-6 py-8 max-w-6xl mx-auto w-full">
        {/* Hero section */}
        <section className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-white mb-4">Go Live or Join a stream</h1>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Start your own live stream with AI-powered research tools or join 
            other creators' streams to learn and engage.
          </p>
          
          <div className="flex items-center justify-center space-x-4 mt-8">
            <Link href="/livestream">
              <button className="flex items-center space-x-2 px-6 py-3 bg-[#d7c4ad] text-black font-medium rounded-md hover:bg-[#e2d1bd] transition-colors">
                <Video className="w-5 h-5" />
                <span>Start streaming</span>
              </button>
            </Link>
            
            <button className="flex items-center space-x-2 px-6 py-3 bg-zinc-800 text-white font-medium rounded-md hover:bg-zinc-700 transition-colors">
              <Monitor className="w-5 h-5" />
              <span>Join stream</span>
            </button>
          </div>
        </section>
        
        {/* Upcoming streams section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Upcoming</h2>
            <Link href="/streams/upcoming" className="flex items-center text-zinc-400 hover:text-white transition-colors">
              <span className="text-sm">See all</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-zinc-900 rounded-lg overflow-hidden">
                <div className="h-40 overflow-hidden">
                  <img 
                    src={streamCardImage}
                    alt="Jaja Games: Crowns & Chains" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="text-xs text-zinc-500 mb-1">PUBLIC</div>
                  <h3 className="text-white font-medium">Jaja Games: Crowns & Chains</h3>
                </div>
              </div>
            ))}
          </div>
        </section>
        
        {/* Saved streams section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Saved</h2>
            <Link href="/streams/saved" className="flex items-center text-zinc-400 hover:text-white transition-colors">
              <span className="text-sm">See all</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-zinc-900 rounded-lg overflow-hidden">
                <div className="h-40 overflow-hidden">
                  <img 
                    src={streamCardImage}
                    alt="Jaja Games: Crowns & Chains" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="text-xs text-zinc-500 mb-1">PUBLIC</div>
                  <h3 className="text-white font-medium">Jaja Games: Crowns & Chains</h3>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}