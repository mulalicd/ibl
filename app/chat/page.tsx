'use client';

import Link from 'next/link';
import ChatInterface from '@/components/ChatInterface';

export default function ChatPage() {
  return (
    <div className="flex flex-col h-screen bg-background">

      {/* Top bar */}
      <header className="flex-shrink-0 h-16 bg-white border-b border-gray-200
                         flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center
                          justify-center text-white text-xs font-bold">
            IBL
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">
              IBL Lesson Planner
            </h1>
            <p className="text-xs text-gray-400">
              Internationale Deutsche Schule Sarajevo
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-xs text-gray-500 hover:text-primary
                       transition-colors px-3 py-1.5 rounded-lg
                       hover:bg-gray-50 border border-transparent
                       hover:border-gray-200"
          >
            Moji planovi
          </Link>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="text-xs text-gray-500 hover:text-red-600
                         transition-colors px-3 py-1.5 rounded-lg
                         hover:bg-red-50"
            >
              Odjava
            </button>
          </form>
        </div>
      </header>

      {/* Chat area */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full max-w-4xl mx-auto">
          <ChatInterface />
        </div>
      </main>
    </div>
  );
}