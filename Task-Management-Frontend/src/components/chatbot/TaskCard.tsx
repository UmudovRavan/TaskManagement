import React from 'react';
import type { TaskResult } from '../../dto/ChatbotTypes';

interface TaskCardProps {
    task: TaskResult;
}

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'InProgress': return '#3B82F6'; // Blue
            case 'Pending': return '#F59E0B'; // Yellow
            case 'UnderReview': return '#A855F7'; // Purple
            case 'Completed': return '#22C55E'; // Green
            case 'Overdue': return '#EF4444'; // Red
            default: return '#E5E7EB';
        }
    };

    const getStatusBadgeStyle = (status: string) => {
        switch (status) {
            case 'InProgress': return { bg: 'bg-blue-500/10', text: 'text-blue-500' };
            case 'Pending': return { bg: 'bg-amber-500/10', text: 'text-amber-500' }; // Amber is safer than yellow for text
            case 'UnderReview': return { bg: 'bg-purple-500/10', text: 'text-purple-500' };
            case 'Completed': return { bg: 'bg-green-500/10', text: 'text-green-500' };
            case 'Overdue': return { bg: 'bg-red-500/10', text: 'text-red-500' };
            default: return { bg: 'bg-slate-100', text: 'text-slate-600' };
        }
    };

    const getDifficultyBadgeStyle = (difficulty: string) => {
        switch (difficulty) {
            case 'Easy': return { bg: 'bg-green-500/10', text: 'text-green-500' };
            case 'Medium': return { bg: 'bg-blue-500/10', text: 'text-blue-500' };
            case 'Hard': return { bg: 'bg-red-500/10', text: 'text-red-500' };
            default: return { bg: 'bg-slate-100', text: 'text-slate-600' };
        }
    };

    const statusBadge = getStatusBadgeStyle(task.status);
    const difficultyBadge = getDifficultyBadgeStyle(task.difficulty);
    const borderColor = getStatusColor(task.status);
    const isOverdue = task.status === 'Overdue';

    return (
        <div
            className={`
                bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-[2px] 
                transition-all duration-200 cursor-pointer border border-slate-200 dark:border-slate-700
                p-5 flex flex-col justify-between h-48 relative overflow-hidden group
                animate-in fade-in zoom-in duration-300
                ${isOverdue ? 'animate-pulse' : ''} 
            `}
            style={{ animationDuration: isOverdue ? '2s' : '0.4s' }}
        // Handling overdue pulse animation for border or glow if needed via classes, but here using structure
        >
            {/* Left Colored Border Line */}
            <div
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ backgroundColor: borderColor }}
            ></div>

            <div>
                <div className="flex justify-between items-start mb-3 pl-2">
                    <span className={`px-2 py-1 ${statusBadge.bg} ${statusBadge.text} text-[10px] font-bold uppercase rounded tracking-wide`}>
                        {task.status.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">ID: #TF-{task.id}</span>
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-snug pl-2 line-clamp-1">
                    {task.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 pl-2">
                    {task.description}
                </p>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50 dark:border-slate-700 pl-2">
                <div className="flex items-center space-x-3">
                    {/* Assigned To Avatar (Mock) */}
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold">
                        {task.assignedTo ? task.assignedTo.charAt(0) : 'U'}
                    </div>
                    <div>
                        <p className={`text-[10px] leading-none ${isOverdue ? 'text-red-500 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
                            {isOverdue ? 'Passed' : 'Deadline'}
                        </p>
                        <p className={`text-xs font-semibold ${isOverdue ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>
                            {task.deadline}
                        </p>
                    </div>
                </div>
                <span className={`px-2 py-1 ${difficultyBadge.bg} ${difficultyBadge.text} text-[10px] font-bold rounded`}>
                    {task.difficulty}
                </span>
            </div>
        </div>
    );
};

export default TaskCard;
