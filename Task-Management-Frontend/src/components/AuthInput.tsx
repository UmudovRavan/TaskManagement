import React from 'react';

interface AuthInputProps {
    id: string;
    name: string;
    type: string;
    label: string;
    placeholder: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    error?: string;
    icon?: React.ReactNode;
    labelClassName?: string;
    inputClassName?: string;
    variant?: 'login' | 'register' | 'reset';
}

const AuthInput: React.FC<AuthInputProps> = ({
    id,
    name,
    type,
    label,
    placeholder,
    value,
    onChange,
    error,
    icon,
    labelClassName,
    inputClassName,
    variant = 'login',
}) => {
    const getLabelClass = () => {
        if (labelClassName) return labelClassName;

        switch (variant) {
            case 'register':
                return 'text-text-main-light dark:text-text-main-dark text-sm font-medium';
            case 'reset':
                return 'text-[#121417] dark:text-gray-200 text-sm font-medium leading-normal pb-2';
            default:
                return 'block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider ml-1';
        }
    };

    const getInputClass = () => {
        if (inputClassName) return inputClassName;

        const baseClass = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/5' : '';

        switch (variant) {
            case 'register':
                return `form-input block w-full rounded-lg border-input-border-light dark:border-input-border-dark bg-background-light-register dark:bg-background-dark-register text-text-main-light dark:text-text-main-dark h-12 ${icon ? 'pl-10' : 'px-4'} pr-4 py-3 placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark focus:border-primary-register focus:ring-1 focus:ring-primary-register transition-colors text-base ${baseClass}`;
            case 'reset':
                return `form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#121417] dark:text-white dark:bg-[#2f333a] focus:outline-0 focus:ring-2 focus:ring-primary/20 border border-[#d7dbe0] dark:border-[#4b5563] focus:border-primary h-12 placeholder:text-[#9aa2ac] dark:placeholder:text-gray-500 px-4 text-base font-normal leading-normal transition-colors duration-200 ${baseClass}`;
            default:
                return `block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-surface-dark text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/5 shadow-sm h-11 px-4 text-[15px] transition-all duration-200 ${baseClass}`;
        }
    };

    return (
        <div className={variant === 'register' ? 'flex flex-col gap-2' : 'space-y-1.5 group'}>
            <label className={getLabelClass()} htmlFor={id}>
                {label}
            </label>
            <div className={variant === 'register' && icon ? 'relative group' : 'relative'}>
                {icon && (
                    <span className={
                        variant === 'register'
                            ? 'absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted-light dark:text-text-muted-dark group-focus-within:text-primary-register transition-colors'
                            : variant === 'reset'
                                ? 'absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400'
                                : 'absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'
                    }>
                        {icon}
                    </span>
                )}
                <input
                    className={getInputClass()}
                    id={id}
                    name={name}
                    placeholder={placeholder}
                    type={type}
                    value={value}
                    onChange={onChange}
                />
            </div>
            {error && (
                <p className="text-red-500 text-xs mt-1">{error}</p>
            )}
        </div>
    );
};

export default AuthInput;
