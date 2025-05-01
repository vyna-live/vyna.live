import { useState } from 'react';
import JoinStreamForm from '../components/JoinStreamForm';
import Logo from '../components/Logo';
import { Link } from 'wouter';

export default function JoinStream() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 flex flex-col">
      <header className="px-6 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Logo size="md" variant="full" />
        </Link>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Join a Livestream</h1>
            <p className="text-gray-400">Enter the stream link shared by the creator to join their live broadcast</p>
          </div>
          
          <JoinStreamForm />
        </div>
      </main>
      
      <footer className="py-4 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} Vyna.live - All rights reserved</p>
      </footer>
    </div>
  );
}
