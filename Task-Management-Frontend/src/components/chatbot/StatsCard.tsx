import React from 'react';
import type { StatsResult } from '../../dto/ChatbotTypes';

interface StatsCardProps {
    stats: StatsResult;
}

const StatsCard: React.FC<StatsCardProps> = ({ stats }) => {
    return (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col justify-center animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{stats.label}</span>
                {stats.trend > 0 && (
                    <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs px-2 py-0.5 rounded-full font-medium">
                        ↑ {stats.trend}%
                    </span>
                )}
            </div>

            <div className="flex items-end gap-2 mb-4">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{stats.value}</span>
                {stats.unit && <span className="text-sm font-medium text-slate-500 mb-1.5">{stats.unit}</span>}
            </div>

            {/* Progress Bar Mockup */}
            <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                    style={{ width: `${Math.min(stats.value, 100)}%` }} // Just a visual mock logic
                ></div>
            </div>
        </div>
    );
};

export default StatsCard;
