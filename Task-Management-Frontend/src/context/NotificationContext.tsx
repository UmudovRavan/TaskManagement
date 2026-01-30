import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { signalRService } from '../services';
import { notificationService, authService } from '../api';
import type { NotificationResponse } from '../dto';

interface NotificationContextType {
    notifications: NotificationResponse[];
    unreadCount: number;
    showToast: boolean;
    toastMessage: string;
    addNotification: (notification: NotificationResponse) => void;
    markAsRead: (id: number) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    refreshNotifications: () => Promise<void>;
    dismissToast: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
};

interface NotificationProviderProps {
    children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Track if SignalR is initialized (React StrictMode protection)
    const signalRInitializedRef = useRef(false);
    const isUnmountedRef = useRef(false);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    // Load initial notifications
    const refreshNotifications = useCallback(async () => {
        if (isUnmountedRef.current) return;

        try {
            const data = await notificationService.getMyNotifications();

            if (isUnmountedRef.current) return;

            const sorted = data.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setNotifications(sorted);
        } catch (error) {
            console.error('[NotificationContext] Failed to load notifications:', error);
        }
    }, []);

    // Add new notification (from SignalR)
    const addNotification = useCallback((notification: NotificationResponse) => {
        if (isUnmountedRef.current) return;

        setNotifications(prev => {
            // Check if notification already exists
            if (prev.some(n => n.id === notification.id)) {
                return prev;
            }
            return [notification, ...prev];
        });
    }, []);

    // Mark single notification as read
    const markAsRead = useCallback(async (id: number) => {
        try {
            await notificationService.markAsRead(id);

            if (isUnmountedRef.current) return;

            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
        } catch (error) {
            console.error('[NotificationContext] Failed to mark notification as read:', error);
        }
    }, []);

    // Mark all as read
    const markAllAsRead = useCallback(async () => {
        try {
            const unreadNotifications = notifications.filter(n => !n.isRead);
            await Promise.all(
                unreadNotifications.map(n => notificationService.markAsRead(n.id))
            );

            if (isUnmountedRef.current) return;

            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('[NotificationContext] Failed to mark all as read:', error);
        }
    }, [notifications]);

    // Show toast notification
    const showToastNotification = useCallback((message: string) => {
        if (isUnmountedRef.current) return;

        // Clear any existing timeout
        if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current);
        }

        setToastMessage(message);
        setShowToast(true);

        // Auto-dismiss after 5 seconds
        toastTimeoutRef.current = setTimeout(() => {
            if (!isUnmountedRef.current) {
                setShowToast(false);
            }
        }, 5000);
    }, []);

    // Dismiss toast
    const dismissToast = useCallback(() => {
        setShowToast(false);
        if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current);
            toastTimeoutRef.current = null;
        }
    }, []);

    /**
     * Initialize SignalR connection and load notifications
     * React StrictMode safe implementation
     */
    useEffect(() => {
        // Mark as mounted
        isUnmountedRef.current = false;

        const token = authService.getToken();
        if (!token) {
            console.log('[NotificationContext] No auth token, skipping initialization');
            return;
        }

        // Prevent double initialization in StrictMode
        if (signalRInitializedRef.current) {
            console.log('[NotificationContext] SignalR already initialized, skipping');
            return;
        }

        console.log('[NotificationContext] Initializing...');
        signalRInitializedRef.current = true;

        // Load initial notifications
        refreshNotifications();

        // Subscribe to SignalR notifications BEFORE starting connection
        const unsubscribe = signalRService.subscribe('ReceiveNotification', (payload: string) => {
            if (isUnmountedRef.current) return;

            try {
                console.log('[NotificationContext] 🔔 New notification received:', payload);

                // Parse JSON payload from backend
                let message = payload;
                let taskId: number | undefined;

                try {
                    const parsed = JSON.parse(payload);
                    message = parsed.message || payload;
                    taskId = parsed.taskId;
                } catch {
                    // If not JSON, use as plain message
                    message = payload;
                }

                // Create a temporary notification object
                const newNotification: NotificationResponse = {
                    id: Date.now(), // Temporary ID
                    userId: '',
                    message: message,
                    isRead: false,
                    createdAt: new Date().toISOString(),
                    relatedTaskId: taskId,
                };

                addNotification(newNotification);
                showToastNotification(message);

                // Refresh to get the actual notification from server (with debounce)
                setTimeout(() => {
                    if (!isUnmountedRef.current) {
                        refreshNotifications().catch(() => {
                            // Silently ignore refresh errors
                        });
                    }
                }, 500);
            } catch (error) {
                console.error('[NotificationContext] Error handling notification:', error);
            }
        });

        // Start SignalR connection (safe to call multiple times)
        signalRService.start().catch(error => {
            console.error('[NotificationContext] Failed to start SignalR:', error);
        });

        // Cleanup function
        return () => {
            console.log('[NotificationContext] Cleanup started');
            isUnmountedRef.current = true;

            // Clear toast timeout
            if (toastTimeoutRef.current) {
                clearTimeout(toastTimeoutRef.current);
                toastTimeoutRef.current = null;
            }

            // Unsubscribe from SignalR events
            unsubscribe();

            // DO NOT stop SignalR connection here!
            // SignalR is a singleton and may be used by other components
            // Only unsubscribe from events
            console.log('[NotificationContext] Cleanup completed');
        };
    }, []); // Empty dependency array - run once on mount

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            showToast,
            toastMessage,
            addNotification,
            markAsRead,
            markAllAsRead,
            refreshNotifications,
            dismissToast,
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export default NotificationProvider;
