import React from 'react';
import { useChatbot } from './ChatbotProvider';

const QuickActions: React.FC = () => {
    const { sendMessage } = useChatbot();

    const handleAction = (text: string) => {
        sendMessage(text);
    };

    return (
        <div className="flex flex-wrap gap-2 ml-10 mt-2">
            <button
                onClick={() => handleAction("Aktiv tapşırıqlar")}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-blue-100 dark:border-slate-600 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            >
                📋 Aktiv tapşırıqlar
            </button>
            <button
                onClick={() => handleAction("Son fayllar")}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-blue-100 dark:border-slate-600 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            >
                📁 Son fayllar
            </button>
        </div>
    );
};

export default QuickActions;
