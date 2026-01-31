import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar, Header } from '../layout';
import { notificationService, authService } from '../api';
import type { NotificationResponse } from '../dto';
import { parseJwtToken, isTokenExpired } from '../utils';
import type { UserInfo } from '../utils';

type FilterTab = 'all' | 'unread' | 'mentions';

const Notifications: React.FC = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [activeTab, setActiveTab] = useState<FilterTab>('all');

    const displayName = useMemo(() => {
        if (!userInfo) return 'User';
        if (userInfo.userName) {
            return userInfo.userName.charAt(0).toUpperCase() + userInfo.userName.slice(1);
        }
        if (userInfo.email) {
            return userInfo.email.split('@')[0];
        }
        return 'User';
    }, [userInfo]);

    const userRole = useMemo(() => {
        if (!userInfo || !userInfo.roles.length) return 'Team Member';
        const role = userInfo.roles[0];
        return role.charAt(0).toUpperCase() + role.slice(1);
    }, [userInfo]);

    // Filter notifications based on active tab
    const filteredNotifications = useMemo(() => {
        switch (activeTab) {
            case 'unread':
                return notifications.filter(n => !n.isRead);
            case 'mentions':
                return notifications.filter(n =>
                    n.message.toLowerCase().includes('mention') ||
                    n.message.includes('@')
                );
            default:
                return notifications;
        }
    }, [notifications, activeTab]);

    // Group notifications by date
    const groupedNotifications = useMemo(() => {
        const groups: { [key: string]: NotificationResponse[] } = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        filteredNotifications.forEach(notification => {
            const date = new Date(notification.createdAt);
            date.setHours(0, 0, 0, 0);

            let groupKey: string;
            if (date.getTime() === today.getTime()) {
                groupKey = 'Bu gün';
            } else if (date.getTime() === yesterday.getTime()) {
                groupKey = 'Dünən';
            } else {
                groupKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            }

            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(notification);
        });

        return groups;
    }, [filteredNotifications]);

    const unreadCount = useMemo(() => {
        return notifications.filter(n => !n.isRead).length;
    }, [notifications]);

    useEffect(() => {
        const token = authService.getToken();

        if (!token || isTokenExpired(token)) {
            authService.clearToken();
            navigate('/login');
            return;
        }

        const parsedUser = parseJwtToken(token);
        if (parsedUser) {
            setUserInfo(parsedUser);
        }

        loadNotifications();
    }, [navigate]);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const data = await notificationService.getMyNotifications();
            // Sort by createdAt descending (newest first)
            const sorted = data.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setNotifications(sorted);
        } catch {
            console.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationClick = async (notification: NotificationResponse) => {
        // Debug: log notification data
        console.log('Notification clicked:', notification);
        console.log('TaskId:', notification.taskId, 'RelatedTaskId:', notification.relatedTaskId);

        // Mark as read if unread
        if (!notification.isRead) {
            try {
                await notificationService.markAsRead(notification.id);
                setNotifications(prev =>
                    prev.map(n =>
                        n.id === notification.id ? { ...n, isRead: true } : n
                    )
                );
            } catch {
                console.error('Failed to mark notification as read');
            }
        }

        // Determine notification type and navigate accordingly
        // Use taskId from backend (fallback to relatedTaskId for compatibility)
        const taskId = notification.taskId || notification.relatedTaskId;
        console.log('Navigating to taskId:', taskId);
        if (taskId) {
            navigate(`/tasks/${taskId}`);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const unreadNotifications = notifications.filter(n => !n.isRead);
            await Promise.all(
                unreadNotifications.map(n => notificationService.markAsRead(n.id))
            );
            setNotifications(prev =>
                prev.map(n => ({ ...n, isRead: true }))
            );
        } catch {
            console.error('Failed to mark all as read');
        }
    };

    const formatRelativeTime = useCallback((dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'İndi';
        if (diffMins < 60) return `${diffMins} dəq əvvəl`;
        if (diffHours < 24) return `${diffHours} saat əvvəl`;
        if (diffDays === 1) return 'Dünən';
        if (diffDays < 7) return `${diffDays} gün əvvəl`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }, []);

    // Check if notification is a mention type
    const isMentionNotification = (message: string) => {
        return message.toLowerCase().includes('mention') || message.includes('@');
    };

    // Check if notification is an assignment type
    const isAssignmentNotification = (message: string) => {
        return message.toLowerCase().includes('assign') ||
            message.toLowerCase().includes('təyin olundu');
    };

    // Check if notification is task accepted
    const isTaskAcceptedNotification = (message: string) => {
        return message.toLowerCase().includes('qəbul etdi') || message.toLowerCase().includes('accept');
    };

    // Check if notification is task rejected
    const isTaskRejectedNotification = (message: string) => {
        return message.toLowerCase().includes('rədd etdi') || message.toLowerCase().includes('reject');
    };

    // Get notification icon based on type
    const getNotificationIcon = (message: string) => {
        if (isTaskAcceptedNotification(message)) {
            return { icon: 'check_circle', bgColor: 'bg-green-100 dark:bg-green-900/30', textColor: 'text-green-600 dark:text-green-400' };
        }
        if (isTaskRejectedNotification(message)) {
            return { icon: 'cancel', bgColor: 'bg-red-100 dark:bg-red-900/30', textColor: 'text-red-600 dark:text-red-400' };
        }
        if (isMentionNotification(message)) {
            return { icon: 'alternate_email', bgColor: 'bg-blue-100 dark:bg-blue-900/30', textColor: 'text-blue-600 dark:text-blue-400' };
        }
        if (isAssignmentNotification(message)) {
            return { icon: 'assignment_ind', bgColor: 'bg-violet-100 dark:bg-violet-900/30', textColor: 'text-violet-600 dark:text-violet-400' };
        }
        return { icon: 'notifications', bgColor: 'bg-gray-100 dark:bg-gray-800', textColor: 'text-gray-600 dark:text-gray-400' };
    };

    if (loading) {
        return (
            <div className="flex h-screen w-full bg-background-light dark:bg-background-dark">
                <Sidebar userName={displayName} userRole={userRole} />
                <div className="flex flex-1 flex-col h-full overflow-hidden relative">
                    <Header notificationCount={0} />
                    <main className="flex-1 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm text-[#636f88]">Bildirişlər yüklənir...</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full bg-background-light dark:bg-background-dark text-[#111318] dark:text-white font-display overflow-hidden">
            <Sidebar userName={displayName} userRole={userRole} />

            <div className="flex flex-1 flex-col h-full overflow-hidden relative">
                <Header notificationCount={unreadCount} />

                <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark">
                    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 min-h-full flex flex-col">
                        {/* Page Heading */}
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Bildirişlər</h1>
                                <p className="text-slate-500 dark:text-slate-400 mt-1">Son fəaliyyətlər və tapşırıqlarla bağlı xəbərdar olun.</p>
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#181f2e] border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm"
                                >
                                    <span className="material-symbols-outlined text-[18px]">done_all</span>
                                    Hamısını oxunmuş kimi işarələ
                                </button>
                            )}
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 transition-all ${activeTab === 'all'
                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                                    : 'bg-white dark:bg-[#181f2e] border border-gray-200 dark:border-gray-700 text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                            >
                                <span className="text-sm font-medium">Hamısı</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('unread')}
                                className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 transition-all ${activeTab === 'unread'
                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                                    : 'bg-white dark:bg-[#181f2e] border border-gray-200 dark:border-gray-700 text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                            >
                                <span className="text-sm font-medium">Oxunmamış</span>
                                {unreadCount > 0 && (
                                    <span className="flex items-center justify-center bg-primary text-white text-[10px] font-bold h-4 min-w-[16px] px-1 rounded-full">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('mentions')}
                                className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 transition-all ${activeTab === 'mentions'
                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                                    : 'bg-white dark:bg-[#181f2e] border border-gray-200 dark:border-gray-700 text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                            >
                                <span className="text-sm font-medium">Sizdən bəhs edilənlər</span>
                            </button>
                        </div>

                        {/* Notifications List */}
                        {filteredNotifications.length > 0 ? (
                            <div className="flex flex-col gap-8 pb-12">
                                {Object.entries(groupedNotifications).map(([groupName, groupItems]) => (
                                    <div key={groupName} className="flex flex-col gap-3">
                                        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
                                            {groupName}
                                        </h3>
                                        <div className="bg-white dark:bg-[#181f2e] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
                                            {groupItems.map((notification) => (
                                                <div
                                                    key={notification.id}
                                                    onClick={() => handleNotificationClick(notification)}
                                                    className={`group relative flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${notification.isRead ? 'bg-white dark:bg-[#181f2e]' : ''
                                                        }`}
                                                >
                                                    {/* Unread Indicator */}
                                                    {!notification.isRead && (
                                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-primary"></div>
                                                    )}

                                                    {/* Icon */}
                                                    <div className="shrink-0 relative">
                                                        {(() => {
                                                            const iconConfig = getNotificationIcon(notification.message);
                                                            return (
                                                                <div className={`size-10 rounded-full ${iconConfig.bgColor} ${iconConfig.textColor} flex items-center justify-center`}>
                                                                    <span className="material-symbols-outlined">{iconConfig.icon}</span>
                                                                </div>
                                                            );
                                                        })()}
                                                        {!notification.isRead && (
                                                            <div className="absolute -top-1 -right-1 size-3 bg-primary rounded-full border-2 border-white dark:border-[#181f2e]"></div>
                                                        )}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0 pt-0.5">
                                                        <div className="flex justify-between items-start gap-4">
                                                            <div className="flex-1">
                                                                <p className={`text-sm leading-relaxed ${notification.isRead
                                                                    ? 'text-slate-600 dark:text-slate-300'
                                                                    : 'text-slate-900 dark:text-slate-100'
                                                                    }`}>
                                                                    {notification.message}
                                                                </p>

                                                                {/* Status badges for accepted/rejected */}
                                                                {isTaskAcceptedNotification(notification.message) && (
                                                                    <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                                                        <span className="material-symbols-outlined text-[14px]">check</span>
                                                                        Qəbul edildi
                                                                    </span>
                                                                )}
                                                                {isTaskRejectedNotification(notification.message) && (
                                                                    <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                                                                        <span className="material-symbols-outlined text-[14px]">close</span>
                                                                        Rədd edildi
                                                                    </span>
                                                                )}

                                                                {/* Action buttons for task assignment notifications */}
                                                                {isAssignmentNotification(notification.message) && (notification.taskId || notification.relatedTaskId) && (
                                                                    <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                navigate(`/tasks/${notification.taskId || notification.relatedTaskId}`);
                                                                            }}
                                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-primary text-white hover:bg-blue-600 transition-colors shadow-sm"
                                                                        >
                                                                            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                                                            Cavabla
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className="text-xs font-medium text-slate-400 whitespace-nowrap">
                                                                {formatRelativeTime(notification.createdAt)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Action Button */}
                                                    <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-gray-200 dark:hover:bg-gray-700">
                                                            <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                {/* Footer */}
                                <div className="flex items-center justify-center py-8 text-slate-400">
                                    <span className="text-xs">Bildirişlərin sonu</span>
                                </div>
                            </div>
                        ) : (
                            /* Empty State */
                            <div className="flex-1 flex flex-col items-center justify-center py-16">
                                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                                    <span className="material-symbols-outlined text-4xl text-gray-400">notifications_off</span>
                                </div>
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                    Hamısını oxudunuz 🎉
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-sm">
                                    {activeTab === 'unread'
                                        ? 'Oxunmamış bildiriş yoxdur. Əla iş!'
                                        : activeTab === 'mentions'
                                            ? 'Hələ ki, heç kim sizdən bəhs etməyib.'
                                            : 'Hal-hazırda göstəriləcək bildiriş yoxdur.'}
                                </p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Notifications;
