import React from 'react';
import { useChatbot } from './ChatbotProvider';

const ChatModalHeader: React.FC = () => {
    const { collapseChat, toggleChat, resultTitle } = useChatbot();

    return (
        <header className="h-20 bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center justify-between px-8 text-white shrink-0 rounded-t-[24px]">
            <div className="flex items-center space-x-4">
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm shadow-inner border border-white/10">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-white drop-shadow-sm">TaskFlow Enterprise AI</h1>
                    <p className="text-blue-100 text-sm opacity-90 font-medium">Context: {resultTitle || "Ümumi söhbət"}</p>
                </div>
            </div>

            <div className="flex items-center space-x-6">
                <div className="flex -space-x-2 items-center">
                    {/* Mock User Avatar */}
                    <div className="relative">
                        <div className="w-9 h-9 rounded-full border-2 border-indigo-500 bg-white dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold shadow-md">
                            R
                        </div>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={collapseChat}
                        className="w-10 h-10 flex items-center justify-center hover:bg-white/15 rounded-xl transition-all duration-200 active:scale-95"
                        title="Kiçilt"
                    >
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M19 5L5 19M5 19H12M5 19V12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                    </button>

                    <button
                        onClick={() => { collapseChat(); toggleChat(); }}
                        className="w-10 h-10 flex items-center justify-center hover:bg-white/15 hover:text-red-200 rounded-xl transition-all duration-200 active:scale-95"
                        title="Bağla"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default ChatModalHeader;
