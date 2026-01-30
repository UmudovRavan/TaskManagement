import httpClient from './httpClient';
import type { LeaderboardEntry, AddPerformancePointRequest } from '../dto';

/**
 * Performance Service
 * Handles all performance-related API calls
 */
export const performanceService = {
    /**
     * Get performance report for a specific user
     * @param userId - User ID to get report for
     * @returns Total points for the user
     */
    async getPerformanceReport(userId: string): Promise<number> {
        const response = await httpClient.get<number>(`/Performance/GetPerformanceReport/${userId}`);
        return response.data;
    },

    /**
     * Add performance points to a user for completing a task
     * @param data - Performance point data
     */
    async addPerformancePoint(data: AddPerformancePointRequest): Promise<void> {
        await httpClient.post('/Performance/Add Performance Point', {
            userId: data.userId,
            taskId: data.taskId,
            reason: data.reason,
            senderId: data.senderId
        });
    },

    /**
     * Get leaderboard (top performers)
     * @returns List of users sorted by total points
     */
    async getLeaderboard(): Promise<LeaderboardEntry[]> {
        const response = await httpClient.get<LeaderboardEntry[]>('/Performance/GetLeaderboard');
        return response.data;
    }
};

export default performanceService;
