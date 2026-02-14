import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { authService } from '../api';

interface SidebarProps {
    userName?: string;
    userRole?: string;
    userAvatar?: string;
    userEmail?: string;
    workGroupName?: string;
    notificationCount?: number;
    activeTaskCount?: number;
}

const Sidebar: React.FC<SidebarProps> = ({
    userName = 'User',
    userRole = 'Employee',
    userAvatar,
    userEmail,
    workGroupName,
    notificationCount = 0,
    activeTaskCount = 0,
}) => {
    const location = useLocation();

    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebarCollapsed');
        if (saved !== null) {
            return saved === 'true';
        }
        return typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024;
    });
    const [isHoveringToggle, setIsHoveringToggle] = useState(false);
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    const [profileTooltip, setProfileTooltip] = useState(false);
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);
    const profileTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Mobile/tablet overlay
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
    // Force re-render on theme change
    const [, forceUpdate] = useState({});

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Listen for theme changes on html element
    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    forceUpdate({});
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        return () => observer.disconnect();
    }, []);

    const isTablet = windowWidth >= 768 && windowWidth < 1024;
    const isMobile = windowWidth < 768;

    // Persist collapsed state
    useEffect(() => {
        localStorage.setItem('sidebarCollapsed', String(isCollapsed));
    }, [isCollapsed]);



    const handleLogout = () => {
        authService.clearToken();
        window.location.href = '/login';
    };

    const roleLower = useMemo(() => userRole.toLowerCase(), [userRole]);

    const isManager = useMemo(() => {
        return roleLower === 'manager' || roleLower === 'admin';
    }, [roleLower]);

    const navItems = useMemo(() => {
        const baseItems = [
            { path: '/dashboard', icon: 'dashboard', label: 'İdarə Paneli' },
            { path: '/tasks', icon: 'check_box', label: 'Tapşırıqlarım', badge: activeTaskCount },
        ];

        if (isManager) {
            baseItems.push({ path: '/work-groups', icon: 'groups', label: 'İş Qrupları', badge: 0 });
        }

        baseItems.push(
            { path: '/performance', icon: 'analytics', label: 'Performans', badge: 0 },
            { path: '/leaderboard', icon: 'emoji_events', label: 'Liderlər Lövhəsi', badge: 0 },
            { path: '/notifications', icon: 'notifications', label: 'Bildirişlər', badge: notificationCount },
            { path: '/settings', icon: 'settings', label: 'Tənzimləmələr', badge: 0 }
        );

        return baseItems;
    }, [isManager, notificationCount, activeTaskCount]);

    const isActive = (path: string) => location.pathname === path;

    // Role-based ring color
    const ringColor = useMemo(() => {
        if (roleLower === 'admin') return { ring: '#D4A017', bg: 'rgba(212, 160, 23, 0.15)', text: '#D4A017', label: 'Admin' };
        if (roleLower === 'manager') return { ring: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)', text: '#3B82F6', label: 'Manager' };
        return { ring: '#10B981', bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981', label: 'Employee' };
    }, [roleLower]);

    // Tooltip handlers
    const showProfileTooltip = useCallback(() => {
        profileTimeoutRef.current = setTimeout(() => setProfileTooltip(true), 200);
    }, []);
    const hideProfileTooltip = useCallback(() => {
        if (profileTimeoutRef.current) clearTimeout(profileTimeoutRef.current);
        setProfileTooltip(false);
    }, []);

    const showItemTooltip = useCallback((path: string) => {
        if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
        tooltipTimeoutRef.current = setTimeout(() => setHoveredItem(path), 150);
    }, []);
    const hideItemTooltip = useCallback(() => {
        if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
        setHoveredItem(null);
    }, []);

    useEffect(() => {
        return () => {
            if (profileTimeoutRef.current) clearTimeout(profileTimeoutRef.current);
            if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
        };
    }, []);

    const sidebarWidth = isCollapsed ? 72 : 256;

    // Close mobile overlay on navigation
    useEffect(() => {
        setIsMobileOpen(false);
    }, [location.pathname]);

    const formatBadge = (count: number) => {
        if (count > 99) return '99+';
        return String(count);
    };

    // Render sidebar content
    const renderContent = () => (
        <div className="flex flex-col h-full justify-between">
            {/* Profile Section */}
            <div>
                <div
                    className="relative px-4 py-5"
                    onMouseEnter={showProfileTooltip}
                    onMouseLeave={hideProfileTooltip}
                >
                    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                        {/* Avatar with role ring + online dot */}
                        <div className="relative shrink-0">
                            <div
                                className="rounded-full bg-center bg-no-repeat bg-cover bg-gray-200"
                                style={{
                                    backgroundImage: userAvatar
                                        ? `url("${userAvatar}")`
                                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    width: isCollapsed ? 40 : 44,
                                    height: isCollapsed ? 40 : 44,
                                    border: `2px solid ${ringColor.ring}`,
                                    transition: 'all 0.3s ease',
                                }}
                            />
                            {/* Online indicator */}
                            <div
                                className="absolute bottom-0 right-0 rounded-full bg-emerald-500"
                                style={{
                                    width: 8,
                                    height: 8,
                                    border: '2px solid var(--sidebar-bg, #ffffff)',
                                }}
                            />
                        </div>

                        {/* Name + Role Badge */}
                        {!isCollapsed && (
                            <div
                                className="flex flex-col overflow-hidden"
                                style={{
                                    opacity: isCollapsed ? 0 : 1,
                                    transition: 'opacity 0.2s ease',
                                }}
                            >
                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate leading-tight">
                                    {userName}
                                </span>
                                <span
                                    className="mt-1 inline-flex items-center self-start truncate"
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 500,
                                        padding: '2px 10px',
                                        borderRadius: 12,
                                        backgroundColor: ringColor.bg,
                                        color: ringColor.text,
                                    }}
                                >
                                    {ringColor.label}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Profile Tooltip */}
                    {profileTooltip && (
                        <div
                            className="absolute z-[100] left-full ml-3 top-1/2 -translate-y-1/2 pointer-events-none"
                            style={{ animation: 'tooltipFadeIn 0.15s ease forwards' }}
                        >
                            <div
                                className="rounded-xl px-4 py-3 shadow-lg border whitespace-nowrap"
                                style={{
                                    background: 'var(--tooltip-bg)',
                                    borderColor: 'var(--tooltip-border)',
                                    minWidth: isCollapsed ? 160 : 200,
                                }}
                            >
                                {isCollapsed && (
                                    <>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{userName}</p>
                                        <span
                                            className="inline-flex items-center mt-1"
                                            style={{
                                                fontSize: 11,
                                                fontWeight: 500,
                                                padding: '2px 10px',
                                                borderRadius: 12,
                                                backgroundColor: ringColor.bg,
                                                color: ringColor.text,
                                            }}
                                        >
                                            {ringColor.label}
                                        </span>
                                    </>
                                )}
                                {!isCollapsed && (
                                    <>
                                        {userEmail && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[14px]">mail</span>
                                                {userEmail}
                                            </p>
                                        )}
                                        {workGroupName && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-1">
                                                <span className="material-symbols-outlined text-[14px]">groups</span>
                                                {workGroupName}
                                            </p>
                                        )}
                                        {!userEmail && !workGroupName && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{userName} — {ringColor.label}</p>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 px-2 mt-2 space-y-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                    {navItems.map((item) => {
                        const active = isActive(item.path);
                        const isNotificationItem = item.path === '/notifications';
                        const badgeCount = item.badge || 0;
                        const showBadge = badgeCount > 0;

                        return (
                            <div key={item.path} className="relative">
                                <Link
                                    to={item.path}
                                    className="relative flex items-center rounded-xl overflow-hidden group"
                                    style={{
                                        padding: isCollapsed ? '10px 0' : '10px 12px',
                                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                                        gap: isCollapsed ? 0 : 12,
                                        transition: 'all 0.25s ease',
                                        background: active
                                            ? undefined
                                            : 'transparent',
                                        color: active ? '#3B82F6' : undefined,
                                        transform: !active && hoveredItem === item.path && !isCollapsed ? 'translateX(4px)' : 'translateX(0)',
                                    }}
                                    onMouseEnter={() => {
                                        if (isCollapsed) showItemTooltip(item.path);
                                    }}
                                    onMouseLeave={hideItemTooltip}
                                >
                                    {/* Active gradient background */}
                                    {active && (
                                        <div
                                            className="absolute inset-0 pointer-events-none"
                                            style={{
                                                background: document.documentElement.classList.contains('dark')
                                                    ? 'linear-gradient(to right, rgba(59, 130, 246, 0.25), rgba(59, 130, 246, 0.05))'
                                                    : 'linear-gradient(to right, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.03))',
                                                borderRadius: 12,
                                            }}
                                        />
                                    )}

                                    {/* Active indicator bar */}
                                    {active && (
                                        <div
                                            className="absolute left-0 top-1/2 -translate-y-1/2"
                                            style={{
                                                width: 3,
                                                height: 24,
                                                backgroundColor: '#3B82F6',
                                                borderRadius: '0 4px 4px 0',
                                            }}
                                        />
                                    )}

                                    {/* Hover background for non-active */}
                                    {!active && (
                                        <div
                                            className="absolute inset-0 pointer-events-none rounded-xl"
                                            style={{
                                                background: hoveredItem === item.path
                                                    ? (document.documentElement.classList.contains('dark')
                                                        ? 'rgba(255, 255, 255, 0.06)'
                                                        : 'rgba(0, 0, 0, 0.04)')
                                                    : 'transparent',
                                                transition: 'background 0.2s ease',
                                            }}
                                        />
                                    )}

                                    {/* Icon */}
                                    <div className="relative z-10 shrink-0">
                                        <span
                                            className="material-symbols-outlined text-[22px]"
                                            style={{
                                                color: active ? '#3B82F6' : (hoveredItem === item.path
                                                    ? (document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151')
                                                    : (document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#6B7280')),
                                                fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
                                                transition: 'color 0.2s ease, font-variation-settings 0.2s ease',
                                            }}
                                        >
                                            {item.icon}
                                        </span>

                                        {/* Collapsed badge dot */}
                                        {isCollapsed && showBadge && (
                                            <div
                                                className="absolute -top-1 -right-1 rounded-full"
                                                style={{
                                                    width: 6,
                                                    height: 6,
                                                    backgroundColor: isNotificationItem ? '#EF4444' : '#6B7280',
                                                }}
                                            />
                                        )}
                                    </div>

                                    {/* Label */}
                                    {!isCollapsed && (
                                        <span
                                            className="relative z-10 text-sm font-medium truncate flex-1"
                                            style={{
                                                color: active ? '#3B82F6' : (document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#6B7280'),
                                                transition: 'color 0.2s ease',
                                            }}
                                        >
                                            {item.label}
                                        </span>
                                    )}

                                    {/* Badge for expanded */}
                                    {!isCollapsed && showBadge && (
                                        <span
                                            className="relative z-10 inline-flex items-center justify-center shrink-0"
                                            style={{
                                                minWidth: 20,
                                                height: 20,
                                                borderRadius: '50%',
                                                fontSize: 11,
                                                fontWeight: 600,
                                                color: isNotificationItem ? '#FFFFFF' : (document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151'),
                                                backgroundColor: isNotificationItem ? '#EF4444' : (document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
                                                padding: '0 5px',
                                            }}
                                        >
                                            {formatBadge(badgeCount)}
                                        </span>
                                    )}
                                </Link>

                                {/* Collapsed tooltip */}
                                {isCollapsed && hoveredItem === item.path && (
                                    <div
                                        className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-[100] pointer-events-none"
                                        style={{ animation: 'tooltipFadeIn 0.15s ease forwards' }}
                                    >
                                        <div
                                            className="rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap shadow-lg"
                                            style={{
                                                background: document.documentElement.classList.contains('dark') ? '#374151' : '#1F2937',
                                                color: '#FFFFFF',
                                            }}
                                        >
                                            {item.label}
                                            {showBadge && (
                                                <span className="ml-2 opacity-75">({formatBadge(badgeCount)})</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom: Separator + Logout */}
            <div className="mt-auto">
                {/* Separator */}
                <div className="mx-4 mb-3" style={{ height: 1, background: document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }} />

                {/* Logout Button */}
                <div className="px-2 pb-4 relative">
                    <button
                        onClick={handleLogout}
                        className="relative flex w-full items-center rounded-xl overflow-hidden group"
                        style={{
                            padding: isCollapsed ? '10px 0' : '10px 12px',
                            justifyContent: isCollapsed ? 'center' : 'flex-start',
                            gap: isCollapsed ? 0 : 12,
                            color: '#6B7280',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={() => {
                            if (isCollapsed) showItemTooltip('logout');
                        }}
                        onMouseLeave={hideItemTooltip}
                    >
                        {/* Hover background */}
                        <div
                            className="absolute inset-0 pointer-events-none rounded-xl"
                            style={{
                                background: hoveredItem === 'logout'
                                    ? 'rgba(239, 68, 68, 0.08)'
                                    : 'transparent',
                                transition: 'background 0.2s ease',
                            }}
                        />
                        <span
                            className="material-symbols-outlined text-[22px] relative z-10"
                            style={{
                                color: hoveredItem === 'logout' ? '#EF4444' : '#6B7280',
                                transition: 'color 0.2s ease',
                            }}
                            onMouseEnter={() => {
                                setHoveredItem('logout');
                                if (isCollapsed) showItemTooltip('logout');
                            }}
                            onMouseLeave={() => {
                                setHoveredItem(null);
                                hideItemTooltip();
                            }}
                        >
                            logout
                        </span>
                        {!isCollapsed && (
                            <span
                                className="relative z-10 text-sm font-medium"
                                style={{
                                    color: hoveredItem === 'logout' ? '#EF4444' : '#6B7280',
                                    transition: 'color 0.2s ease',
                                }}
                            >
                                Çıxış
                            </span>
                        )}
                    </button>

                    {/* Collapsed logout tooltip */}
                    {isCollapsed && hoveredItem === 'logout' && (
                        <div
                            className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-[100] pointer-events-none"
                            style={{ animation: 'tooltipFadeIn 0.15s ease forwards' }}
                        >
                            <div
                                className="rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap shadow-lg"
                                style={{
                                    background: document.documentElement.classList.contains('dark') ? '#374151' : '#1F2937',
                                    color: '#FFFFFF',
                                }}
                            >
                                Çıxış
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // Mobile: hamburger opens overlay sidebar
    if (isMobile) {
        return (
            <>
                {isMobileOpen && (
                    <>
                        {/* Overlay */}
                        <div
                            className="fixed inset-0 z-[60] bg-black/30"
                            style={{ animation: 'overlayFadeIn 0.2s ease forwards' }}
                            onClick={() => setIsMobileOpen(false)}
                        />
                        {/* Sidebar */}
                        <aside
                            className="fixed left-0 top-0 bottom-0 z-[70] flex flex-col h-screen"
                            style={{
                                width: 256,
                                background: document.documentElement.classList.contains('dark') ? '#111827' : 'rgba(255,255,255,0.85)',
                                backdropFilter: !document.documentElement.classList.contains('dark') ? 'blur(12px)' : undefined,
                                WebkitBackdropFilter: !document.documentElement.classList.contains('dark') ? 'blur(12px)' : undefined,
                                boxShadow: document.documentElement.classList.contains('dark') ? '4px 0 12px rgba(0,0,0,0.2)' : '4px 0 12px rgba(0,0,0,0.03)',
                                animation: 'sidebarSlideIn 0.25s ease forwards',
                                ['--sidebar-bg' as string]: document.documentElement.classList.contains('dark') ? '#111827' : '#ffffff',
                                ['--tooltip-bg' as string]: document.documentElement.classList.contains('dark') ? '#1F2937' : '#ffffff',
                                ['--tooltip-border' as string]: document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB',
                                transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
                            }}
                        >
                            {renderContent()}
                        </aside>
                    </>
                )}
            </>
        );
    }

    // Tablet: collapsed by default, expand as overlay
    if (isTablet && !isCollapsed) {
        return (
            <>
                {/* Always show collapsed sidebar */}
                <aside
                    className="hidden md:flex flex-col h-screen shrink-0 relative z-[40]"
                    style={{
                        width: 72,
                        background: document.documentElement.classList.contains('dark') ? '#111827' : 'rgba(255,255,255,0.85)',
                        backdropFilter: !document.documentElement.classList.contains('dark') ? 'blur(12px)' : undefined,
                        WebkitBackdropFilter: !document.documentElement.classList.contains('dark') ? 'blur(12px)' : undefined,
                        boxShadow: document.documentElement.classList.contains('dark') ? '4px 0 12px rgba(0,0,0,0.2)' : '4px 0 12px rgba(0,0,0,0.03)',
                        transition: 'width 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
                        ['--sidebar-bg' as string]: document.documentElement.classList.contains('dark') ? '#111827' : '#ffffff',
                        ['--tooltip-bg' as string]: document.documentElement.classList.contains('dark') ? '#1F2937' : '#ffffff',
                        ['--tooltip-border' as string]: document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB',
                    }}
                >
                    {renderContent()}
                </aside>
                {/* Overlay expanded sidebar */}
                <div
                    className="fixed inset-0 z-[60] bg-black/30"
                    onClick={() => setIsCollapsed(true)}
                />
                <aside
                    className="fixed left-0 top-0 bottom-0 z-[70] flex flex-col h-screen"
                    style={{
                        width: 256,
                        background: document.documentElement.classList.contains('dark') ? '#111827' : 'rgba(255,255,255,0.95)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        boxShadow: '4px 0 20px rgba(0,0,0,0.1)',
                        animation: 'sidebarSlideIn 0.25s ease forwards',
                        ['--sidebar-bg' as string]: document.documentElement.classList.contains('dark') ? '#111827' : '#ffffff',
                        ['--tooltip-bg' as string]: document.documentElement.classList.contains('dark') ? '#1F2937' : '#ffffff',
                        ['--tooltip-border' as string]: document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB',
                    }}
                >
                    {/* Toggle to collapse */}
                    <button
                        onClick={() => setIsCollapsed(true)}
                        className="absolute top-4 right-3 z-10 rounded-full p-1"
                        style={{
                            background: document.documentElement.classList.contains('dark') ? '#374151' : '#F3F4F6',
                        }}
                    >
                        <span className="material-symbols-outlined text-[18px] text-gray-500">close</span>
                    </button>
                    {renderContent()}
                </aside>
            </>
        );
    }

    // Desktop / Tablet collapsed
    return (
        <aside
            className="hidden md:flex flex-col h-screen shrink-0 relative"
            style={{
                width: sidebarWidth,
                background: document.documentElement.classList.contains('dark') ? '#111827' : 'rgba(255,255,255,0.85)',
                backdropFilter: !document.documentElement.classList.contains('dark') ? 'blur(12px)' : undefined,
                WebkitBackdropFilter: !document.documentElement.classList.contains('dark') ? 'blur(12px)' : undefined,
                boxShadow: document.documentElement.classList.contains('dark') ? '4px 0 12px rgba(0,0,0,0.2)' : '4px 0 12px rgba(0,0,0,0.03)',
                borderRight: `1px solid ${document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,

                ['--sidebar-bg' as string]: document.documentElement.classList.contains('dark') ? '#111827' : '#ffffff',
                transition: 'width 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
                zIndex: 40,
                ['--tooltip-bg' as string]: document.documentElement.classList.contains('dark') ? '#1F2937' : '#ffffff',
                ['--tooltip-border' as string]: document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB',
            }}
            onMouseEnter={() => setIsSidebarHovered(true)}
            onMouseLeave={() => { setIsSidebarHovered(false); setIsHoveringToggle(false); }}
        >
            {renderContent()}

            {/* Toggle Button — half-circle on sidebar edge, visible on hover */}
            <div
                className="absolute top-1/2 -translate-y-1/2"
                style={{
                    right: -12,
                    opacity: isSidebarHovered ? 1 : 0,
                    transition: 'opacity 0.2s ease',
                    zIndex: 50,
                }}
            >
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    onMouseEnter={() => setIsHoveringToggle(true)}
                    onMouseLeave={() => setIsHoveringToggle(false)}
                    style={{
                        width: 24,
                        height: 48,
                        borderRadius: '0 24px 24px 0',
                        border: `1px solid ${document.documentElement.classList.contains('dark') ? '#4B5563' : '#E5E7EB'}`,
                        borderLeft: 'none',
                        background: isHoveringToggle
                            ? (document.documentElement.classList.contains('dark') ? '#4B5563' : '#F3F4F6')
                            : (document.documentElement.classList.contains('dark') ? '#374151' : '#FFFFFF'),
                        boxShadow: '2px 0 8px rgba(0,0,0,0.08)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s ease',
                        padding: 0,
                    }}
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    <span
                        className="material-symbols-outlined"
                        style={{
                            fontSize: 14,
                            color: document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#6B7280',
                            transition: 'transform 0.3s ease',
                            transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
                        }}
                    >
                        chevron_right
                    </span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;

// Export the mobile open trigger for Header to use
export const useSidebarMobile = () => {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    return { isMobileOpen, setIsMobileOpen };
};
