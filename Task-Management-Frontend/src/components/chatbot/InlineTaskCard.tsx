import React from 'react';
import type { TaskResult } from '../../dto/ChatbotTypes';
import { useChatbot } from './ChatbotProvider';

interface InlineTaskCardProps {
    task: TaskResult;
}

const InlineTaskCard: React.FC<InlineTaskCardProps> = ({ task }) => {
    // Navigate is handled by simple window location or router if available. 
    // Since we are in a pure component, we'll assume a mock navigation or use a global router if provided in context, 
    // but typically we just log or use window.location for these mock setups unless we have `useNavigate`.
    // The prompt says "Klik: /tasks/{id} səhifəsinə keçid." - We can use window.history or just alert for now/console log if no router provided.
    // Assuming React Router is present in project.

    // We can try to import useNavigate from react-router-dom
    // import { useNavigate } from 'react-router-dom';
    // const navigate = useNavigate();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'InProgress': return 'text-blue-500 bg-blue-500';
            case 'Pending': return 'text-amber-500 bg-amber-500';
            case 'Overdue': return 'text-red-500 bg-red-500';
            case 'Completed': return 'text-green-500 bg-green-500';
            case 'UnderReview': return 'text-purple-500 bg-purple-500';
            default: return 'text-slate-400 bg-slate-400';
        }
    };

    const getDifficultyBadgeColor = (difficulty: string) => {
        switch (difficulty) {
            case 'Easy': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'Medium': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'Hard': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    const statusColorClass = getStatusColor(task.status);
    const difficultyClass = getDifficultyBadgeColor(task.difficulty);
    const isOverdue = task.status === 'Overdue';

    return (
        <div
            onClick={() => console.log(`Navigating to /tasks/${task.id}`)}
            className="group cursor-pointer rounded-xl p-3 mb-1.5 border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0F172A] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-150"
        >
            <div className="flex items-center gap-2 mb-1.5">
                <span className={`w-2 h-2 rounded-full ${statusColorClass.split(' ')[1]}`}></span>
                <span className={`text-[10px] font-bold uppercase ${statusColorClass.split(' ')[0]}`}>
                    {task.status}
                </span>
                <h4 className="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {task.title}
                </h4>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <span>⏰</span>
                    <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
                        {isOverdue ? 'Gecikib' : task.deadline}
                    </span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${difficultyClass}`}>
                    {task.difficulty}
                </span>
            </div>
        </div>
    );
};

export default InlineTaskCard;
