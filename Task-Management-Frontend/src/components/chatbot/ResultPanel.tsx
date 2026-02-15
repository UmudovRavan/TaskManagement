import React, { useState } from 'react';
import type { TaskResult, FileResult, StatsResult } from '../../dto/ChatbotTypes';
import TaskCard from './TaskCard';
import FileCard from './FileCard';
import StatsCard from './StatsCard';
import EmptyState from './EmptyState';

interface ResultPanelProps {
    data: TaskResult[] | FileResult[] | StatsResult | null;
    type: "tasks" | "files" | "stats" | null;
    count: number;
}

type SortOption = 'name_asc' | 'name_desc' | 'date_new' | 'date_old' | 'diff_easy' | 'diff_hard' | 'status';

const ResultPanel: React.FC<ResultPanelProps> = ({ data, type, count }) => {
    const [sortOpen, setSortOpen] = useState(false);
    const [sortOption, setSortOption] = useState<SortOption>('date_new');

    const getSortedData = () => {
        if (!data) return null;
        if (!Array.isArray(data)) return data; // Stats object

        const arrayData = [...data];

        if (type === 'tasks') {
            return (arrayData as TaskResult[]).sort((a, b) => {
                switch (sortOption) {
                    case 'name_asc': return a.title.localeCompare(b.title);
                    case 'name_desc': return b.title.localeCompare(a.title);
                    case 'date_new': return new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
                    case 'date_old': return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
                    case 'diff_easy': {
                        const diffOrder: { [key: string]: number } = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
                        return (diffOrder[a.difficulty] || 0) - (diffOrder[b.difficulty] || 0);
                    }
                    case 'diff_hard': {
                        const diffOrder: { [key: string]: number } = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
                        return (diffOrder[b.difficulty] || 0) - (diffOrder[a.difficulty] || 0);
                    }
                    case 'status': return a.status.localeCompare(b.status);
                    default: return 0;
                }
            });
        }

        if (type === 'files') {
            return (arrayData as FileResult[]).sort((a, b) => {
                switch (sortOption) {
                    case 'name_asc': return a.fileName.localeCompare(b.fileName);
                    case 'name_desc': return b.fileName.localeCompare(a.fileName);
                    case 'date_new': return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
                    case 'date_old': return new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
                    default: return 0;
                }
            });
        }

        return data; // Fallback
    };

    const sortedData = getSortedData();

    const handleSort = (option: SortOption) => {
        setSortOption(option);
        setSortOpen(false);
    };

    const renderContent = () => {
        if (!sortedData) return <EmptyState />;

        if (type === 'tasks' && Array.isArray(sortedData)) {
            if (sortedData.length === 0) return <EmptyState />;
            return (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-8">
                    {(sortedData as TaskResult[]).map((task) => (
                        <TaskCard key={task.id} task={task} />
                    ))}
                </div>
            );
        }

        if (type === 'files' && Array.isArray(sortedData)) {
            if (sortedData.length === 0) return <EmptyState />;
            return (
                <div className="flex flex-col gap-3 pb-8">
                    {(sortedData as FileResult[]).map((file) => (
                        <FileCard key={file.id} file={file} />
                    ))}
                </div>
            );
        }

        if (type === 'stats' && !Array.isArray(sortedData)) {
            return (
                <div className="flex justify-center items-center h-full pb-8">
                    <div className="w-full max-w-md">
                        <StatsCard stats={sortedData as StatsResult} />
                    </div>
                </div>
            );
        }

        return <EmptyState />;
    };

    const getIcon = () => {
        switch (type) {
            case 'tasks': return (
                <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
            );
            case 'files': return (
                <svg className="w-5 h-5 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"></path></svg>
            );
            case 'stats': return (
                <svg className="w-5 h-5 text-purple-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            );
            default: return null;
        }
    };

    const getTitle = () => {
        switch (type) {
            case 'tasks': return "Task List Results";
            case 'files': return "File Search Results";
            case 'stats': return "Performance Stats";
            default: return "Results";
        }
    };

    return (
        <section className="flex-1 bg-slate-50 dark:bg-[#0B1120] flex flex-col overflow-hidden relative">
            {/* Toolbar */}
            <div className="px-8 py-5 bg-white dark:bg-[#1E293B] border-b border-slate-100 dark:border-slate-700 flex items-center justify-between shrink-0 z-10">
                <div className="flex items-center">
                    {getIcon()}
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mr-3">{getTitle()}</h2>
                    {count > 0 && <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-xs px-2.5 py-0.5 rounded-full font-semibold">{count} Items Found</span>}
                </div>

                <div className="flex items-center space-x-3">
                    {/* Sort Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setSortOpen(!sortOpen)}
                            className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium flex items-center transition-colors"
                        >
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"></path></svg>
                            Sort
                        </button>

                        {sortOpen && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#1E293B] rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 py-2 z-50 animate-in fade-in zoom-in duration-200">
                                <button onClick={() => handleSort('name_asc')} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center ${sortOption === 'name_asc' ? 'font-semibold text-blue-600' : 'text-slate-700 dark:text-slate-200'}`}>
                                    {sortOption === 'name_asc' && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>}
                                    📝 Ada görə (A-Z)
                                </button>
                                <button onClick={() => handleSort('name_desc')} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center ${sortOption === 'name_desc' ? 'font-semibold text-blue-600' : 'text-slate-700 dark:text-slate-200'}`}>
                                    {sortOption === 'name_desc' && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>}
                                    📝 Ada görə (Z-A)
                                </button>
                                <button onClick={() => handleSort('date_new')} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center ${sortOption === 'date_new' ? 'font-semibold text-blue-600' : 'text-slate-700 dark:text-slate-200'}`}>
                                    {sortOption === 'date_new' && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>}
                                    📅 Tarixə görə (Yeni→Köhnə)
                                </button>
                                <button onClick={() => handleSort('date_old')} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center ${sortOption === 'date_old' ? 'font-semibold text-blue-600' : 'text-slate-700 dark:text-slate-200'}`}>
                                    {sortOption === 'date_old' && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>}
                                    📅 Tarixə görə (Köhnə→Yeni)
                                </button>
                                {type === 'tasks' && (
                                    <>
                                        <button onClick={() => handleSort('diff_easy')} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center ${sortOption === 'diff_easy' ? 'font-semibold text-blue-600' : 'text-slate-700 dark:text-slate-200'}`}>
                                            {sortOption === 'diff_easy' && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>}
                                            ⚡ Çətinliyə görə (Asan→Çətin)
                                        </button>
                                        <button onClick={() => handleSort('diff_hard')} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center ${sortOption === 'diff_hard' ? 'font-semibold text-blue-600' : 'text-slate-700 dark:text-slate-200'}`}>
                                            {sortOption === 'diff_hard' && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>}
                                            ⚡ Çətinliyə görə (Çətin→Asan)
                                        </button>
                                        <button onClick={() => handleSort('status')} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center ${sortOption === 'status' ? 'font-semibold text-blue-600' : 'text-slate-700 dark:text-slate-200'}`}>
                                            {sortOption === 'status' && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>}
                                            🔄 Statusa görə
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                        {/* Overlay to close sort */}
                        {sortOpen && <div className="fixed inset-0 z-40" onClick={() => setSortOpen(false)}></div>}
                    </div>

                    <button
                        onClick={() => alert("Export funksiyası tezliklə əlavə olunacaq")}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all transform active:scale-95"
                    >
                        Export Report
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
                {renderContent()}
            </div>
        </section>
    );
};

export default ResultPanel;
