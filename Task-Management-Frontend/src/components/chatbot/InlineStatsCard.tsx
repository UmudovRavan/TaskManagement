import React, { useEffect, useState } from 'react';
import type { StatsResult } from '../../dto/ChatbotTypes';

interface InlineStatsCardProps {
    stats: StatsResult;
}

const InlineStatsCard: React.FC<InlineStatsCardProps> = ({ stats }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Animate progress on mount
        setTimeout(() => setProgress(Math.min(stats.value, 100)), 100);
    }, [stats.value]);

    return (
        <div className="rounded-[14px] p-4 bg-gradient-to-b from-slate-50 to-blue-50/50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 mt-2 mb-2 shadow-sm">
            <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {stats.label}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${stats.trend >= 0 ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {stats.trend >= 0 ? `↑ ${stats.trend}%` : `↓ ${Math.abs(stats.trend)}%`}
                </span>
            </div>

            <div className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
                {stats.value}
                {stats.unit && <span className="text-sm font-medium text-slate-400 ml-1">{stats.unit}</span>}
            </div>

            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 dark:to-cyan-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(34,211,238,0.4)]"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>
    );
};

export default InlineStatsCard;
