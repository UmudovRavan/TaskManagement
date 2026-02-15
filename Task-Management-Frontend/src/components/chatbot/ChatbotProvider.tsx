import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import type { ChatMessage, TaskResult, FileResult, StatsResult } from '../../dto/ChatbotTypes';
import { sendMessage as mockSendMessage } from '../../services/chatbotService';
import { authService } from '../../api/authService';
// checking previous file lists: api/authService.ts exists. services/chatbotService.ts exists.
// Code at line 4 uses '../../services/chatbotService'.
// api is at '../../api/authService' likely.

type ResultType = "tasks" | "files" | "stats" | null;
type ResultData = TaskResult[] | FileResult[] | StatsResult | null;

interface ChatbotContextType {
    isOpen: boolean;
    isExpanded: boolean;
    messages: ChatMessage[];
    isTyping: boolean;
    unreadCount: number;
    resultData: ResultData;
    resultType: ResultType;
    resultTitle: string;
    resultCount: number;
    toggleChat: () => void;
    expandChat: () => void;
    collapseChat: () => void;
    clearMessages: () => void;
    sendMessage: (text: string) => Promise<void>;
    setResult: (data: ResultData, type: ResultType, title: string) => void;
    clearResult: () => void;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export const useChatbot = () => {
    const context = useContext(ChatbotContext);
    if (!context) {
        throw new Error('useChatbot must be used within a ChatbotProvider');
    }
    return context;
};

export const ChatbotProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [unreadCount, setUnreadCount] = useState(1);

    // New States for Extended Modal
    const [resultData, setResultData] = useState<ResultData>(null);
    const [resultType, setResultType] = useState<ResultType>(null);
    const [resultTitle, setResultTitle] = useState<string>('');
    const [resultCount, setResultCount] = useState<number>(0);

    const isAuthenticated = authService.isAuthenticated();

    useEffect(() => {
        if (!isAuthenticated) {
            setMessages([]);
            setIsOpen(false);
            setIsExpanded(false);
            setResultData(null);
            localStorage.removeItem('chatbot_greeted');
        }
    }, [isAuthenticated, location.pathname]);

    useEffect(() => {
        if (!isAuthenticated) return; // Don't greet if not authenticated

        const greeted = localStorage.getItem('chatbot_greeted');
        if (!greeted) {
            setTimeout(() => {
                setIsTyping(true);
                setTimeout(() => {
                    const welcomeMessage: ChatMessage = {
                        id: 'welcome-msg',
                        sender: 'ai',
                        text: 'Salam! Mən TaskFlow AI köməkçisiyəm. Sizə layihələriniz və tapşırıqlarınızla bağlı necə kömək edə bilərəm? 🤖',
                        type: 'text',
                        timestamp: new Date()
                    };
                    setMessages([welcomeMessage]);
                    setIsTyping(false);
                    setUnreadCount(prev => prev + 1);
                    localStorage.setItem('chatbot_greeted', 'true');
                }, 1500);
            }, 500);
        } else {
            if (messages.length === 0) {
                const welcomeMessage: ChatMessage = {
                    id: 'welcome-msg',
                    sender: 'ai',
                    text: 'Salam! Mən TaskFlow AI köməkçisiyəm. Sizə layihələriniz və tapşırıqlarınızla bağlı necə kömək edə bilərəm? 🤖',
                    type: 'text',
                    timestamp: new Date()
                };
                setMessages([welcomeMessage]);
            }
        }
    }, [isAuthenticated]); // Re-run when auth changes to potentially greet newly logged in user

    const toggleChat = () => {
        if (!isOpen) {
            setUnreadCount(0);
        }
        // If closing, collapse everything
        if (isOpen) {
            setIsExpanded(false);
            clearResult();
        }
        setIsOpen(prev => !prev);
    };

    const expandChat = () => {
        setIsExpanded(true);
    };

    const collapseChat = () => {
        setIsExpanded(false);
        clearResult();
    };

    const clearMessages = () => {
        setMessages([]);
        const welcomeMessage: ChatMessage = {
            id: Date.now().toString(),
            sender: 'ai',
            text: 'Salam! Mən TaskFlow AI köməkçisiyəm. Sizə layihələriniz və tapşırıqlarınızla bağlı necə kömək edə bilərəm? 🤖',
            type: 'text',
            timestamp: new Date()
        };
        setMessages([welcomeMessage]);
    };

    const setResult = (data: ResultData, type: ResultType, title: string) => {
        setResultData(data);
        setResultType(type);
        setResultTitle(title);
        if (Array.isArray(data)) {
            setResultCount(data.length);
        } else {
            setResultCount(data ? 1 : 0);
        }
    };

    const clearResult = () => {
        setResultData(null);
        setResultType(null);
        setResultTitle('');
        setResultCount(0);
    };

    const sendMessage = async (text: string) => {
        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            sender: 'user',
            text: text,
            type: 'text',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setIsTyping(true);

        try {
            const response = await mockSendMessage(text);
            setMessages(prev => [...prev, response as ChatMessage]);

            // Auto-expand logic
            if ((response.type === 'tasks' || response.type === 'files') && response.data && Array.isArray(response.data)) {
                if (response.data.length > 3) {
                    setResult(response.data, response.type as any, text); // Use user text as title context?? No, maybe better to infer logic or default.
                    // Let's use a mapping for title based on text
                    let autoTitle = "Nəticələr";
                    if (text.toLowerCase().includes('task') || text.toLowerCase().includes('tapşırıq')) autoTitle = "Tapşırıqlar";
                    if (text.toLowerCase().includes('fayl')) autoTitle = "Fayllar";
                    if (text.toLowerCase().includes('revan')) autoTitle = "Revanın tapşırıqları"; // Mock logic from prompt example context

                    setResultTitle(autoTitle);
                    expandChat();
                }
            }

        } catch (error) {
            console.error("Error sending message:", error);
            const errorMessage: ChatMessage = {
                id: Date.now().toString(),
                sender: 'ai',
                text: 'Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.',
                type: 'error',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <ChatbotContext.Provider value={{
            isOpen,
            isExpanded,
            messages,
            isTyping,
            unreadCount,
            resultData,
            resultType,
            resultTitle,
            resultCount,
            toggleChat,
            expandChat,
            collapseChat,
            clearMessages,
            sendMessage,
            setResult,
            clearResult
        }}>
            {children}
        </ChatbotContext.Provider>
    );
};
