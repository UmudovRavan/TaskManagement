import httpClient from './httpClient';
import type { WorkGroupResponse, CreateWorkGroupRequest } from '../dto/WorkGroupResponse';

export const workGroupService = {
    async getAllWorkGroups(): Promise<WorkGroupResponse[]> {
        const response = await httpClient.get<WorkGroupResponse[]>('/WorkGroup');
        return response.data;
    },

    async getWorkGroupById(id: number): Promise<WorkGroupResponse> {
        const response = await httpClient.get<WorkGroupResponse>(`/WorkGroup/${id}`);
        return response.data;
    },

    async createWorkGroup(data: CreateWorkGroupRequest): Promise<WorkGroupResponse> {
        const response = await httpClient.post<WorkGroupResponse>('/WorkGroup', data);
        return response.data;
    },
};

export default workGroupService;
