import React, { useState, useRef, useEffect } from 'react';
import { useChatbot } from './ChatbotProvider';

const ChatInput: React.FC = () => {
    const { sendMessage, isTyping } = useChatbot();
    const [text, setText] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSend = () => {
        if (text.trim() && !isTyping) {
            sendMessage(text.trim());
            setText('');
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto'; // Reset height
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [text]);

    return (
        <footer className="p-4 bg-white dark:bg-[#1E293B] border-t border-slate-100 dark:border-slate-700 shrink-0" data-purpose="chat-input-area">
            <div className="flex items-end gap-2 bg-slate-50 dark:bg-slate-800 rounded-[16px] px-3 py-2 border border-slate-200 dark:border-slate-600 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                <button
                    className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-2 mb-0.5 transition-colors disabled:opacity-40"
                    title="Fayl əlavə et"
                    disabled
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                </button>

                <textarea
                    ref={textareaRef}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none py-2 max-h-[120px] custom-scrollbar"
                    placeholder="Mesajınızı yazın..."
                    rows={1}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                />

                <button
                    onClick={handleSend}
                    disabled={!text.trim() || isTyping}
                    className={`
                p-2 rounded-full mb-0.5 shadow-sm transition-all duration-200 flex items-center justify-center
                ${text.trim() && !isTyping
                            ? 'bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white hover:scale-105 active:scale-95'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'}
            `}
                    title="Göndər"
                >
                    <svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                </button>
            </div>
            <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 mt-2 select-none">Powered by TaskFlow AI Engine</p>
        </footer>
    );
};

export default ChatInput;
