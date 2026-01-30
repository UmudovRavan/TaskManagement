import React from 'react';
import { TaskStatus } from '../dto';

interface TaskStatusBadgeProps {
    status: number;
}

const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({ status }) => {
    const getStatusConfig = () => {
        switch (status) {
            case TaskStatus.Pending:
                return {
                    label: 'Gözləmədə',
                    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
                    textColor: 'text-yellow-700 dark:text-yellow-400',
                };
            case TaskStatus.Assigned:
                return {
                    label: 'Təyin edilib',
                    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
                    textColor: 'text-blue-700 dark:text-blue-400',
                };
            case TaskStatus.InProgress:
                return {
                    label: 'İcrada',
                    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
                    textColor: 'text-purple-700 dark:text-purple-400',
                };
            case TaskStatus.Completed:
                return {
                    label: 'Tamamlandı',
                    bgColor: 'bg-green-100 dark:bg-green-900/30',
                    textColor: 'text-green-700 dark:text-green-400',
                };
            case TaskStatus.Expired:
                return {
                    label: 'Vaxtı bitib',
                    bgColor: 'bg-red-100 dark:bg-red-900/30',
                    textColor: 'text-red-700 dark:text-red-400',
                };
            default:
                return {
                    label: 'Naməlum',
                    bgColor: 'bg-gray-100 dark:bg-gray-700',
                    textColor: 'text-gray-700 dark:text-gray-400',
                };
        }
    };

    const config = getStatusConfig();

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}
        >
            {config.label}
        </span>
    );
};

export default TaskStatusBadge;
