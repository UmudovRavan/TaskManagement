import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../api';
import type { AxiosError } from 'axios';

const Register: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
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

        if (formData.password !== formData.confirmPassword) {
            setError('Şifrələr uyğun gəlmir');
            return;
        }

        if (formData.password.length < 8) {
            setError('Şifrə ən azı 8 simvoldan ibarət olmalıdır');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await authService.register({
                email: formData.email,
                password: formData.password,
                phoneNumber: undefined,
            });
            navigate('/login');
        } catch (err) {
            const axiosError = err as AxiosError<{ message?: string; title?: string }>;
            const errorMessage =
                axiosError.response?.data?.message ||
                axiosError.response?.data?.title ||
                'Qeydiyyat uğursuz oldu. Zəhmət olmasa yenidən cəhd edin.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-background-light-register dark:bg-background-dark-register font-display min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 transition-colors duration-200">
            {/* Background Decoration */}
            <div aria-hidden="true" className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-primary-register/5 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] bg-primary-register/5 rounded-full blur-3xl"></div>
            </div>

            {/* Main Card Container */}
            <main className="relative z-10 w-full max-w-[520px] bg-card-light dark:bg-card-dark rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden">
                {/* Header Section */}
                <div className="px-8 pt-10 pb-6 flex flex-col items-center text-center">
                    {/* Logo Mark */}
                    <div className="w-14 h-14 bg-primary-register/10 rounded-xl flex items-center justify-center mb-6 text-primary-register">
                        <span className="material-symbols-outlined text-3xl">grid_view</span>
                    </div>
                    <h1 className="text-text-main-light dark:text-text-main-dark text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                        Hesabınızı yaradın
                    </h1>
                    <p className="text-text-muted-light dark:text-text-muted-dark text-base font-normal leading-relaxed max-w-sm">
                        Təhlükəsiz iş sahəsi ilə dərhal tapşırıqlarınızı idarə etməyə başlayın.
                    </p>
                </div>

                {/* Form Section */}
                <div className="px-8 pb-10 w-full">
                    {error && (
                        <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                        {/* Name Row */}
                        <div className="flex flex-col sm:flex-row gap-5">
                            <div className="flex-1 flex flex-col gap-2">
                                <label className="text-text-main-light dark:text-text-main-dark text-sm font-medium" htmlFor="firstName">Ad</label>
                                <div className="relative">
                                    <input
                                        className="form-input block w-full rounded-lg border-input-border-light dark:border-input-border-dark bg-background-light-register dark:bg-background-dark-register text-text-main-light dark:text-text-main-dark h-12 px-4 py-3 placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark focus:border-primary-register focus:ring-1 focus:ring-primary-register transition-colors text-base"
                                        id="firstName"
                                        name="firstName"
                                        placeholder="məs. Əli"
                                        type="text"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col gap-2">
                                <label className="text-text-main-light dark:text-text-main-dark text-sm font-medium" htmlFor="lastName">Soyad</label>
                                <div className="relative">
                                    <input
                                        className="form-input block w-full rounded-lg border-input-border-light dark:border-input-border-dark bg-background-light-register dark:bg-background-dark-register text-text-main-light dark:text-text-main-dark h-12 px-4 py-3 placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark focus:border-primary-register focus:ring-1 focus:ring-primary-register transition-colors text-base"
                                        id="lastName"
                                        name="lastName"
                                        placeholder="məs. Vəliyev"
                                        type="text"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Email */}
                        <div className="flex flex-col gap-2">
                            <label className="text-text-main-light dark:text-text-main-dark text-sm font-medium" htmlFor="email">İş E-poçtu</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted-light dark:text-text-muted-dark">
                                    <span className="material-symbols-outlined text-[20px]">mail</span>
                                </span>
                                <input
                                    className="form-input block w-full rounded-lg border-input-border-light dark:border-input-border-dark bg-background-light-register dark:bg-background-dark-register text-text-main-light dark:text-text-main-dark h-12 pl-10 pr-4 py-3 placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark focus:border-primary-register focus:ring-1 focus:ring-primary-register transition-colors text-base"
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

                        {/* Password */}
                        <div className="flex flex-col gap-2">
                            <label className="text-text-main-light dark:text-text-main-dark text-sm font-medium" htmlFor="password">Şifrə</label>
                            <div className="relative group">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted-light dark:text-text-muted-dark group-focus-within:text-primary-register transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">lock</span>
                                </span>
                                <input
                                    className="form-input block w-full rounded-lg border-input-border-light dark:border-input-border-dark bg-background-light-register dark:bg-background-dark-register text-text-main-light dark:text-text-main-dark h-12 pl-10 pr-4 py-3 placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark focus:border-primary-register focus:ring-1 focus:ring-primary-register transition-colors text-base"
                                    id="password"
                                    name="password"
                                    placeholder="••••••••"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            {/* Password Rules Helper */}
                            <div className="flex items-start gap-1.5 mt-0.5">
                                <span className="material-symbols-outlined text-[14px] text-text-muted-light dark:text-text-muted-dark pt-0.5">info</span>
                                <p className="text-xs text-text-muted-light dark:text-text-muted-dark leading-tight">
                                    Ən azı 8 simvol olmalı, bir böyük hərf və bir rəqəm ehtiva etməlidir.
                                </p>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="flex flex-col gap-2">
                            <label className="text-text-main-light dark:text-text-main-dark text-sm font-medium" htmlFor="confirmPassword">Şifrəni Təsdiqlə</label>
                            <div className="relative group">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted-light dark:text-text-muted-dark group-focus-within:text-primary-register transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                                </span>
                                <input
                                    className="form-input block w-full rounded-lg border-input-border-light dark:border-input-border-dark bg-background-light-register dark:bg-background-dark-register text-text-main-light dark:text-text-main-dark h-12 pl-10 pr-4 py-3 placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark focus:border-primary-register focus:ring-1 focus:ring-primary-register transition-colors text-base"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    placeholder="••••••••"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2">
                            <button
                                className="w-full flex justify-center items-center gap-2 bg-primary-register hover:bg-primary-register/90 text-white font-semibold rounded-lg h-12 px-6 transition-all shadow-sm hover:shadow active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? (
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    'Hesab Yarat'
                                )}
                            </button>
                        </div>

                        {/* Footer Link */}
                        <div className="text-center pt-2">
                            <p className="text-sm text-text-main-light dark:text-text-main-dark">
                                Artıq hesabınız var?{' '}
                                <Link className="text-primary-register hover:text-primary-register/80 font-semibold hover:underline" to="/login">Daxil ol</Link>
                            </p>
                        </div>
                    </form>
                </div>
            </main>

            {/* Footer Credits / Legal Links */}
            <footer className="mt-8 text-center">
                <div className="flex gap-6 justify-center text-xs text-text-muted-light dark:text-text-muted-dark">
                    <a className="hover:text-primary-register transition-colors" href="#">Xidmət Şərtləri</a>
                    <a className="hover:text-primary-register transition-colors" href="#">Məxfilik Siyasəti</a>
                    <a className="hover:text-primary-register transition-colors" href="#">Kömək Mərkəzi</a>
                </div>
                <p className="mt-4 text-xs text-text-muted-light/60 dark:text-text-muted-dark/60">
                    © 2024 Enterprise Task System. Bütün hüquqlar qorunur.
                </p>
            </footer>
        </div>
    );
};

export default Register;
