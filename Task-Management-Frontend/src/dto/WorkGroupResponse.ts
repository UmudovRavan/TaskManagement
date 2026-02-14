export interface WorkGroupResponse {
    id: number;
    name: string;
    leaderId: string;
    userIds: string[];
    taskIds: number[];
}

export interface WorkGroupListItem {
    id: number;
    name: string;
    sector: string;
    status: 'Active' | 'Inactive' | 'Review';
    memberCount: number;
    totalPoints: number;
}

export interface WorkGroupStats {
    totalWorkGroups: number;
    totalWorkGroupsChange: number;
    activeMembers: number;
    activeMembersGrowth: number;
    avgGroupPoints: number;
    avgGroupPointsGrowth: number;
    productivityRate: number;
    productivityLabel: string;
}

export interface WorkGroupMemberPerformance {
    rank: number;
    userId: string;
    userName: string;
    totalPoints: number;
    completedTasks: number;
    efficiency: number;
}

export interface CreateWorkGroupRequest {
    name: string;
    leaderId: string;
    userIds?: string[];
    taskIds?: number[];
}

