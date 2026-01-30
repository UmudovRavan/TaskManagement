import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../api';
import type { AxiosError } from 'axios';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await authService.login({
                email: formData.email,
                password: formData.password,
            });
            authService.setToken(response.token);
            navigate('/dashboard');
        } catch (err) {
            const axiosError = err as AxiosError<{ message?: string; title?: string }>;
            const errorMessage =
                axiosError.response?.data?.message ||
                axiosError.response?.data?.title ||
                'E-poçt və ya şifrə yanlışdır. Zəhmət olmasa yenidən cəhd edin.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="font-sans bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col items-center justify-center transition-colors duration-300 antialiased-clean relative selection:bg-primary/20 selection:text-primary">
            <div className="w-full max-w-[440px] px-4 sm:px-6 relative z-10">
                <div className="bg-white dark:bg-surface-dark rounded-xl shadow-soft border border-slate-200/60 dark:border-slate-800 p-8 sm:p-10 relative overflow-hidden">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-slate-50 dark:bg-slate-800 text-primary mb-5 ring-1 ring-slate-100 dark:ring-slate-700">
                            <span className="material-symbols-outlined text-[26px]">shield_lock</span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">Təhlükəsiz Giriş</h1>
                        <p className="text-[14px] text-slate-500 dark:text-slate-400">Davam etmək üçün məlumatlarınızı daxil edin.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div className="space-y-1.5 group">
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider ml-1" htmlFor="email">
                                E-poçt ünvanı
                            </label>
                            <div className="relative">
                                <input
                                    className="block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-surface-dark text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/5 shadow-sm h-11 px-4 text-[15px] transition-all duration-200"
                                    id="email"
                                    name="email"
                                    placeholder="ad@sirket.com"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5 group">
                            <div className="flex justify-between items-center ml-1">
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider" htmlFor="password">
                                    Şifrə
                                </label>
                            </div>
                            <div className="relative">
                                <input
                                    className="block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-surface-dark text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/5 shadow-sm h-11 px-4 text-[15px] transition-all duration-200"
                                    id="password"
                                    name="password"
                                    placeholder="••••••••"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="flex justify-end pt-1">
                                <Link className="text-xs font-medium text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-white transition-colors" to="/forgot-password">
                                    Şifrəni unutmusunuz?
                                </Link>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                className="w-full flex justify-center items-center py-3 px-4 rounded-md shadow-md shadow-primary/10 text-sm font-semibold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? (
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    'Daxil ol'
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Hesabınız yoxdur?{' '}
                            <Link className="text-primary hover:text-primary-hover font-semibold hover:underline transition-colors" to="/register">
                                Hesab yarat
                            </Link>
                        </p>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-1.5 text-slate-400 select-none cursor-help opacity-80 hover:opacity-100 transition-opacity" title="Your connection is encrypted">
                            <span className="material-symbols-outlined text-[14px]">lock</span>
                            <span className="text-[10px] font-semibold tracking-wider uppercase">SSL Qorunur</span>
                        </div>
                        <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium">
                            <a className="hover:text-primary dark:hover:text-slate-300 transition-colors" href="#">Məxfilik Siyasəti</a>
                            <a className="hover:text-primary dark:hover:text-slate-300 transition-colors" href="#">Şərtlər</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
