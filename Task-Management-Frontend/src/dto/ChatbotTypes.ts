export type MessageSender = "user" | "ai";
export type MessageType = "text" | "tasks" | "files" | "stats" | "error";

export interface TaskResult {
    id: number;
    title: string;
    description: string;
    status: "Pending" | "InProgress" | "UnderReview" | "Completed" | "Overdue";
    difficulty: "Easy" | "Medium" | "Hard";
    deadline: string;
    assignedTo?: string;
}

export interface FileResult {
    id: number;
    fileName: string;
    fileType: "pdf" | "image" | "excel" | "text";
    size: string;
    uploadDate: string;
    taskName: string;
}

export interface StatsResult {
    label: string;
    value: number;
    unit?: string;
    trend: number;
}

export interface ChatMessage {
    id: string;
    sender: MessageSender;
    text: string;
    type: MessageType;
    timestamp: Date;
    data?: TaskResult[] | FileResult[] | StatsResult;
}
