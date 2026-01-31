import httpClient from './httpClient';
import type { TaskResponse } from '../dto';

export interface CreateTaskRequest {
    title: string;
    description: string;
    difficulty: number;
    status: number;
    deadline: string;
    assignedToUserId?: string;
    createdByUserId: string;
    parentTaskId?: number;
}

export interface UpdateTaskRequest {
    id: number;
    title: string;
    description: string;
    difficulty: number;
    status: number;
    deadline: string;
    assignedToUserId?: string;
    createdByUserId: string;
    parentTaskId?: number;
}

export const taskService = {
    async getAllTasks(): Promise<TaskResponse[]> {
        const response = await httpClient.get<TaskResponse[]>('/Task/GetAllTask');
        return response.data;
    },

    async getTaskById(id: number): Promise<TaskResponse> {
        const response = await httpClient.get<TaskResponse>(`/Task/GetTask/${id}`);
        return response.data;
    },

    async createTask(data: CreateTaskRequest, files?: File[]): Promise<TaskResponse> {
        const formData = new FormData();
        formData.append('Title', data.title);
        formData.append('Description', data.description);
        formData.append('Difficulty', data.difficulty.toString());
        formData.append('Status', data.status.toString());
        formData.append('Deadline', data.deadline);
        formData.append('CreatedByUserId', data.createdByUserId);

        if (data.assignedToUserId) {
            formData.append('AssignedToUserId', data.assignedToUserId);
        }
        if (data.parentTaskId) {
            formData.append('ParentTaskId', data.parentTaskId.toString());
        }

        if (files) {
            files.forEach((file) => {
                formData.append('files', file);
            });
        }

        const response = await httpClient.post<TaskResponse>('/Task/CreateTask', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    async updateTask(data: UpdateTaskRequest): Promise<void> {
        await httpClient.put('/Task/UpdateTask', {
            Id: data.id,
            Title: data.title,
            Description: data.description,
            Difficulty: data.difficulty,
            Status: data.status,
            Deadline: data.deadline,
            AssignedToUserId: data.assignedToUserId,
            CreatedByUserId: data.createdByUserId,
            ParentTaskId: data.parentTaskId,
        });
    },

    async deleteTask(id: number): Promise<void> {
        await httpClient.delete(`/Task/DeleteTask/${id}`);
    },

    async assignTask(taskId: number, userId: string): Promise<void> {
        await httpClient.post(`/Task/AssignTask?taskId=${taskId}&userId=${userId}`);
    },

    async unassignTask(taskId: number, userId: string): Promise<void> {
        await httpClient.post(`/Task/UnAssignTask?taskId=${taskId}&userId=${userId}`);
    },

    async addComment(taskId: number, comment: string): Promise<void> {
        await httpClient.post(`/Task/AddComment?taskId=${taskId}&comment=${encodeURIComponent(comment)}`);
    },

    async acceptTask(taskId: number): Promise<void> {
        await httpClient.post(`/Task/AcceptTask?taskId=${taskId}`);
    },

    async rejectTask(taskId: number, reason: string): Promise<void> {
        await httpClient.post(`/Task/reject?taskId=${taskId}&reason=${encodeURIComponent(reason)}`);
    },

    async finishTask(taskId: number): Promise<void> {
        await httpClient.post(`/Task/FinishTask?taskId=${taskId}`);
    },

    async returnForRevision(taskId: number, userId: string, reason: string): Promise<void> {
        await httpClient.post(`/Task/ReopenTask?taskId=${taskId}&userId=${userId}&reason=${encodeURIComponent(reason)}`);
    },
};

export default taskService;
