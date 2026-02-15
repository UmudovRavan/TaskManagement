import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../api';

interface HeaderProps {
    userName?: string;
    userRole?: string;
    userEmail?: string;
    userAvatar?: string;
    notificationCount?: number;
    notifications?: Array<{ id: number; message: string; createdAt: string; isRead: boolean }>;
    onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({
    userName = 'User',
    userRole = 'Employee',
    userEmail = '',
    userAvatar,
    notificationCount: propsNotificationCount = 0,
    notifications: propNotifications = [],
    onMenuClick,
}) => {
    const { notifications: contextNotifications, unreadCount: contextUnreadCount, markAsRead } = useNotifications();
    // Prioritize context data, fallback to props
    const notifications = contextNotifications.length > 0 ? contextNotifications : propNotifications;
    // Sort by date desc
    const sortedNotifications = [...notifications].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const notificationCount = contextUnreadCount !== undefined ? contextUnreadCount : (propsNotificationCount || 0);
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            return document.documentElement.classList.contains('dark') ||
                localStorage.getItem('theme') === 'dark';
        }
        return false;
    });
    const [scrolled, setScrolled] = useState(false);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);
    const [showHelpDropdown, setShowHelpDropdown] = useState(false);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [notifHovered, setNotifHovered] = useState(false);
    const [helpHovered, setHelpHovered] = useState(false);
    const [avatarHovered, setAvatarHovered] = useState(false);
    const [logoHovered, setLogoHovered] = useState(false);

    const searchRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);
    const helpRef = useRef<HTMLDivElement>(null);
    const userRef = useRef<HTMLDivElement>(null);

    const roleLower = userRole.toLowerCase();
    const ringColor = roleLower === 'admin' ? '#D4A017' : roleLower === 'manager' ? '#3B82F6' : '#10B981';

    // Dark mode toggle
    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    // Scroll detection
    useEffect(() => {
        const handleScroll = () => {
            const mainEl = document.querySelector('main');
            if (mainEl) {
                setScrolled(mainEl.scrollTop > 0);
            }
        };
        const mainEl = document.querySelector('main');
        if (mainEl) {
            mainEl.addEventListener('scroll', handleScroll, { passive: true });
            return () => mainEl.removeEventListener('scroll', handleScroll);
        }
    }, []);

    // Keyboard shortcut: Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Close dropdowns on outside click
    const useOutsideClick = (ref: React.RefObject<HTMLElement | null>, handler: () => void) => {
        useEffect(() => {
            const listener = (e: MouseEvent) => {
                if (!ref.current || ref.current.contains(e.target as Node)) return;
                handler();
            };
            document.addEventListener('mousedown', listener);
            return () => document.removeEventListener('mousedown', listener);
        }, [ref, handler]);
    };

    useOutsideClick(searchRef, () => { setShowSearchDropdown(false); setSearchFocused(false); });
    useOutsideClick(notifRef, () => setShowNotifDropdown(false));
    useOutsideClick(helpRef, () => setShowHelpDropdown(false));
    useOutsideClick(userRef, () => setShowUserDropdown(false));

    const handleLogout = useCallback(() => {
        authService.clearToken();
        window.location.href = '/login';
    }, []);

    const formatRelativeTime = (dateString: string) => {
        const diff = Date.now() - new Date(dateString).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'İndi';
        if (mins < 60) return `${mins} dəq əvvəl`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs} saat əvvəl`;
        const days = Math.floor(hrs / 24);
        if (days === 1) return 'Dünən';
        return `${days} gün əvvəl`;
    };

    const recentNotifications = sortedNotifications.slice(0, 5);

    const isTaskAcceptedNotification = (message: string) => {
        return message.toLowerCase().includes('qəbul etdi') || message.toLowerCase().includes('accept');
    };

    const isTaskRejectedNotification = (message: string) => {
        return message.toLowerCase().includes('rədd etdi') || message.toLowerCase().includes('reject');
    };

    const isMentionNotification = (message: string) => {
        return message.toLowerCase().includes('mention') || message.includes('@');
    };

    const isAssignmentNotification = (message: string) => {
        return message.toLowerCase().includes('assign') ||
            message.toLowerCase().includes('təyin olundu');
    };

    const getNotificationIcon = (message: string) => {
        if (isTaskAcceptedNotification(message)) {
            return { icon: 'check_circle', bgColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7', textColor: isDark ? '#34D399' : '#16A34A' };
        }
        if (isTaskRejectedNotification(message)) {
            return { icon: 'cancel', bgColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2', textColor: isDark ? '#F87171' : '#DC2626' };
        }
        if (isMentionNotification(message)) {
            return { icon: 'alternate_email', bgColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#DBEAFE', textColor: isDark ? '#60A5FA' : '#2563EB' };
        }
        if (isAssignmentNotification(message)) {
            return { icon: 'assignment_ind', bgColor: isDark ? 'rgba(139, 92, 246, 0.15)' : '#F3E8FF', textColor: isDark ? '#A78BFA' : '#7C3AED' };
        }
        return { icon: 'notifications', bgColor: isDark ? 'rgba(243, 244, 246, 0.1)' : '#F3F4F6', textColor: isDark ? '#9CA3AF' : '#6B7280' };
    };

    return (
        <header
            className="flex shrink-0 items-center justify-between px-4 md:px-6 relative"
            style={{
                height: 64,
                position: 'sticky',
                top: 0,
                zIndex: 50,
                background: isDark
                    ? (scrolled ? 'rgba(17, 24, 39, 0.8)' : 'rgba(17, 24, 39, 1)')
                    : (scrolled ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 1)'),
                backdropFilter: scrolled ? 'blur(12px)' : 'none',
                WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
                borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                boxShadow: scrolled ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                transition: 'box-shadow 0.2s ease, background 0.2s ease',
            }}
        >
            {/* Left: Logo + Search */}
            <div className="flex items-center gap-4 md:gap-6">
                {/* Mobile hamburger */}
                <button
                    className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl"
                    onClick={onMenuClick}
                    style={{
                        color: isDark ? '#E5E7EB' : '#374151',
                    }}
                >
                    <span className="material-symbols-outlined text-[24px]">menu</span>
                </button>

                {/* Logo */}
                <Link
                    to="/dashboard"
                    className="flex items-center gap-2.5 cursor-pointer select-none group"
                    onMouseEnter={() => setLogoHovered(true)}
                    onMouseLeave={() => setLogoHovered(false)}
                >
                    <div
                        className="flex items-center justify-center rounded-xl text-white"
                        style={{
                            width: 34,
                            height: 34,
                            background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                            animation: logoHovered ? 'logoPulse 0.6s ease-in-out' : 'none',
                        }}
                    >
                        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
                    </div>
                    <div className="hidden sm:flex items-baseline gap-0.5">
                        <span style={{ fontWeight: 700, fontSize: 17, color: isDark ? '#F9FAFB' : '#111827', letterSpacing: '-0.3px' }}>Task</span>
                        <span style={{ fontWeight: 300, fontSize: 17, color: isDark ? '#D1D5DB' : '#374151', letterSpacing: '-0.3px' }}>Flow</span>
                        <span style={{ fontWeight: 400, fontSize: 14, color: isDark ? '#9CA3AF' : '#6B7280', marginLeft: 4 }}>Enterprise</span>
                    </div>
                </Link>

                {/* Search Bar */}
                <div ref={searchRef} className="relative hidden md:block">
                    <div
                        className="flex items-center rounded-xl"
                        style={{
                            width: searchFocused ? 400 : 320,
                            height: 40,
                            padding: '0 14px',
                            background: searchFocused
                                ? (isDark ? '#374151' : '#FFFFFF')
                                : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                            border: searchFocused
                                ? '1px solid #3B82F6'
                                : '1px solid transparent',
                            boxShadow: searchFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
                            transition: 'all 0.3s ease',
                        }}
                    >
                        <span className="material-symbols-outlined text-[18px]" style={{ color: isDark ? '#9CA3AF' : '#9CA3AF' }}>search</span>
                        <input
                            ref={searchInputRef}
                            className="flex-1 bg-transparent text-sm outline-none border-none focus:ring-0 px-2.5"
                            style={{
                                color: isDark ? '#F9FAFB' : '#111827',
                                padding: 0,
                            }}
                            placeholder="Tapşırıqları, layihələri axtar..."
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => { setSearchFocused(true); setShowSearchDropdown(true); }}
                        />
                        {/* Shortcut badge */}
                        <span
                            className="shrink-0"
                            style={{
                                fontSize: 11,
                                fontFamily: 'monospace',
                                padding: '2px 8px',
                                borderRadius: 6,
                                background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                                color: isDark ? '#9CA3AF' : '#6B7280',
                                opacity: searchFocused ? 0 : 1,
                                transition: 'opacity 0.15s ease',
                            }}
                        >
                            ⌘K
                        </span>
                    </div>

                    {/* Search Dropdown */}
                    {showSearchDropdown && (
                        <div
                            className="absolute top-full mt-2 left-0 right-0 rounded-xl border overflow-hidden"
                            style={{
                                background: isDark ? '#1F2937' : '#FFFFFF',
                                borderColor: isDark ? '#374151' : '#E5E7EB',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                                maxHeight: 300,
                                animation: 'dropdownSlide 0.2s ease forwards',
                                zIndex: 100,
                            }}
                        >
                            <div className="px-4 py-3" style={{ borderBottom: `1px solid ${isDark ? '#374151' : '#F3F4F6'}` }}>
                                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>Son axtarışlar</p>
                            </div>
                            <div className="py-1">
                                {['Dashboard tapşırıqları', 'Gecikmiş layihələr', 'Komanda hesabatı', 'Performans analizi', 'İş yükü bölgüsü'].map((item, i) => (
                                    <button
                                        key={i}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left"
                                        style={{
                                            color: isDark ? '#D1D5DB' : '#374151',
                                            transition: 'background 0.15s ease',
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)')}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                        onClick={() => { setSearchQuery(item); setShowSearchDropdown(false); }}
                                    >
                                        <span className="material-symbols-outlined text-[16px]" style={{ color: isDark ? '#6B7280' : '#9CA3AF' }}>schedule</span>
                                        {item}
                                    </button>
                                ))}
                            </div>
                            <div style={{ borderTop: `1px solid ${isDark ? '#374151' : '#F3F4F6'}` }}>
                                <button
                                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium"
                                    style={{ color: '#3B82F6' }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? 'rgba(59,130,246,0.05)' : 'rgba(59,130,246,0.03)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                >
                                    Ətraflı axtarış
                                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center" style={{ gap: 4 }}>

                {/* Dark Mode Toggle Switch */}
                <button
                    onClick={() => setIsDark(!isDark)}
                    className="relative flex items-center rounded-full cursor-pointer"
                    style={{
                        width: 48,
                        height: 24,
                        background: isDark
                            ? 'linear-gradient(135deg, #1E3A5F, #4C1D95)'
                            : 'linear-gradient(135deg, #93C5FD, #60A5FA)',
                        transition: 'background 0.3s ease',
                        padding: 2,
                    }}
                    aria-label="Toggle dark mode"
                >
                    {/* Toggle ball */}
                    <div
                        className="rounded-full flex items-center justify-center"
                        style={{
                            width: 20,
                            height: 20,
                            background: '#FFFFFF',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                            transform: isDark ? 'translateX(24px)' : 'translateX(0)',
                            transition: 'transform 0.3s ease',
                        }}
                    >
                        <span style={{ fontSize: 11 }}>{isDark ? '🌙' : '☀️'}</span>
                    </div>
                </button>

                {/* Separator */}
                <Separator isDark={isDark} />

                {/* Notification Icon */}
                <div ref={notifRef} className="relative">
                    <button
                        onClick={() => { setShowNotifDropdown(!showNotifDropdown); setShowHelpDropdown(false); setShowUserDropdown(false); }}
                        onMouseEnter={() => setNotifHovered(true)}
                        onMouseLeave={() => setNotifHovered(false)}
                        className="relative flex items-center justify-center rounded-full"
                        style={{
                            width: 40,
                            height: 40,
                            background: notifHovered
                                ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)')
                                : 'transparent',
                            transition: 'background 0.2s ease',
                        }}
                    >
                        <span
                            className="material-symbols-outlined text-[22px]"
                            style={{
                                color: '#6B7280',
                                animation: notifHovered ? 'bellShake 0.4s ease' : 'none',
                            }}
                        >
                            notifications
                        </span>
                        {/* Pulse dot */}
                        {notificationCount > 0 && !showNotifDropdown && (
                            <div
                                className="absolute rounded-full"
                                style={{
                                    width: 8,
                                    height: 8,
                                    backgroundColor: '#EF4444',
                                    top: 8,
                                    right: 9,
                                    animation: 'notifPulse 2s infinite',
                                }}
                            />
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifDropdown && (
                        <div
                            className="absolute right-0 top-full mt-2 rounded-2xl border overflow-hidden"
                            style={{
                                width: 360,
                                background: isDark ? '#1F2937' : '#FFFFFF',
                                borderColor: isDark ? '#374151' : '#E5E7EB',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                                maxHeight: 400,
                                animation: 'dropdownSlide 0.2s ease forwards',
                                zIndex: 100,
                            }}
                        >
                            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${isDark ? '#374151' : '#F3F4F6'}` }}>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold" style={{ color: isDark ? '#F9FAFB' : '#111827' }}>Bildirişlər</span>
                                    {notificationCount > 0 && (
                                        <span
                                            className="inline-flex items-center justify-center rounded-full text-white"
                                            style={{
                                                fontSize: 10,
                                                fontWeight: 700,
                                                minWidth: 18,
                                                height: 18,
                                                padding: '0 5px',
                                                backgroundColor: '#EF4444',
                                            }}
                                        >
                                            {notificationCount > 99 ? '99+' : notificationCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="overflow-y-auto" style={{ maxHeight: 300 }}>
                                {recentNotifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8">
                                        <span className="material-symbols-outlined text-3xl" style={{ color: isDark ? '#4B5563' : '#D1D5DB' }}>notifications_off</span>
                                        <p className="text-xs mt-2" style={{ color: isDark ? '#6B7280' : '#9CA3AF' }}>Bildiriş yoxdur</p>
                                    </div>
                                ) : (
                                    recentNotifications.map((notif) => {
                                        const iconConfig = getNotificationIcon(notif.message);
                                        return (
                                            <button
                                                key={notif.id}
                                                className="w-full flex items-start gap-3 px-5 py-3 text-left"
                                                style={{
                                                    background: !notif.isRead
                                                        ? (isDark ? 'rgba(59,130,246,0.05)' : 'rgba(59,130,246,0.03)')
                                                        : 'transparent',
                                                    borderBottom: `1px solid ${isDark ? '#374151' : '#F9FAFB'}`,
                                                    transition: 'background 0.15s ease',
                                                }}
                                                onClick={() => {
                                                    markAsRead(notif.id);
                                                    setShowNotifDropdown(false);
                                                    navigate('/notifications');
                                                }}
                                                onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)')}
                                                onMouseLeave={(e) => (e.currentTarget.style.background = !notif.isRead ? (isDark ? 'rgba(59,130,246,0.05)' : 'rgba(59,130,246,0.03)') : 'transparent')}
                                            >
                                                <div
                                                    className="shrink-0 flex items-center justify-center rounded-full"
                                                    style={{
                                                        width: 32,
                                                        height: 32,
                                                        backgroundColor: iconConfig.bgColor,
                                                        color: iconConfig.textColor,
                                                        marginTop: 2
                                                    }}
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">
                                                        {iconConfig.icon}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs leading-relaxed" style={{ color: isDark ? '#E5E7EB' : '#374151', fontWeight: !notif.isRead ? 600 : 400 }}>
                                                        {notif.message}
                                                    </p>
                                                    <p className="text-[10px] mt-1" style={{ color: '#9CA3AF' }}>
                                                        {formatRelativeTime(notif.createdAt)}
                                                    </p>
                                                </div>
                                                {!notif.isRead && (
                                                    <div
                                                        className="shrink-0 rounded-full bg-blue-500"
                                                        style={{ width: 6, height: 6, marginTop: 8 }}
                                                    />
                                                )}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                            <div style={{ borderTop: `1px solid ${isDark ? '#374151' : '#F3F4F6'}` }}>
                                <Link
                                    to="/notifications"
                                    className="flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-medium"
                                    style={{ color: '#3B82F6', transition: 'background 0.15s ease' }}
                                    onClick={() => setShowNotifDropdown(false)}
                                >
                                    Hamısına bax
                                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* Separator */}
                <Separator isDark={isDark} />

                {/* Help Icon */}
                <div ref={helpRef} className="relative">
                    <button
                        onClick={() => { setShowHelpDropdown(!showHelpDropdown); setShowNotifDropdown(false); setShowUserDropdown(false); }}
                        onMouseEnter={() => setHelpHovered(true)}
                        onMouseLeave={() => setHelpHovered(false)}
                        className="flex items-center justify-center rounded-full"
                        style={{
                            width: 40,
                            height: 40,
                            background: helpHovered
                                ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)')
                                : 'transparent',
                            transition: 'background 0.2s ease',
                        }}
                    >
                        <span className="material-symbols-outlined text-[22px]" style={{ color: '#6B7280' }}>help</span>
                    </button>

                    {/* Help Dropdown */}
                    {showHelpDropdown && (
                        <div
                            className="absolute right-0 top-full mt-2 rounded-xl border overflow-hidden"
                            style={{
                                width: 200,
                                background: isDark ? '#1F2937' : '#FFFFFF',
                                borderColor: isDark ? '#374151' : '#E5E7EB',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                                animation: 'dropdownSlide 0.2s ease forwards',
                                zIndex: 100,
                            }}
                        >
                            {[
                                { icon: 'keyboard', label: 'Klaviatura qısayolları' },
                                { icon: 'description', label: 'Sənədlər' },
                                { icon: 'support_agent', label: 'Dəstək' },
                            ].map((item, i) => (
                                <button
                                    key={i}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm"
                                    style={{
                                        color: isDark ? '#D1D5DB' : '#374151',
                                        transition: 'background 0.15s ease',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                    onClick={() => setShowHelpDropdown(false)}
                                >
                                    <span className="material-symbols-outlined text-[18px]" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>{item.icon}</span>
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Separator */}
                <Separator isDark={isDark} />

                {/* User Avatar */}
                <div ref={userRef} className="relative">
                    <button
                        onClick={() => { setShowUserDropdown(!showUserDropdown); setShowNotifDropdown(false); setShowHelpDropdown(false); }}
                        onMouseEnter={() => setAvatarHovered(true)}
                        onMouseLeave={() => setAvatarHovered(false)}
                        className="flex items-center justify-center rounded-full"
                        style={{
                            width: 40,
                            height: 40,
                            background: avatarHovered ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') : 'transparent',
                            transition: 'background 0.2s ease',
                        }}
                    >
                        <div
                            className="rounded-full bg-center bg-no-repeat bg-cover bg-gray-200"
                            style={{
                                width: 32,
                                height: 32,
                                backgroundImage: userAvatar
                                    ? `url("${userAvatar}")`
                                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                border: `2px solid ${ringColor}`,
                            }}
                        />
                    </button>

                    {/* User Dropdown */}
                    {showUserDropdown && (
                        <div
                            className="absolute right-0 top-full mt-2 rounded-xl border overflow-hidden"
                            style={{
                                width: 240,
                                background: isDark ? '#1F2937' : '#FFFFFF',
                                borderColor: isDark ? '#374151' : '#E5E7EB',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                                animation: 'dropdownSlide 0.2s ease forwards',
                                zIndex: 100,
                            }}
                        >
                            {/* Profile card */}
                            <div className="px-4 py-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${isDark ? '#374151' : '#F3F4F6'}` }}>
                                <div
                                    className="rounded-full bg-center bg-no-repeat bg-cover bg-gray-200 shrink-0"
                                    style={{
                                        width: 40,
                                        height: 40,
                                        backgroundImage: userAvatar
                                            ? `url("${userAvatar}")`
                                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        border: `2px solid ${ringColor}`,
                                    }}
                                />
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold truncate" style={{ color: isDark ? '#F9FAFB' : '#111827' }}>{userName}</p>
                                    {userEmail && <p className="text-xs truncate" style={{ color: '#9CA3AF' }}>{userEmail}</p>}
                                    <span
                                        className="inline-flex items-center mt-1"
                                        style={{
                                            fontSize: 10,
                                            fontWeight: 500,
                                            padding: '1px 8px',
                                            borderRadius: 10,
                                            backgroundColor: roleLower === 'admin'
                                                ? 'rgba(212,160,23,0.15)' : roleLower === 'manager'
                                                    ? 'rgba(59,130,246,0.15)' : 'rgba(16,185,129,0.15)',
                                            color: ringColor,
                                        }}
                                    >
                                        {userRole}
                                    </span>
                                </div>
                            </div>

                            {/* Menu items */}
                            <div className="py-1">
                                {[
                                    { icon: 'person', label: 'Profil', path: '/settings' },
                                    { icon: 'settings', label: 'Tənzimləmələr', path: '/settings' },
                                    { icon: 'analytics', label: 'Performansım', path: '/performance' },
                                ].map((item, i) => (
                                    <button
                                        key={i}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm"
                                        style={{
                                            color: isDark ? '#D1D5DB' : '#374151',
                                            transition: 'background 0.15s ease',
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)')}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                        onClick={() => { setShowUserDropdown(false); navigate(item.path); }}
                                    >
                                        <span className="material-symbols-outlined text-[18px]" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>{item.icon}</span>
                                        {item.label}
                                    </button>
                                ))}
                            </div>

                            {/* Logout */}
                            <div style={{ borderTop: `1px solid ${isDark ? '#374151' : '#F3F4F6'}` }}>
                                <button
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm"
                                    style={{
                                        color: '#EF4444',
                                        transition: 'background 0.15s ease',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.05)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                    onClick={handleLogout}
                                >
                                    <span className="material-symbols-outlined text-[18px]">logout</span>
                                    Çıxış
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

// Separator component
const Separator: React.FC<{ isDark: boolean }> = ({ isDark }) => (
    <div
        style={{
            width: 1,
            height: 20,
            background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
            margin: '0 8px',
        }}
    />
);

export default Header;
