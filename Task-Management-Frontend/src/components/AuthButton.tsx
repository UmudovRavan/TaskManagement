import React from 'react';

interface AuthButtonProps {
    type?: 'button' | 'submit';
    onClick?: () => void;
    disabled?: boolean;
    loading?: boolean;
    children: React.ReactNode;
    variant?: 'login' | 'register' | 'reset' | 'otp' | 'success';
    className?: string;
}

const AuthButton: React.FC<AuthButtonProps> = ({
    type = 'submit',
    onClick,
    disabled = false,
    loading = false,
    children,
    variant = 'login',
    className,
}) => {
    const getButtonClass = () => {
        if (className) return className;

        const baseDisabled = disabled || loading ? 'opacity-70 cursor-not-allowed' : '';

        switch (variant) {
            case 'register':
                return `w-full flex justify-center items-center gap-2 bg-primary-register hover:bg-primary-register/90 text-white font-semibold rounded-lg h-12 px-6 transition-all shadow-sm hover:shadow active:scale-[0.99] ${baseDisabled}`;
            case 'reset':
                return `w-full cursor-pointer flex items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary hover:bg-[#1e2b3a] transition-colors text-white text-base font-bold leading-normal tracking-[0.015em] shadow-sm ${baseDisabled}`;
            case 'otp':
                return `w-full h-12 flex items-center justify-center rounded-lg bg-primary hover:bg-[#202e3d] text-white font-semibold text-base shadow-sm transition-colors duration-200 ${baseDisabled}`;
            case 'success':
                return `w-full flex items-center justify-center gap-2 h-11 bg-primary-success hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-success/50 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${baseDisabled}`;
            default:
                return `w-full flex justify-center items-center py-3 px-4 rounded-md shadow-md shadow-primary/10 text-sm font-semibold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary transition-all duration-200 transform hover:-translate-y-0.5 ${baseDisabled}`;
        }
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={getButtonClass()}
        >
            {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : (
                children
            )}
        </button>
    );
};

export default AuthButton;
