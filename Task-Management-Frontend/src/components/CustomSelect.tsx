import React, { useState, useRef, useEffect } from 'react';

interface Option {
    value: string;
    label: string;
}

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    icon?: string;
    placeholder?: string;
    className?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
    value,
    onChange,
    options,
    icon,
    placeholder = 'Select...',
    className = '',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white dark:bg-[#1a202c] border border-[#dcdfe5] dark:border-gray-700 rounded-lg text-sm font-medium text-[#111318] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 h-[42px]"
            >
                <div className="flex items-center gap-2 truncate">
                    {icon && (
                        <span className="material-symbols-outlined text-[#636f88] text-[20px]">
                            {icon}
                        </span>
                    )}
                    <span className={`truncate ${!selectedOption ? 'text-[#636f88]' : ''}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <span className={`material-symbols-outlined text-[#636f88] text-[20px] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    expand_more
                </span>
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-full min-w-[200px] bg-white dark:bg-[#1a202c] border border-[#dcdfe5] dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-[300px] overflow-y-auto">
                    <div className="p-1">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${value === option.value
                                        ? 'bg-primary/10 text-primary font-medium'
                                        : 'text-[#111318] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                            >
                                <span className="truncate text-left">{option.label}</span>
                                {value === option.value && (
                                    <span className="material-symbols-outlined text-[16px]">check</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomSelect;
