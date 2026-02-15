import React, { useEffect } from 'react';
import { useChatbot } from './ChatbotProvider';
import ChatModalHeader from './ChatModalHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import ResultPanel from './ResultPanel';

const ChatModal: React.FC = () => {
    const { isExpanded, collapseChat, resultData, resultType, resultTitle, resultCount } = useChatbot();

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isExpanded) {
                collapseChat();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isExpanded, collapseChat]);

    if (!isExpanded) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
                onClick={collapseChat}
            ></div>

            {/* Modal Container */}
            <div
                className="
                    bg-white dark:bg-[#0F172A] w-[95vw] h-[90vh] md:w-[85vw] md:h-[85vh] max-w-[1400px] 
                    rounded-[24px] shadow-2xl overflow-hidden flex flex-col relative z-10 
                    animate-in zoom-in-95 duration-300 ease-out origin-bottom-right
                    border border-white/20 dark:border-slate-700
                "
                onClick={(e) => e.stopPropagation()}
            >
                <ChatModalHeader />

                {/* Content Split View */}
                <main className="flex-1 flex overflow-hidden flex-col md:flex-row">
                    {/* Left Column - Chat History (35%) */}
                    <aside className="hidden md:flex flex-col w-[35%] border-r border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-[#0F172A]">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-[#1E293B]/50 shrink-0">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Conversation History</span>
                        </div>

                        <div className="flex-1 flex flex-col overflow-hidden relative">
                            {/* Reuse Message Component logic but maybe override styles via props if needed? 
                                Currently ChatMessages uses generic styles which should fit both via context parent class or just work.
                             */}
                            <ChatMessages />
                        </div>

                        <div className="shrink-0">
                            <ChatInput />
                        </div>
                    </aside>

                    {/* Right Column - Results (65%) */}
                    <ResultPanel
                        data={resultData}
                        type={resultType}
                        title={resultTitle}
                        count={resultCount}
                    />
                </main>

                {/* Footer */}
                <footer className="h-10 bg-white dark:bg-[#1E293B] border-t border-slate-100 dark:border-slate-700 px-8 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
                    <div className="flex items-center space-x-4">
                        <span>Powered by TaskFlow AI Engine v2.4</span>
                        <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></span>
                        <span>Security: Enterprise Encrypted</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="font-medium text-green-600 dark:text-green-500">System Online</span>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default ChatModal;
