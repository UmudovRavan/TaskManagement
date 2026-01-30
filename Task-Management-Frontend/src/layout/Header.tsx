import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface HeaderProps {
    userName?: string;
    userAvatar?: string;
    notificationCount?: number;
    onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({
    userAvatar,
    notificationCount = 0,
    onMenuClick,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            return document.documentElement.classList.contains('dark') ||
                localStorage.getItem('theme') === 'dark';
        }
        return false;
    });

    React.useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    return (
        <header className="flex shrink-0 items-center justify-between border-b border-[#e5e7eb] dark:border-input-border-dark bg-white dark:bg-surface-dark px-6 py-3 z-10 transition-colors duration-200">
            <div className="flex items-center gap-8">
                <button
                    className="md:hidden text-[#111318] dark:text-white"
                    onClick={onMenuClick}
                >
                    <span className="material-symbols-outlined">menu</span>
                </button>
                <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30">
                        <span className="material-symbols-outlined text-[20px]">task_alt</span>
                    </div>
                    <h2 className="text-lg font-bold tracking-tight text-[#111318] dark:text-white">TaskFlow Enterprise</h2>
                </div>

                <div className="hidden md:flex w-[320px] items-center rounded-lg bg-[#f0f2f4] dark:bg-card-dark border border-transparent dark:border-input-border-dark px-3 py-2 transition-colors">
                    <span className="material-symbols-outlined text-[#636f88] text-[20px]">search</span>
                    <input
                        className="ml-2 w-full bg-transparent text-sm text-[#111318] dark:text-white placeholder-[#636f88] dark:placeholder-gray-500 outline-none border-none focus:ring-0 p-0"
                        placeholder="Tapşırıqları, layihələri axtar..."
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={() => setIsDark(!isDark)}
                    className="flex size-10 items-center justify-center rounded-full text-[#636f88] hover:bg-[#f0f2f4] dark:hover:bg-gray-800 transition-colors"
                >
                    <span className="material-symbols-outlined text-[24px]">
                        {isDark ? 'light_mode' : 'dark_mode'}
                    </span>
                </button>

                <Link
                    to="/notifications"
                    className="flex size-10 items-center justify-center rounded-full text-[#636f88] hover:bg-[#f0f2f4] dark:hover:bg-gray-800 transition-colors relative"
                >
                    <span className="material-symbols-outlined text-[24px]">notifications</span>
                    {notificationCount > 0 && (
                        <span className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                            {notificationCount > 99 ? '99+' : notificationCount}
                        </span>
                    )}
                </Link>
                <button className="flex size-10 items-center justify-center rounded-full text-[#636f88] hover:bg-[#f0f2f4] dark:hover:bg-gray-800 transition-colors">
                    <span className="material-symbols-outlined text-[24px]">help</span>
                </button>
                <div
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-9 bg-gray-200"
                    style={{
                        backgroundImage: userAvatar
                            ? `url("${userAvatar}")`
                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    }}
                ></div>
            </div>
        </header>
    );
};

export default Header;
