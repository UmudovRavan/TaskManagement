import React from 'react';
import { useChatbot } from './ChatbotProvider';

const ChatHeader: React.FC = () => {
    const { toggleChat, clearMessages, expandChat } = useChatbot();

    return (
        <header
            className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] p-4 flex items-center justify-between text-white shrink-0 rounded-t-[20px] h-[60px]"
            data-purpose="chat-header"
        >
            <div className="flex items-center gap-3">
                <div className="relative">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/30">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-[#5c72f7] rounded-full"></span>
                </div>
                <div>
                    <h3 className="font-semibold text-[15px] leading-tight text-white">TaskFlow AI</h3>
                    <span className="text-[11px] opacity-80 block">Onlayn</span>
                </div>
            </div>

            <div className="flex gap-1">
                {/* Maximize (Expand) - Placeholder for Phase 2 */}
                <button
                    className="w-7 h-7 flex items-center justify-center hover:bg-white/15 rounded-lg transition-colors"
                    title="Genişləndir"
                    onClick={expandChat}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                </button>

                {/* Minimize (Close Window without clearing) */}
                <button
                    className="w-7 h-7 flex items-center justify-center hover:bg-white/15 rounded-lg transition-colors"
                    title="Kiçilt"
                    onClick={toggleChat}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 12H6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                </button>

                {/* Close (Close & Clear) */}
                <button
                    className="w-7 h-7 flex items-center justify-center hover:bg-white/15 rounded-lg transition-colors"
                    title="Bağla"
                    onClick={() => {
                        toggleChat();
                        clearMessages();
                    }}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                </button>
            </div>
        </header>
    );
};

export default ChatHeader;
