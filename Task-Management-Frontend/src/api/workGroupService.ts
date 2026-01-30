import httpClient from './httpClient';
import type { WorkGroupResponse } from '../dto/WorkGroupResponse';

export const workGroupService = {
    async getAllWorkGroups(): Promise<WorkGroupResponse[]> {
        const response = await httpClient.get<WorkGroupResponse[]>('/WorkGroup');
        return response.data;
    },

    async getWorkGroupById(id: number): Promise<WorkGroupResponse> {
        const response = await httpClient.get<WorkGroupResponse>(`/WorkGroup/${id}`);
        return response.data;
    },
};

export default workGroupService;
