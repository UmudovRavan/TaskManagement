import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { authService } from '../api';

interface SidebarProps {
    userName?: string;
    userRole?: string;
    userAvatar?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
    userName = 'User',
    userRole = 'Komanda Üzvü',
    userAvatar,
}) => {
    const location = useLocation();

    const handleLogout = () => {
        authService.clearToken();
        window.location.href = '/login';
    };

    const isManager = useMemo(() => {
        const role = userRole.toLowerCase();
        return role === 'manager' || role === 'admin';
    }, [userRole]);

    const navItems = useMemo(() => {
        const baseItems = [
            { path: '/dashboard', icon: 'dashboard', label: 'İdarə Paneli' },
            { path: '/tasks', icon: 'check_box', label: 'Tapşırıqlarım' },
        ];

        if (isManager) {
            baseItems.push({ path: '/work-groups', icon: 'groups', label: 'İş Qrupları' });
        }

        baseItems.push(
            { path: '/performance', icon: 'analytics', label: 'Performans' },
            { path: '/leaderboard', icon: 'emoji_events', label: 'Liderlər Lövhəsi' },
            { path: '/notifications', icon: 'notifications', label: 'Bildirişlər' },
            { path: '/settings', icon: 'settings', label: 'Tənzimləmələr' }
        );

        return baseItems;
    }, [isManager]);

    const isActive = (path: string) => location.pathname === path;

    return (
        <aside className="flex w-64 flex-col border-r border-[#e5e7eb] dark:border-input-border-dark bg-white dark:bg-surface-dark hidden md:flex shrink-0">
            <div className="flex h-full flex-col justify-between p-4">
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-3 px-2">
                        <div
                            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 bg-gray-200"
                            style={{
                                backgroundImage: userAvatar
                                    ? `url("${userAvatar}")`
                                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            }}
                        ></div>
                        <div className="flex flex-col">
                            <h1 className="text-base font-medium leading-normal dark:text-white">{userName}</h1>
                            <p className="text-[#636f88] text-xs font-normal leading-normal dark:text-gray-400">{userRole}</p>
                        </div>
                    </div>

                    <nav className="flex flex-col gap-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive(item.path)
                                    ? 'bg-primary/20 text-primary'
                                    : 'text-[#636f88] hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-primary/10'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
                                <span className="text-sm font-medium">{item.label}</span>
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="px-2">
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#e5e7eb] dark:border-gray-700 bg-white dark:bg-transparent py-2.5 text-sm font-medium text-[#111318] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                        Çıxış
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
