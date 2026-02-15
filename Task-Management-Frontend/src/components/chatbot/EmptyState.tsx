import React from 'react';

const EmptyState: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center flex-1 h-full text-center p-8 text-slate-400 dark:text-slate-500 animate-in fade-in zoom-in duration-300">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">Heç bir nəticə tapılmadı</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-6">
                Sizin sorğunuza uyğun gələn tapşırıq və ya fayl tapılmadı. Fərqli açar sözlərlə yenidən cəhd edin.
            </p>
            <button
                onClick={() => document.querySelector<HTMLInputElement>('input[placeholder="Ask AI to filter or update..."]')?.focus()}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-sm text-sm"
            >
                Yenidən axtar
            </button>
        </div>
    );
};

export default EmptyState;
