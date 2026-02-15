import React from 'react';
import type { FileResult } from '../../dto/ChatbotTypes';

interface FileCardProps {
    file: FileResult;
}

const FileCard: React.FC<FileCardProps> = ({ file }) => {

    const getFileIcon = (type: string) => {
        switch (type) {
            case 'pdf': return '📄';
            case 'image': return '🖼️';
            case 'excel': return '📊';
            case 'text': return '📝';
            default: return '📁';
        }
    };

    const getIconBg = (type: string) => {
        switch (type) {
            case 'pdf': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
            case 'image': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
            case 'excel': return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
            default: return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
        }
    };

    const handleDownload = () => {
        alert("Yükləmə funksiyası tezliklə əlavə olunacaq");
    };

    return (
        <div
            className="flex items-center bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-150 animate-in fade-in slide-in-from-bottom-2"
        >
            {/* Icon */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${getIconBg(file.fileType)}`}>
                {getFileIcon(file.fileType)}
            </div>

            {/* Info */}
            <div className="flex-1 ml-4 min-w-0">
                <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">{file.fileName}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{file.size} • {file.fileType.toUpperCase()}</p>
            </div>

            {/* Action */}
            <button
                onClick={handleDownload}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                title="Yüklə"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
            </button>
        </div>
    );
};

export default FileCard;
