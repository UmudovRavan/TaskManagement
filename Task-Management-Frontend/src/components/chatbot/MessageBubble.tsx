import React, { useState } from 'react';
import type { ChatMessage } from '../../dto/ChatbotTypes';
import InlineResultGroup from './InlineResultGroup';
import { useChatbot } from './ChatbotProvider';

interface MessageBubbleProps {
    message: ChatMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
    const { expandChat } = useChatbot();
    const isUser = message.sender === 'user';
    const timeString = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(message.text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1000);
    };

    const handleRetry = () => {
        console.log("Retry clicked");
        // Future implementation: call sendMessage with last user text from context
    };

    // Logic to determine if we should show inline, modal link, or error
    const renderContent = () => {
        if (message.type === 'error') {
            return (
                <div className="flex flex-col gap-2">
                    <span className="flex items-center gap-2 font-medium text-red-600 dark:text-red-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Xəta baş verdi
                    </span>
                    <p>{message.text}</p>
                    <button
                        onClick={handleRetry}
                        className="self-start text-xs bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors mt-1"
                    >
                        Yenidən cəhd et
                    </button>
                </div>
            );
        }

        // Check for large data -> Modal Link
        if ((message.type === 'tasks' || message.type === 'files') && message.data && Array.isArray(message.data) && message.data.length > 3) {
            return (
                <div className="flex flex-col gap-2">
                    <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                    <div className="mt-2 text-sm bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                        <p className="mb-2 font-medium text-blue-800 dark:text-blue-300">
                            {message.data.length} nəticə tapıldı.
                        </p>
                        <button
                            onClick={expandChat}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1"
                        >
                            Tam ekranda göstər
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                        </button>
                    </div>
                </div>
            );
        }

        // Check for small data -> Inline
        if (message.data && (
            (message.type === 'tasks' && Array.isArray(message.data) && message.data.length <= 3) ||
            (message.type === 'files' && Array.isArray(message.data) && message.data.length <= 3) ||
            (message.type === 'stats')
        )) {
            return (
                <div>
                    <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                    <InlineResultGroup
                        data={message.data}
                        type={message.type as any}
                    />
                </div>
            );
        }

        // Default Text
        return <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>;
    };

    const bubbleStyle = isUser
        ? 'bg-gradient-to-br from-[#3B82F6] to-[#7C3AED] text-white rounded-[16px] rounded-br-[4px]'
        : message.type === 'error'
            ? 'bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-slate-800 dark:text-red-100 rounded-[16px] rounded-bl-[4px]'
            : 'bg-white dark:bg-[#1E293B] border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-[16px] rounded-bl-[4px]';

    return (
        <div className={`flex w-full ${isUser ? 'justify-end animate-slide-in-right' : 'justify-start animate-slide-in-left'} group mb-4`}>
            <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-2 items-end`}>

                {/* Avatar for AI */}
                {!isUser && (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mb-1 shadow-sm text-white ${message.type === 'error' ? 'bg-red-500' : 'bg-gradient-to-br from-[#6366F1] to-[#8B5CF6]'}`}>
                        {message.type === 'error' ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                        )}
                    </div>
                )}

                <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} relative group/bubble`}>
                    <div className={`p-3 shadow-sm text-sm relative transition-all duration-200 ${bubbleStyle}`}>

                        {/* Copy Button (Only for AI text messages) */}
                        {!isUser && message.type !== 'error' && (
                            <button
                                onClick={handleCopy}
                                className="absolute top-2 right-2 p-1.5 rounded-md bg-slate-100/50 dark:bg-slate-700/50 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 opacity-0 group-hover/bubble:opacity-100 transition-opacity duration-200"
                                title="Kopyala"
                            >
                                {copied ? (
                                    <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                ) : (
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                                )}
                            </button>
                        )}

                        {renderContent()}
                    </div>

                    <span className={`text-[10px] mt-1 opacity-60 px-1 dark:text-slate-400 ${isUser ? 'text-right' : 'text-left'}`}>
                        {timeString}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
