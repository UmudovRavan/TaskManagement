import React, { useRef, useEffect, type KeyboardEvent, type ClipboardEvent } from 'react';

interface OtpInputProps {
    length?: number;
    value: string[];
    onChange: (value: string[]) => void;
    disabled?: boolean;
}

const OtpInput: React.FC<OtpInputProps> = ({
    length = 6,
    value,
    onChange,
    disabled = false,
}) => {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []);

    const handleChange = (index: number, inputValue: string) => {
        if (!/^\d*$/.test(inputValue)) return;

        const newValue = [...value];
        newValue[index] = inputValue.slice(-1);
        onChange(newValue);

        if (inputValue && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !value[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === 'ArrowRight' && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
        const newValue = [...value];

        for (let i = 0; i < pastedData.length; i++) {
            newValue[i] = pastedData[i];
        }

        onChange(newValue);

        const focusIndex = Math.min(pastedData.length, length - 1);
        inputRefs.current[focusIndex]?.focus();
    };

    return (
        <fieldset className="flex gap-2 sm:gap-3">
            {Array.from({ length }).map((_, index) => (
                <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    aria-label={`Digit ${index + 1}`}
                    className="w-10 h-10 sm:w-12 sm:h-12 text-center bg-white dark:bg-background-dark-reset border border-gray-300 dark:border-gray-600 rounded-lg text-lg font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:focus:border-gray-400 transition-all text-gray-900 dark:text-white placeholder-gray-300"
                    maxLength={1}
                    type="text"
                    inputMode="numeric"
                    value={value[index] || ''}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    disabled={disabled}
                />
            ))}
        </fieldset>
    );
};

export default OtpInput;
