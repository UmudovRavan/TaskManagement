import React from 'react';
import type { TaskResult, FileResult, StatsResult } from '../../dto/ChatbotTypes';
import InlineTaskCard from './InlineTaskCard';
import InlineFileCard from './InlineFileCard';
import InlineStatsCard from './InlineStatsCard';

interface InlineResultGroupProps {
    data: TaskResult[] | FileResult[] | StatsResult;
    type: 'tasks' | 'files' | 'stats' | 'error' | 'text';
}

const InlineResultGroup: React.FC<InlineResultGroupProps> = ({ data, type }) => {
    if (!data) return null;

    return (
        <div className="mt-3 w-full">
            {type === 'tasks' && Array.isArray(data) && (
                <div className="flex flex-col gap-1 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {data.map((task, index) => (
                        <div key={task.id} className="animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${index * 100}ms` }}>
                            {/* @ts-ignore - we know it's task result here */}
                            <InlineTaskCard task={task as any} />
                        </div>
                    ))}
                    <button
                        className="text-[11px] text-blue-500 hover:text-blue-600 font-medium mt-1 self-start hover:underline ml-1"
                        onClick={() => console.log('View All Tasks Clicked')}
                    >
                        Bütün siyahıya bax →
                    </button>
                </div>
            )}

            {type === 'files' && Array.isArray(data) && (
                <div className="flex flex-col gap-1 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {data.map((file, index) => (
                        <div key={file.id} className="animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${index * 100}ms` }}>
                            {/* @ts-ignore - we know it's file result here */}
                            <InlineFileCard file={file as any} />
                        </div>
                    ))}
                </div>
            )}

            {type === 'stats' && !Array.isArray(data) && (
                <div className="w-full animate-in fade-in zoom-in duration-300">
                    {/* @ts-ignore - we know it's stats result here */}
                    <InlineStatsCard stats={data as any} />
                </div>
            )}
        </div>
    );
};

export default InlineResultGroup;
