import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useChatbot } from './ChatbotProvider';
import { authService } from '../../api/authService';

const ChatbotTrigger: React.FC = () => {
    const { isOpen, toggleChat, unreadCount } = useChatbot();
    const location = useLocation();
    const [showTooltip, setShowTooltip] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        // Tooltip logic: show after 3s, hide after 4s (total 7s from start), only once
        const tooltipShown = localStorage.getItem('chatbot_tooltip_shown');
        if (!tooltipShown) {
            const showTimer = setTimeout(() => setShowTooltip(true), 3000);
            const hideTimer = setTimeout(() => {
                setShowTooltip(false);
                localStorage.setItem('chatbot_tooltip_shown', 'true');
            }, 7000);

            return () => {
                clearTimeout(showTimer);
                clearTimeout(hideTimer);
            };
        }
    }, []);

    // Auth & Route Check
    const isAuthRoute = ['/login', '/register', '/forgot-password', '/otp-verification', '/reset-password', '/reset-success'].includes(location.pathname);
    const isAuthenticated = authService.isAuthenticated();

    if (isAuthRoute || !isAuthenticated) {
        return null;
    }

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
            {/* Notification Bubble / Tooltip */}
            {showTooltip && !isOpen && (
                <div
                    className="bg-white dark:bg-slate-800 py-2.5 px-4 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium relative animate-bounce mb-4 mr-2"
                    id="notification-bubble"
                >
                    Salam! Mən TaskFlow AI köməkçisiyəm 🤖
                    {/* Arrow */}
                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[10px] border-l-white dark:border-l-slate-800"></div>
                </div>
            )}

            {/* Trigger Button */}
            <button
                onClick={toggleChat}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`relative w-14 h-14 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-white shadow-lg hover:shadow-blue-500/40 transform transition-all duration-200 ease-out group ${isHovered ? 'scale-110' : 'scale-100'
                    } ${!isOpen ? 'animate-bounce-in' : ''}`} // bounce-in is custom, effectively handled by initial render usually, but prompt asked for bounce on load. 
                style={{ animationDuration: '0.6s' }}
                id="chat-trigger"
            >
                {/* Halo Effect - only when closed */}
                {!isOpen && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] opacity-40 animate-ping" style={{ animationDuration: '3s' }}></div>
                )}

                {/* Icons */}
                <div className="relative w-6 h-6">
                    <svg
                        className={`w-6 h-6 absolute top-0 left-0 transition-all duration-300 ${isOpen ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                    </svg>

                    <svg
                        className={`w-6 h-6 absolute top-0 left-0 transition-all duration-300 ${isOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </div>

                {/* Unread Badge */}
                {unreadCount > 0 && !isOpen && (
                    <span className="absolute top-0 right-0 w-[18px] h-[18px] bg-red-500 border-2 border-white dark:border-slate-800 rounded-full flex items-center justify-center text-[10px] font-bold animate-pulse">
                        {unreadCount}
                    </span>
                )}
            </button>
        </div>
    );
};

export default ChatbotTrigger;
