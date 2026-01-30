import React from 'react';
import { useNotifications } from '../context';

const NotificationToast: React.FC = () => {
    const { showToast, toastMessage, dismissToast } = useNotifications();

    if (!showToast) return null;

    const handleViewAll = () => {
        dismissToast();
        window.location.href = '/notifications';
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
            <div className="flex items-start gap-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 max-w-sm">
                {/* Icon */}
                <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined">notifications_active</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                        New Notification
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                        {toastMessage}
                    </p>
                    <button
                        onClick={handleViewAll}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline mt-2"
                    >
                        View all
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </button>
                </div>

                {/* Close Button */}
                <button
                    onClick={dismissToast}
                    className="shrink-0 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
            </div>
        </div>
    );
};

export default NotificationToast;

