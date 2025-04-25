import React from 'react';
import { Link } from 'wouter';
import Logo from '@/components/Logo';
import { ChevronRight } from 'lucide-react';

// Import images
import streamCardImage from '@/assets/stream-card.jpg';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between">
        <Link href="/" className="transition-opacity hover:opacity-80">
          <Logo variant="light" size="sm" className="h-6" />
        </Link>
        
        <div className="flex items-center">
          <div className="flex items-center space-x-2">
            <div className="w-[24px] h-[24px] rounded-full overflow-hidden">
              <img 
                src="https://randomuser.me/api/portraits/men/32.jpg" 
                alt="Divine Samuel" 
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-white text-sm font-medium">Divine Samuel</span>
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
      <main className="flex-1 max-w-7xl mx-auto w-full">
        {/* Hero section */}
        <section className="mb-16 text-center mt-12">
          <h1 className="text-[56px] font-bold text-white mb-4 tracking-tight">Go Live or Join a stream</h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto mb-10">
            Start your own live stream with AI-powered research tools or join 
            other creators' streams to learn and engage.
          </p>
          
          <div className="flex items-center justify-center space-x-4">
            <Link href="/livestream">
              <button className="flex items-center space-x-2 px-6 py-3 bg-[#D8C6AF] text-black font-medium rounded-lg hover:opacity-90 transition-opacity">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
                  <rect x="8" y="10" width="8" height="4" rx="1" stroke="currentColor" strokeWidth="2" />
                </svg>
                <span>Start streaming</span>
              </button>
            </Link>
            
            <button className="flex items-center space-x-2 px-6 py-3 bg-[#2B2B2B] text-white font-medium rounded-lg hover:opacity-90 transition-opacity">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="4" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M12 16V20" stroke="currentColor" strokeWidth="2" />
                <path d="M8 20H16" stroke="currentColor" strokeWidth="2" />
              </svg>
              <span>Join stream</span>
            </button>
          </div>
        </section>
        
        {/* Upcoming streams section */}
        <section className="mb-16 px-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-white">Upcoming</h2>
            <Link href="/streams/upcoming" className="flex items-center text-zinc-400 hover:text-white transition-colors">
              <span className="text-sm">See all</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          <div className="flex gap-5 flex-wrap">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-[#1C1C1C] rounded-lg overflow-hidden w-[263px] h-[219px] flex flex-col">
                <div className="h-[150px] overflow-hidden">
                  <img 
                    src={streamCardImage}
                    alt="Jaja Games: Crowns & Chains" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 flex-1">
                  <div className="text-xs uppercase text-zinc-500 mb-1.5">PUBLIC</div>
                  <h3 className="text-white font-medium">Jaja Games: Crowns & Chains</h3>
                </div>
              </div>
            ))}
          </div>
        </section>
        
        {/* Saved streams section */}
        <section className="px-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-white">Saved</h2>
            <Link href="/streams/saved" className="flex items-center text-zinc-400 hover:text-white transition-colors">
              <span className="text-sm">See all</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          <div className="flex gap-5 flex-wrap">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-[#1C1C1C] rounded-lg overflow-hidden w-[263px] h-[219px] flex flex-col">
                <div className="h-[150px] overflow-hidden">
                  <img 
                    src={streamCardImage}
                    alt="Jaja Games: Crowns & Chains" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 flex-1">
                  <div className="text-xs uppercase text-zinc-500 mb-1.5">PUBLIC</div>
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