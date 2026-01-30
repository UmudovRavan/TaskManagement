import httpClient from './httpClient';
import type { NotificationResponse } from '../dto';

export const notificationService = {
    async getMyNotifications(): Promise<NotificationResponse[]> {
        const response = await httpClient.get<NotificationResponse[]>('/Notifications');
        return response.data;
    },

    async markAsRead(id: number): Promise<void> {
        await httpClient.post(`/Notifications/${id}/read`);
    },
};

export default notificationService;
