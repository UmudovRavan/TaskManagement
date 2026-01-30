export interface EmployeePerformanceData {
    userId: string;
    userName: string;
    role: string;
    workGroupName: string;
    totalPoints: number;
    completedTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    completionRate: number;
    pointsChange: number;
    tasksChange: number;
}

export interface TaskHistoryItem {
    id: number;
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    status: 'Completed' | 'In Progress' | 'Pending';
    points: number;
    date: string;
}

export interface DifficultyDistribution {
    easy: number;
    medium: number;
    hard: number;
}

export interface PerformanceTrendPoint {
    label: string;
    points: number;
}
