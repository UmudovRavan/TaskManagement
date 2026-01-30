export const NotificationType = {
    General: 'general',
    TaskAssignment: 'task_assignment',
    TaskAccepted: 'task_accepted',
    TaskRejected: 'task_rejected',
    Mention: 'mention',
} as const;

export type NotificationType = typeof NotificationType[keyof typeof NotificationType];


export interface NotificationResponse {
    id: number;
    userId: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    relatedTaskId?: number;
}

// Helper function to detect notification type from message
export const getNotificationType = (message: string): NotificationType => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('təyin olundu') || lowerMessage.includes('assign')) {
        return NotificationType.TaskAssignment;
    }
    if (lowerMessage.includes('qəbul etdi') || lowerMessage.includes('accept')) {
        return NotificationType.TaskAccepted;
    }
    if (lowerMessage.includes('rədd etdi') || lowerMessage.includes('reject')) {
        return NotificationType.TaskRejected;
    }
    if (lowerMessage.includes('mention') || lowerMessage.includes('@')) {
        return NotificationType.Mention;
    }
    return NotificationType.General;
};
