/**
 * Performance Response DTOs
 * Maps to backend Performance API responses
 */

export interface PerformanceReport {
    totalPoints: number;
}

export interface TrendDataPoint {
    date: string; // ISO format
    points: number;
}

export interface DifficultyContribution {
    difficulty: 'Easy' | 'Medium' | 'Hard';
    difficultyLevel: number; // 0=Easy, 1=Medium, 2=Hard
    tasksCompleted: number;
    pointsEarned: number;
    averageTimeSpent?: string; // Optional - might not come from backend
}

export interface AddPerformancePointRequest {
    userId: string;
    taskId: number;
    reason: string;
    senderId: string;
}

export interface LeaderboardEntry {
    userId: string;
    userName: string;
    totalPoints: number;
    rank?: number;
}

// Extended report with calculated fields for UI
export interface PerformanceReportExtended extends PerformanceReport {
    completionRate: number;
    tasksCompleted: number;
    trendData: TrendDataPoint[];
    difficultyBreakdown: DifficultyContribution[];
    trend: {
        direction: 'up' | 'down' | 'stable';
        percentage: number;
    };
}
