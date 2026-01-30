import React from 'react';
import { Link } from 'react-router-dom';

const ResetSuccess: React.FC = () => {
    return (
        <div className="font-display bg-background-light-register dark:bg-background-dark-register min-h-screen flex flex-col overflow-x-hidden text-slate-900 dark:text-slate-100 antialiased">
            {/* Header */}
            <header className="w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4 md:px-10">
                <div className="mx-auto max-w-7xl flex items-center justify-between">
                    <div className="flex items-center gap-3 text-slate-900 dark:text-white">
                        <div className="size-6 text-primary-success">
                            <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                <g clipPath="url(#clip0_6_319)">
                                    <path d="M8.57829 8.57829C5.52816 11.6284 3.451 15.5145 2.60947 19.7452C1.76794 23.9758 2.19984 28.361 3.85056 32.3462C5.50128 36.3314 8.29667 39.7376 11.8832 42.134C15.4698 44.5305 19.6865 45.8096 24 45.8096C28.3135 45.8096 32.5302 44.5305 36.1168 42.134C39.7033 39.7375 42.4987 36.3314 44.1494 32.3462C45.8002 28.361 46.2321 23.9758 45.3905 19.7452C44.549 15.5145 42.4718 11.6284 39.4217 8.57829L24 24L8.57829 8.57829Z" fill="currentColor"></path>
                                </g>
                                <defs>
                                    <clipPath id="clip0_6_319"><rect fill="white" height="48" width="48"></rect></clipPath>
                                </defs>
                            </svg>
                        </div>
                        <h2 className="text-lg font-bold leading-tight tracking-tight">Task Manager</h2>
                    </div>
                    <a className="text-sm font-medium text-slate-500 hover:text-primary-success dark:text-slate-400 dark:hover:text-primary-success transition-colors" href="#">Kömək lazımdır?</a>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
                <div className="w-full max-w-[480px] bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-8 sm:p-12 flex flex-col items-center text-center">
                    {/* Success Icon */}
                    <div className="mb-8 flex items-center justify-center">
                        <div className="relative flex items-center justify-center w-24 h-24 bg-green-50 dark:bg-green-900/20 rounded-full">
                            <span className="material-symbols-outlined text-5xl text-green-500 dark:text-green-400 select-none">check</span>
                            {/* Decorative subtle ring */}
                            <div className="absolute inset-0 rounded-full border border-green-100 dark:border-green-800 opacity-50"></div>
                        </div>
                    </div>

                    {/* Text Content */}
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
                        Şifrə uğurla sıfırlandı
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-sm mb-10">
                        Şifrəniz yeniləndi. Artıq yeni şifrənizlə daxil ola bilərsiniz.
                    </p>

                    {/* Action Button */}
                    <Link
                        to="/login"
                        className="w-full flex items-center justify-center gap-2 h-11 bg-primary-success hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-success/50 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                    >
                        <span>Girişə qayıt</span>
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </Link>
                </div>

                {/* Footer / Copyright */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        © 2024 Enterprise Task Manager. Bütün hüquqlar qorunur.
                    </p>
                </div>
            </main>
        </div>
    );
};

export default ResetSuccess;
