import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../api';
import type { AxiosError } from 'axios';

const ResetPassword: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const email = sessionStorage.getItem('resetEmail') || '';
    const otp = sessionStorage.getItem('resetOtp') || '';

    useEffect(() => {
        if (!email || !otp) {
            navigate('/forgot-password');
        }
    }, [email, otp, navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Şifrələr uyğun gəlmir');
            return;
        }

        if (formData.newPassword.length < 8) {
            setError('Şifrə ən azı 8 simvol olmalıdır');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await authService.resetPassword({
                email,
                token: otp,
                newPassword: formData.newPassword,
            });

            sessionStorage.removeItem('resetEmail');
            sessionStorage.removeItem('resetOtp');

            navigate('/reset-success');
        } catch (err) {
            const axiosError = err as AxiosError<{ message?: string; title?: string }>;
            const errorMessage =
                axiosError.response?.data?.message ||
                axiosError.response?.data?.title ||
                'Şifrəni sıfırlamaq mümkün olmadı. Zəhmət olmasa bir daha cəhd edin.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-background-light-reset dark:bg-background-dark-reset text-[#121417] dark:text-gray-100 font-display min-h-screen flex flex-col justify-center items-center p-4">
            {/* Main Layout Container */}
            <div className="w-full max-w-[480px] bg-white dark:bg-[#22252a] rounded-xl shadow-sm border border-[#e5e7eb] dark:border-[#2f333a] overflow-hidden">
                {/* Decorative Image Area */}
                <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-80"
                        style={{
                            backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        }}
                    ></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-white/90 to-transparent dark:from-[#22252a]/90"></div>
                </div>

                <div className="px-8 pb-8 pt-2 flex flex-col items-center">
                    {/* Logo Icon */}
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 -mt-10 relative z-10 border-4 border-white dark:border-[#22252a]">
                        <span className="material-symbols-outlined text-primary text-2xl">lock</span>
                    </div>

                    {/* Headline Text */}
                    <div className="text-center mb-2">
                        <h2 className="text-[#121417] dark:text-white tracking-tight text-[28px] font-bold leading-tight">Yeni şifrə yaradın</h2>
                    </div>

                    {/* Body Text */}
                    <div className="text-center mb-8">
                        <p className="text-[#657281] dark:text-gray-400 text-base font-normal leading-normal">Yeni şifrənizi aşağıya daxil edin.</p>
                    </div>

                    {error && (
                        <div className="w-full mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form className="w-full space-y-6" onSubmit={handleSubmit}>
                        {/* New Password Field */}
                        <div className="flex flex-col w-full">
                            <label className="text-[#121417] dark:text-gray-200 text-sm font-medium leading-normal pb-2" htmlFor="newPassword">
                                Yeni Şifrə
                            </label>
                            <div className="relative">
                                <input
                                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#121417] dark:text-white dark:bg-[#2f333a] focus:outline-0 focus:ring-2 focus:ring-primary/20 border border-[#d7dbe0] dark:border-[#4b5563] focus:border-primary h-12 placeholder:text-[#9aa2ac] dark:placeholder:text-gray-500 px-4 text-base font-normal leading-normal transition-colors duration-200"
                                    id="newPassword"
                                    name="newPassword"
                                    placeholder="••••••••"
                                    required
                                    type="password"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                                    <span className="material-symbols-outlined text-xl">lock</span>
                                </div>
                            </div>
                        </div>

                        {/* Confirm Password Field */}
                        <div className="flex flex-col w-full">
                            <label className="text-[#121417] dark:text-gray-200 text-sm font-medium leading-normal pb-2" htmlFor="confirmPassword">
                                Şifrəni Təsdiqlə
                            </label>
                            <div className="relative">
                                <input
                                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#121417] dark:text-white dark:bg-[#2f333a] focus:outline-0 focus:ring-2 focus:ring-primary/20 border border-[#d7dbe0] dark:border-[#4b5563] focus:border-primary h-12 placeholder:text-[#9aa2ac] dark:placeholder:text-gray-500 px-4 text-base font-normal leading-normal transition-colors duration-200"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    placeholder="••••••••"
                                    required
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                                    <span className="material-symbols-outlined text-xl">lock_reset</span>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            className="w-full cursor-pointer flex items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary hover:bg-[#1e2b3a] transition-colors text-white text-base font-bold leading-normal tracking-[0.015em] shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <span className="truncate">Şifrəni Sıfırla</span>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* Simple Footer */}
            <div className="mt-8 text-center">
                <p className="text-xs text-[#9aa2ac] dark:text-gray-600">
                    © 2024 Enterprise Task Manager Inc. Bütün hüquqlar qorunur.
                </p>
            </div>
        </div>
    );
};

export default ResetPassword;
