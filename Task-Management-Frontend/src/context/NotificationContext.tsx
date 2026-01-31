import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { signalRService } from '../services';
import { notificationService, authService } from '../api';
import type { NotificationResponse } from '../dto';

interface ToastItem {
    id: number;
    message: string;
    taskId?: number;
    type?: 'success' | 'error' | 'info';
}

interface NotificationContextType {
    notifications: NotificationResponse[];
    unreadCount: number;
    toasts: ToastItem[];
    addNotification: (notification: NotificationResponse) => void;
    markAsRead: (id: number) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    refreshNotifications: () => Promise<void>;
    dismissToast: (id: number) => void;
    dismissAllToasts: () => void;
    testToast: () => void; // Test function
    addToast: (message: string, taskId?: number, type?: 'success' | 'error' | 'info') => void;
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
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    // Keep track of toast timeouts
    const toastTimeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

    // Track component mount state
    const isUnmountedRef = useRef(false);

    // Track processed notifications to prevent duplicates
    const processedMessagesRef = useRef<Set<string>>(new Set());

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
            const exists = prev.some(n =>
                n.id === notification.id ||
                (n.message === notification.message &&
                    Math.abs(new Date(n.createdAt).getTime() - new Date(notification.createdAt).getTime()) < 2000)
            );
            if (exists) return prev;
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

    // Add toast to the queue
    const addToast = useCallback((message: string, taskId?: number, type: 'success' | 'error' | 'info' = 'info') => {
        if (isUnmountedRef.current) return;

        console.log('[NotificationContext] 🍞 Adding toast:', message, type);

        const toastId = Date.now() + Math.random();
        const newToast: ToastItem = { id: toastId, message, taskId, type };

        setToasts(prev => {
            console.log('[NotificationContext] Current toasts:', prev.length, '-> Adding new toast');
            return [...prev, newToast];
        });

        // Auto-dismiss after 6 seconds
        const timeoutId = setTimeout(() => {
            if (!isUnmountedRef.current) {
                setToasts(prev => prev.filter(t => t.id !== toastId));
                toastTimeoutsRef.current.delete(toastId);
            }
        }, 6000);

        toastTimeoutsRef.current.set(toastId, timeoutId);
    }, []);

    // Dismiss single toast
    const dismissToast = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
        const timeoutId = toastTimeoutsRef.current.get(id);
        if (timeoutId) {
            clearTimeout(timeoutId);
            toastTimeoutsRef.current.delete(id);
        }
    }, []);

    // Dismiss all toasts
    const dismissAllToasts = useCallback(() => {
        setToasts([]);
        toastTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
        toastTimeoutsRef.current.clear();
    }, []);

    // Test toast function
    const testToast = useCallback(() => {
        addToast("Test bildiriş - " + new Date().toLocaleTimeString());
    }, [addToast]);

    // Handle incoming SignalR notification
    const handleNotification = useCallback((payload: string) => {
        if (isUnmountedRef.current) return;

        console.log('[NotificationContext] 🔔 SignalR notification received:', payload);

        // Check for duplicate (same message within 2 seconds)
        const messageKey = `${payload}-${Math.floor(Date.now() / 2000)}`;
        if (processedMessagesRef.current.has(messageKey)) {
            console.log('[NotificationContext] ⚠️ Duplicate notification ignored');
            return;
        }
        processedMessagesRef.current.add(messageKey);

        // Clean old entries (keep last 50)
        if (processedMessagesRef.current.size > 50) {
            const first = processedMessagesRef.current.values().next().value;
            if (first) processedMessagesRef.current.delete(first);
        }

        // Parse payload
        let message = payload;
        let taskId: number | undefined;

        try {
            const parsed = JSON.parse(payload);
            message = parsed.message || payload;
            taskId = parsed.taskId;
        } catch {
            message = payload;
        }

        // Create notification object
        const newNotification: NotificationResponse = {
            id: Date.now() + Math.random(),
            userId: '',
            message: message,
            isRead: false,
            createdAt: new Date().toISOString(),
            relatedTaskId: taskId,
        };

        addNotification(newNotification);
        addToast(message, taskId);

        // Refresh from server after delay
        setTimeout(() => {
            if (!isUnmountedRef.current) {
                refreshNotifications().catch(() => { });
            }
        }, 1500);
    }, [addNotification, addToast, refreshNotifications]);

    // Initialize SignalR
    useEffect(() => {
        isUnmountedRef.current = false;

        const token = authService.getToken();
        if (!token) {
            console.log('[NotificationContext] No auth token, skipping SignalR');
            return;
        }

        console.log('[NotificationContext] 🚀 Starting SignalR initialization...');

        // Load initial notifications
        refreshNotifications();

        // Subscribe to notifications
        const unsubscribe = signalRService.subscribe('ReceiveNotification', handleNotification);

        // Start SignalR
        signalRService.start()
            .then(() => console.log('[NotificationContext] ✅ SignalR connected'))
            .catch(err => console.error('[NotificationContext] ❌ SignalR failed:', err));

        return () => {
            console.log('[NotificationContext] 🧹 Cleanup');
            isUnmountedRef.current = true;
            toastTimeoutsRef.current.forEach(id => clearTimeout(id));
            toastTimeoutsRef.current.clear();
            unsubscribe();
        };
    }, [refreshNotifications, handleNotification]);

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            toasts,
            addNotification,
            markAsRead,
            markAllAsRead,
            refreshNotifications,
            dismissToast,
            dismissAllToasts,
            testToast,
            addToast,
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export default NotificationProvider;
