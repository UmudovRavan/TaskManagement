import React from 'react';
import type { TaskResponse } from '../dto';
import TaskStatusBadge from './TaskStatusBadge';
import DifficultyDots from './DifficultyDots';

interface TaskRowProps {
    task: TaskResponse;
    currentUserId?: string;
    onEdit?: (task: TaskResponse) => void;
    onDelete?: (taskId: number) => void;
    onView?: (task: TaskResponse) => void;
    onPerformance?: (task: TaskResponse) => void;
}

const TaskRow: React.FC<TaskRowProps> = ({ task, currentUserId, onEdit, onDelete, onView, onPerformance }) => {
    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('az-AZ', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const isOverdue = (): boolean => {
        const deadline = new Date(task.deadline);
        return deadline < new Date() && task.status !== 3;
    };

    // Check if current user is task creator and task is completed
    const canAddPerformance = currentUserId && task.createdByUserId === currentUserId && task.status === 3;

    return (
        <div className="flex items-center justify-between p-4 bg-white dark:bg-card-dark rounded-xl border border-[#e5e7eb] dark:border-input-border-dark shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                        <h4
                            className="text-sm font-semibold text-[#111318] dark:text-white truncate cursor-pointer hover:text-primary transition-colors"
                            onClick={() => onView?.(task)}
                        >
                            {task.title}
                        </h4>
                        <TaskStatusBadge status={task.status} />
                    </div>
                    <p className="text-xs text-[#636f88] dark:text-gray-400 truncate max-w-md">
                        {task.description || 'Təsvir yoxdur'}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-8">
                <div className="hidden sm:flex flex-col items-end gap-0.5">
                    <span className="text-xs font-medium text-[#636f88] dark:text-gray-400">Son tarix</span>
                    <span className={`text-sm font-medium ${isOverdue() ? 'text-red-600' : 'text-[#111318] dark:text-white'}`}>
                        {formatDate(task.deadline)}
                    </span>
                </div>

                <div className="hidden md:block">
                    <DifficultyDots difficulty={task.difficulty} />
                </div>

                <div className="flex items-center gap-2">
                    {canAddPerformance && (
                        <button
                            onClick={() => onPerformance?.(task)}
                            className="flex size-8 items-center justify-center rounded-lg text-primary hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors"
                            title="Performans Xalı Əlavə et"
                        >
                            <span className="material-symbols-outlined text-[18px]">military_tech</span>
                        </button>
                    )}
                    <button
                        onClick={() => onView?.(task)}
                        className="flex size-8 items-center justify-center rounded-lg text-[#636f88] hover:bg-[#f0f2f4] dark:hover:bg-gray-800 transition-colors"
                        title="Bax"
                    >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                    </button>
                    <button
                        onClick={() => onEdit?.(task)}
                        className="flex size-8 items-center justify-center rounded-lg text-[#636f88] hover:bg-[#f0f2f4] dark:hover:bg-gray-800 transition-colors"
                        title="Redaktə et"
                    >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                        onClick={() => onDelete?.(task.id)}
                        className="flex size-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Sil"
                    >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskRow;
