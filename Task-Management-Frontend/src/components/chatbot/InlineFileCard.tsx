import React from 'react';
import type { FileResult } from '../../dto/ChatbotTypes';

interface InlineFileCardProps {
    file: FileResult;
}

const InlineFileCard: React.FC<InlineFileCardProps> = ({ file }) => {

    const getIconStyles = (type: string) => {
        switch (type) {
            case 'pdf': return { bg: 'bg-red-50 text-red-500 dark:bg-red-500/10', icon: '📄' };
            case 'image': return { bg: 'bg-blue-50 text-blue-500 dark:bg-blue-500/10', icon: '🖼️' };
            case 'excel': return { bg: 'bg-green-50 text-green-500 dark:bg-green-500/10', icon: '📊' };
            default: return { bg: 'bg-slate-50 text-slate-500 dark:bg-slate-500/10', icon: '📝' };
        }
    };

    const style = getIconStyles(file.fileType);

    return (
        <div className="flex items-center rounded-xl p-2.5 mb-1.5 border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0F172A] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-150 cursor-pointer group">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${style.bg}`}>
                {style.icon}
            </div>

            <div className="flex-1 ml-2.5 min-w-0">
                <h4 className="font-semibold text-[13px] text-slate-800 dark:text-slate-200 truncate">
                    {file.fileName}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {file.size} • {file.fileType.toUpperCase()}
                </p>
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    alert("Tezliklə əlavə olunacaq");
                }}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 transition-colors"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
            </button>
        </div>
    );
};

export default InlineFileCard;
