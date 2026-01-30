import React, { useState, useEffect, useRef, KeyboardEvent, ClipboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const OtpVerification: React.FC = () => {
    const navigate = useNavigate();
    const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
    const [timer, setTimer] = useState(59);
    const [canResend, setCanResend] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const email = sessionStorage.getItem('resetEmail') || '';
    const maskedEmail = email ? `${email.charAt(0)}***@${email.split('@')[1] || 'company.com'}` : 'r***@company.com';

    useEffect(() => {
        if (!email) {
            navigate('/forgot-password');
            return;
        }

        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, [email, navigate]);

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(interval);
        } else {
            setCanResend(true);
        }
    }, [timer]);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);
        setError(null);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === 'ArrowRight' && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const newOtp = [...otp];

        for (let i = 0; i < pastedData.length; i++) {
            newOtp[i] = pastedData[i];
        }

        setOtp(newOtp);

        const focusIndex = Math.min(pastedData.length, 5);
        inputRefs.current[focusIndex]?.focus();
    };

    const handleVerify = async () => {
        const otpValue = otp.join('');

        if (otpValue.length !== 6) {
            setError('Zəhmət olmasa bütün 6 rəqəmi daxil edin');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            sessionStorage.setItem('resetOtp', otpValue);
            navigate('/reset-password');
        } catch {
            setError('Yanlış təsdiq kodu. Zəhmət olmasa bir daha cəhd edin.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!canResend) return;

        setTimer(59);
        setCanResend(false);
        setOtp(Array(6).fill(''));
        setError(null);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-background-light-reset dark:bg-background-dark-reset font-display antialiased text-gray-900 dark:text-white min-h-screen flex flex-col justify-center items-center p-4">
            {/* Card Container */}
            <div className="w-full max-w-[480px] bg-white dark:bg-[#1e2329] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-gray-800 overflow-hidden">
                {/* Header Section */}
                <div className="px-8 pt-10 pb-6 text-center">
                    {/* Icon */}
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 dark:bg-primary/20 mb-6">
                        <span className="material-symbols-outlined text-[32px] text-primary dark:text-gray-200">shield_lock</span>
                    </div>

                    {/* Headline */}
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
                        Kimliyi Təsdiqlə
                    </h2>

                    {/* Body Text */}
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                        Təhlükəsizliyiniz üçün 6 rəqəmli kod göndərildi: <br />
                        <span className="font-semibold text-gray-900 dark:text-gray-200">{maskedEmail}</span>
                    </p>
                </div>

                {/* Form Section */}
                <div className="px-8 pb-10">
                    {error && (
                        <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
                        </div>
                    )}

                    {/* OTP Inputs */}
                    <div className="flex justify-center mb-8">
                        <fieldset className="flex gap-2 sm:gap-3">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => { inputRefs.current[index] = el; }}
                                    aria-label={`Digit ${index + 1}`}
                                    className="w-10 h-10 sm:w-12 sm:h-12 text-center bg-white dark:bg-background-dark-reset border border-gray-300 dark:border-gray-600 rounded-lg text-lg font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:focus:border-gray-400 transition-all text-gray-900 dark:text-white placeholder-gray-300"
                                    maxLength={1}
                                    type="text"
                                    inputMode="numeric"
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={handlePaste}
                                />
                            ))}
                        </fieldset>
                    </div>

                    {/* Verify Button */}
                    <button
                        className="w-full h-12 flex items-center justify-center rounded-lg bg-primary hover:bg-[#202e3d] text-white font-semibold text-base shadow-sm transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                        onClick={handleVerify}
                        disabled={loading}
                    >
                        {loading ? (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            'Kodu təsdiqlə'
                        )}
                    </button>

                    {/* Resend Timer */}
                    <div className="mt-6 text-center">
                        {canResend ? (
                            <button
                                className="text-sm text-primary hover:text-primary-hover font-medium transition-colors"
                                onClick={handleResend}
                            >
                                Kodu yenidən göndər
                            </button>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Kodu yenidən göndər: <span className="font-medium text-gray-700 dark:text-gray-300 tabular-nums">{formatTime(timer)}</span>
                            </p>
                        )}
                    </div>

                    {/* Additional Help */}
                    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-center">
                        <Link className="text-sm text-primary dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium inline-flex items-center gap-1 transition-colors" to="/login">
                            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                            Girişə qayıt
                        </Link>
                    </div>
                </div>
            </div>

            {/* Background Pattern */}
            <div className="fixed inset-0 -z-10 pointer-events-none opacity-40 dark:opacity-20 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]"></div>
        </div>
    );
};

export default OtpVerification;
