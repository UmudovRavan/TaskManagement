import httpClient from './httpClient';
import type { TaskResponse } from '../dto';

export const dashboardService = {
    async getAllTasks(): Promise<TaskResponse[]> {
        const response = await httpClient.get<TaskResponse[]>('/Task/GetAllTask');
        return response.data;
    },
};

export default dashboardService;
