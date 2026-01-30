import React, { useState } from 'react';
import type { TaskResponse } from '../dto';
import { TaskStatus } from '../dto';

interface WorkloadChartProps {
    tasks: TaskResponse[];
}

const WorkloadChart: React.FC<WorkloadChartProps> = ({ tasks }) => {
    const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');



    const getWeeklyDistribution = () => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Start from Sunday
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);

        const distribution = days.map(() => ({
            pending: 0,
            inProgress: 0,
            completed: 0,
        }));

        tasks.forEach((task) => {
            const taskDate = new Date(task.deadline);
            if (taskDate >= startOfWeek && taskDate < endOfWeek) {
                const dayIndex = taskDate.getDay();
                if (task.status === TaskStatus.Pending || task.status === TaskStatus.Assigned) {
                    distribution[dayIndex].pending += 1;
                } else if (task.status === TaskStatus.InProgress) {
                    distribution[dayIndex].inProgress += 1;
                } else if (task.status === TaskStatus.Completed) {
                    distribution[dayIndex].completed += 1;
                }
            }
        });

        const maxTotal = Math.max(
            ...distribution.map((d) => d.pending + d.inProgress + d.completed),
            1
        );

        return days.map((day, index) => {
            const total = distribution[index].pending + distribution[index].inProgress + distribution[index].completed;
            return {
                day,
                pending: total > 0 ? (distribution[index].pending / maxTotal) * 80 : 0,
                inProgress: total > 0 ? (distribution[index].inProgress / maxTotal) * 80 : 0,
                completed: total > 0 ? (distribution[index].completed / maxTotal) * 80 : 0,
                isWeekend: index === 0 || index === 6,
            };
        });
    };

    const getMonthlyDistribution = () => {
        const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const distribution = weeks.map(() => ({
            pending: 0,
            inProgress: 0,
            completed: 0,
        }));

        tasks.forEach((task) => {
            const taskDate = new Date(task.deadline);
            if (taskDate >= startOfMonth && taskDate <= endOfMonth) {
                // Approximate week index (0-3)
                const dayOfMonth = taskDate.getDate();
                const weekIndex = Math.min(Math.floor((dayOfMonth - 1) / 7), 3);

                if (task.status === TaskStatus.Pending || task.status === TaskStatus.Assigned) {
                    distribution[weekIndex].pending += 1;
                } else if (task.status === TaskStatus.InProgress) {
                    distribution[weekIndex].inProgress += 1;
                } else if (task.status === TaskStatus.Completed) {
                    distribution[weekIndex].completed += 1;
                }
            }
        });

        const maxTotal = Math.max(
            ...distribution.map((d) => d.pending + d.inProgress + d.completed),
            1
        );

        return weeks.map((week, index) => {
            const total = distribution[index].pending + distribution[index].inProgress + distribution[index].completed;
            return {
                day: week, // Reusing 'day' property for label
                pending: total > 0 ? (distribution[index].pending / maxTotal) * 80 : 0,
                inProgress: total > 0 ? (distribution[index].inProgress / maxTotal) * 80 : 0,
                completed: total > 0 ? (distribution[index].completed / maxTotal) * 80 : 0,
                isWeekend: false,
            };
        });
    };

    const chartData = viewMode === 'weekly' ? getWeeklyDistribution() : getMonthlyDistribution();

    return (
        <div className="lg:col-span-2 rounded-xl border border-[#e5e7eb] dark:border-gray-700 bg-white dark:bg-[#1a202c] p-6 shadow-sm flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h3 className="text-lg font-bold text-[#111318] dark:text-white">Workload Distribution</h3>
                <div className="flex items-center rounded-lg bg-[#f0f2f4] dark:bg-gray-800 p-1">
                    <button
                        onClick={() => setViewMode('weekly')}
                        className={`rounded-md px-3 py-1 text-xs font-bold transition-all ${viewMode === 'weekly'
                            ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                            : 'text-[#636f88] dark:text-gray-400 hover:text-[#111318] dark:hover:text-white'
                            }`}
                    >
                        Weekly
                    </button>
                    <button
                        onClick={() => setViewMode('monthly')}
                        className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${viewMode === 'monthly'
                            ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                            : 'text-[#636f88] dark:text-gray-400 hover:text-[#111318] dark:hover:text-white'
                            }`}
                    >
                        Monthly
                    </button>
                </div>
            </div>

            <div className="relative flex flex-1 items-end gap-4 sm:gap-8 justify-between pt-4 px-2 min-h-[300px]">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8">
                    <div className="w-full border-t border-dashed border-gray-100 dark:border-gray-800"></div>
                    <div className="w-full border-t border-dashed border-gray-100 dark:border-gray-800"></div>
                    <div className="w-full border-t border-dashed border-gray-100 dark:border-gray-800"></div>
                    <div className="w-full border-t border-dashed border-gray-100 dark:border-gray-800"></div>
                    <div className="w-full border-t border-dashed border-gray-200 dark:border-gray-700"></div>
                </div>

                {chartData.map((data, index) => (
                    <div
                        key={index}
                        className={`group relative flex h-full flex-1 flex-col justify-end gap-1 z-0 ${data.isWeekend ? 'opacity-50' : ''
                            }`}
                    >
                        <div
                            className="w-full rounded-t-sm bg-[#93c5fd]"
                            style={{ height: `${data.pending}%` }}
                        ></div>
                        <div
                            className="w-full bg-[#c4b5fd]"
                            style={{ height: `${data.inProgress}%` }}
                        ></div>
                        <div
                            className="w-full rounded-b-sm bg-[#86efac]"
                            style={{ height: `${data.completed}%` }}
                        ></div>
                        <span className="absolute -bottom-8 w-full text-center text-xs font-medium text-[#636f88] dark:text-gray-400">
                            {data.day}
                        </span>
                    </div>
                ))}
            </div>

            <div className="mt-12 flex items-center justify-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="size-3 rounded-full bg-[#93c5fd]"></div>
                    <span className="text-xs font-medium text-[#636f88] dark:text-gray-400">Pending</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="size-3 rounded-full bg-[#c4b5fd]"></div>
                    <span className="text-xs font-medium text-[#636f88] dark:text-gray-400">In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="size-3 rounded-full bg-[#86efac]"></div>
                    <span className="text-xs font-medium text-[#636f88] dark:text-gray-400">Completed</span>
                </div>
            </div>
        </div>
    );
};

export default WorkloadChart;
