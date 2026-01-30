import React from 'react';

interface KpiCardProps {
    title: string;
    value: number | string;
    subtitle?: string;
    subtitleColor?: 'default' | 'red' | 'green';
    icon: string;
    iconBgColor: string;
    iconColor: string;
    showProgress?: boolean;
    progressValue?: number;
    progressLabel?: string;
    trendIcon?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({
    title,
    value,
    subtitle,
    subtitleColor = 'default',
    icon,
    iconBgColor,
    iconColor,
    showProgress = false,
    progressValue = 0,
    progressLabel,
    trendIcon,
}) => {
    const getSubtitleClass = () => {
        switch (subtitleColor) {
            case 'red':
                return 'text-red-600';
            case 'green':
                return 'text-green-600 flex items-center';
            default:
                return 'text-[#636f88] dark:text-gray-500';
        }
    };

    return (
        <div className="flex flex-col justify-between rounded-xl border border-[#e5e7eb] dark:border-input-border-dark bg-white dark:bg-card-dark p-5 shadow-sm">
            <div className={`flex items-center justify-between ${showProgress ? 'mb-2' : ''}`}>
                <span className="text-sm font-medium text-[#636f88] dark:text-gray-400">{title}</span>
                {showProgress ? (
                    <span className="text-sm font-bold text-[#111318] dark:text-white">{value}%</span>
                ) : (
                    <div className={`flex size-8 items-center justify-center rounded-full ${iconBgColor} ${iconColor}`}>
                        <span className="material-symbols-outlined text-[20px]">{icon}</span>
                    </div>
                )}
            </div>

            {showProgress ? (
                <div className="flex flex-col justify-end h-full gap-2">
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#f0f2f4] dark:bg-gray-700">
                        <div
                            className="absolute left-0 top-0 h-full rounded-full bg-primary"
                            style={{ width: `${progressValue}%` }}
                        ></div>
                    </div>
                    <span className="text-xs font-medium text-[#636f88] dark:text-gray-500">{progressLabel}</span>
                </div>
            ) : (
                <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-[#111318] dark:text-white">{value}</span>
                    {subtitle && (
                        <span className={`text-xs font-medium ${getSubtitleClass()}`}>
                            {trendIcon && (
                                <span className="material-symbols-outlined text-[14px] mr-0.5">{trendIcon}</span>
                            )}
                            {subtitle}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default KpiCard;
