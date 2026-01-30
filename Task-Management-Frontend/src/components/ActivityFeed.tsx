import React from 'react';
import type { NotificationResponse } from '../dto';

interface ActivityFeedProps {
    notifications: NotificationResponse[];
    onViewAll?: () => void;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ notifications, onViewAll }) => {
    const formatTimeAgo = (dateStr: string): string => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'İndi';
        if (diffMins < 60) return `${diffMins} dəq əvvəl`;
        if (diffHours < 24) return `${diffHours} saat əvvəl`;
        return `${diffDays} gün əvvəl`;
    };

    const getActivityIcon = (message: string): { icon: string; useAvatar: boolean } => {
        const lowerMessage = message.toLowerCase();
        if (lowerMessage.includes('assigned') || lowerMessage.includes('task')) {
            return { icon: 'group_add', useAvatar: false };
        }
        if (lowerMessage.includes('comment')) {
            return { icon: 'chat', useAvatar: true };
        }
        if (lowerMessage.includes('file') || lowerMessage.includes('upload')) {
            return { icon: 'upload_file', useAvatar: true };
        }
        if (lowerMessage.includes('complete')) {
            return { icon: 'check_circle', useAvatar: true };
        }
        return { icon: 'notifications', useAvatar: false };
    };

    return (
        <div className="rounded-xl border border-[#e5e7eb] dark:border-gray-700 bg-white dark:bg-[#1a202c] p-6 shadow-sm h-full max-h-[500px] lg:max-h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[#111318] dark:text-white">Son Fəaliyyətlər</h3>
                <button
                    onClick={onViewAll}
                    className="text-xs font-medium text-primary hover:underline"
                >
                    Hamısına bax
                </button>
            </div>

            <div className="flex flex-col gap-5 overflow-y-auto pr-2">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">
                            notifications_off
                        </span>
                        <p className="text-sm text-[#636f88] dark:text-gray-400">Son fəaliyyət yoxdur</p>
                    </div>
                ) : (
                    notifications.slice(0, 5).map((notification) => {
                        const { icon, useAvatar } = getActivityIcon(notification.message);
                        return (
                            <div key={notification.id} className="flex gap-3">
                                {useAvatar ? (
                                    <div
                                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 shrink-0"
                                        style={{
                                            backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        }}
                                    ></div>
                                ) : (
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        <span className="material-symbols-outlined text-[20px]">{icon}</span>
                                    </div>
                                )}
                                <div className="flex flex-col gap-0.5">
                                    <p className="text-sm font-normal text-[#111318] dark:text-white">
                                        {notification.message}
                                    </p>
                                    <span className="text-xs text-[#636f88] dark:text-gray-500">
                                        {formatTimeAgo(notification.createdAt)}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ActivityFeed;
