import React, { useRef, useEffect } from 'react';
import { useChatbot } from './ChatbotProvider';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import QuickActions from './QuickActions';

const ChatMessages: React.FC = () => {
    const { messages, isTyping } = useChatbot();
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isTyping]);

    const showQuickActions = () => {
        if (messages.length === 0) return false;
        const lastMsg = messages[messages.length - 1];
        if (lastMsg.sender === 'user') return false; // Don't show after user message immediately

        // Show after welcome message
        if (messages.length === 1 && lastMsg.sender === 'ai') return true;

        // Show if AI asks for it (generic failure message logic)
        if (lastMsg.text.includes('sürətli düymələrdən')) return true;

        return false;
    };

    return (
        <section
            className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A] bg-dot-pattern p-4 overflow-y-auto custom-scrollbar flex flex-col"
            data-purpose="chat-messages"
        >
            {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
            ))}

            {isTyping && <TypingIndicator />}

            {showQuickActions() && !isTyping && <QuickActions />}

            <div ref={bottomRef} className="pb-2" />
        </section>
    );
};

export default ChatMessages;
