export const TaskStatus = {
    Pending: 0,
    Assigned: 1,
    InProgress: 2,
    Completed: 3,
    Expired: 4,
} as const;

export type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus];

export const DifficultyLevel = {
    Easy: 0,
    Medium: 1,
    Hard: 2,
} as const;

export type DifficultyLevel = typeof DifficultyLevel[keyof typeof DifficultyLevel];

export interface TaskResponse {
    id: number;
    title: string;
    description: string;
    difficulty: DifficultyLevel;
    status: TaskStatus;
    deadline: string;
    assignedToUserId?: string;
    createdByUserId: string;
    parentTaskId?: number;
    taskCommentId?: number[];
    files?: FileDto[];
    taskComments?: TaskCommentDto[];
}

export interface FileDto {
    id: number;
    fileName: string;
    contentType: string;
    content?: string;
}

export interface TaskCommentDto {
    id: number;
    content: string;
    userId: string;
    userName?: string;
    taskId: number;
    createdAt?: string;
    taskCommentMentionIDs?: string[];
}
