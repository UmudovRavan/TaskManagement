import httpClient from './httpClient';
import type { UserResponse } from '../dto';

const userService = {
    getAllUsers: async (): Promise<UserResponse[]> => {
        const response = await httpClient.get<UserResponse[]>('/Authorize/AllUsers');
        return response.data;
    },
};

export default userService;
