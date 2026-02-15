import React from 'react';

const TypingIndicator: React.FC = () => {
    return (
        <div className="flex w-full justify-start animate-slide-in-left group mb-4">
            <div className="flex max-w-[85%] flex-row gap-2 items-end">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 mb-1">
                    <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"></path>
                        <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"></path>
                    </svg>
                </div>

                {/* Bubble */}
                <div className="bg-white dark:bg-[#1E293B] p-3 rounded-[16px] rounded-bl-[4px] border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex gap-1.5 py-1" data-purpose="typing-indicator">
                        <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"></span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TypingIndicator;
