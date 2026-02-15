import React, { useRef, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useChatbot } from './ChatbotProvider';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import ChatModal from './ChatModal';
import { authService } from '../../api/authService';

const ChatWindow: React.FC = () => {
    const { isOpen, isExpanded } = useChatbot();
    const location = useLocation();
    const [size, setSize] = useState({ width: 380, height: 500 });
    const isResizing = useRef(false);
    const startPos = useRef({ x: 0, y: 0 });
    const startSize = useRef({ width: 0, height: 0 });
    const rafId = useRef<number | null>(null);

    // Initial load from localStorage
    useEffect(() => {
        const savedSize = localStorage.getItem('chatbot_window_size');
        if (savedSize) {
            setSize(JSON.parse(savedSize));
        }
    }, []);

    // Resize Handler
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing.current) return;

            if (rafId.current) cancelAnimationFrame(rafId.current);

            rafId.current = requestAnimationFrame(() => {
                // Calculate delta (inverse because handle is on top-left but window anchored bottom-right)
                // Actually anchor is bottom-right.
                // If I drag top-left handle to left (smaller X), width increases.
                // If I drag top-left handle up (smaller Y), height increases.
                const deltaX = startPos.current.x - e.clientX;
                const deltaY = startPos.current.y - e.clientY;

                let newWidth = startSize.current.width + deltaX;
                let newHeight = startSize.current.height + deltaY;

                // Constraints
                if (newWidth < 320) newWidth = 320;
                if (newWidth > 600) newWidth = 600;
                if (newHeight < 400) newHeight = 400;
                if (newHeight > 700) newHeight = 700;

                setSize({ width: newWidth, height: newHeight });
            });
        };

        const handleMouseUp = () => {
            if (isResizing.current) {
                isResizing.current = false;
                document.body.style.userSelect = '';
                document.body.style.cursor = '';
                localStorage.setItem('chatbot_window_size', JSON.stringify(size)); // Save on stop
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            if (rafId.current) cancelAnimationFrame(rafId.current);
        };
    }, [size]); // adding size to dep array to ensure correct save? No, ref values are used for calc. But save needs current size. 
    // Actually handleMouseUp runs when event fires. internal size state update triggers re-render, but effect setup runs once?
    // We should be careful about closure staleness for 'size' in handleMouseUp if we used it directly, but we are setting isResizing false.
    // However, if we want to save 'size', we need access to latest 'size'.
    // Better way: use a ref for current size or just rely on state updater if we were doing functional updates, but localstorage needs value.
    // Let's rely on the state being up to date in the effect closure if we include it in dependency or use a ref for validSize.
    // Refactoring to use a Ref for current size to avoid re-binding listeners constantly.

    // Dot pattern for background
    const bgPatternStyle = {
        backgroundImage: 'radial-gradient(rgba(229, 231, 235, 0.4) 1px, transparent 1px)',
        backgroundSize: '20px 20px'
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        isResizing.current = true;
        startPos.current = { x: e.clientX, y: e.clientY };
        startSize.current = { width: size.width, height: size.height };
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'nwse-resize';
    };

    // Auth & Route Check
    const isAuthRoute = ['/login', '/register', '/forgot-password', '/otp-verification', '/reset-password', '/reset-success'].includes(location.pathname);
    const isAuthenticated = authService.isAuthenticated();

    if (isAuthRoute || !isAuthenticated) {
        return null; // Do not render if on auth route or not logged in
    }

    if (isExpanded) {
        return <ChatModal />;
    }

    return (
        <div
            className={`
                fixed z-[9998] right-6 bottom-[92px]
                bg-white dark:bg-[#0F172A] 
                rounded-[20px] shadow-2xl flex flex-col overflow-hidden 
                border border-slate-100 dark:border-slate-800 
                transition-all duration-300 ease-out origin-bottom-right
                ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-5 scale-95 pointer-events-none'}
            `}
            style={{
                width: size.width,
                height: size.height,
                // If closed, we might want to reset or keep size? standard is keep.
            }}
            id="chat-window"
        >
            {/* Resize Handle Area */}
            <div
                className="absolute top-0 left-0 w-6 h-6 z-50 cursor-nwse-resize group flex items-start justify-start p-1"
                onMouseDown={handleMouseDown}
            >
                {/* Visual Indicator - 3 diagonal lines */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="absolute top-[6px] left-[6px] w-[2px] h-[2px] bg-slate-400 dark:bg-slate-500 rounded-full"></div>
                    <div className="absolute top-[6px] left-[10px] w-[2px] h-[2px] bg-slate-400 dark:bg-slate-500 rounded-full"></div>
                    <div className="absolute top-[10px] left-[6px] w-[2px] h-[2px] bg-slate-400 dark:bg-slate-500 rounded-full"></div>
                    {/* Corner decorative lines */}
                    <svg className="w-3 h-3 text-slate-400 dark:text-slate-500" viewBox="0 0 10 10" fill="none">
                        <path d="M1 4L4 1M1 8L8 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                </div>
            </div>

            <ChatHeader />

            <div className="flex-1 flex flex-col relative" style={bgPatternStyle}>
                <ChatMessages />
            </div>

            <ChatInput />
        </div>
    );
};

export default ChatWindow;
