import React from 'react';
import { useNotifications } from '../context';

const NotificationToast: React.FC = () => {
    const { toasts, dismissToast, dismissAllToasts } = useNotifications();

    if (toasts.length === 0) return null;

    const handleViewTask = (taskId: number | undefined, toastId: number) => {
        dismissToast(toastId);
        if (taskId) {
            window.location.href = `/tasks/${taskId}`;
        } else {
            window.location.href = '/notifications';
        }
    };

    const handleViewAll = () => {
        dismissAllToasts();
        window.location.href = '/notifications';
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-3 max-h-[80vh] overflow-visible pointer-events-auto">
            {/* Show "View All" button when multiple toasts */}
            {toasts.length > 1 && (
                <div className="flex justify-center animate-slide-up">
                    <button
                        onClick={handleViewAll}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full text-sm font-medium shadow-lg hover:bg-primary/90 transition-all hover:scale-105"
                    >
                        <span className="material-symbols-outlined text-[16px]">notifications</span>
                        {toasts.length} yeni bildiriş
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                </div>
            )}

            {/* Toast stack - show max 3 at a time */}
            {toasts.slice(0, 3).map((toast, index) => (
                <div
                    key={toast.id}
                    className="animate-slide-up"
                    style={{
                        animationDelay: `${index * 50}ms`,
                        opacity: 1 - (index * 0.1),
                        transform: `scale(${1 - (index * 0.02)})`,
                    }}
                >
                    <div className="flex items-start gap-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 max-w-sm backdrop-blur-sm">
                        {/* Icon with pulse animation */}
                        <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center relative ${toast.type === 'success' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                            toast.type === 'error' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                                'bg-primary/10 text-primary dark:bg-primary/20'
                            }`}>
                            <span className={`material-symbols-outlined ${toast.type ? '' : 'animate-bounce'}`}>
                                {toast.type === 'success' ? 'check_circle' :
                                    toast.type === 'error' ? 'error' :
                                        'notifications_active'}
                            </span>
                            {/* Pulse ring only for default/info notifications */}
                            {!toast.type && (
                                <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></span>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                                <span className={`inline-block w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-green-500' :
                                    toast.type === 'error' ? 'bg-red-500' :
                                        'bg-primary animate-pulse'
                                    }`}></span>
                                {toast.type === 'success' ? 'Uğurlu' :
                                    toast.type === 'error' ? 'Xəta' :
                                        'Yeni Bildiriş'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                                {toast.message}
                            </p>
                            <button
                                onClick={() => handleViewTask(toast.taskId, toast.id)}
                                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline mt-2 transition-all hover:gap-2"
                            >
                                {toast.taskId ? 'Tapşırığa bax' : 'Hamısına bax'}
                                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                            </button>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={() => dismissToast(toast.id)}
                            className="shrink-0 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all hover:rotate-90"
                        >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                    </div>
                </div>
            ))}

            {/* Hidden toasts indicator */}
            {toasts.length > 3 && (
                <div className="text-center animate-slide-up">
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                        +{toasts.length - 3} daha çox bildiriş
                    </span>
                </div>
            )}
        </div>
    );
};

export default NotificationToast;
