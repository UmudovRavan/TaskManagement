import React from 'react';
import { DifficultyLevel } from '../dto';

interface DifficultyDotsProps {
    difficulty: number;
}

const DifficultyDots: React.FC<DifficultyDotsProps> = ({ difficulty }) => {
    const getDifficultyConfig = () => {
        switch (difficulty) {
            case DifficultyLevel.Easy:
                return { level: 1, color: 'bg-green-500', label: 'Easy' };
            case DifficultyLevel.Medium:
                return { level: 2, color: 'bg-yellow-500', label: 'Medium' };
            case DifficultyLevel.Hard:
                return { level: 3, color: 'bg-red-500', label: 'Hard' };
            default:
                return { level: 1, color: 'bg-gray-400', label: 'Unknown' };
        }
    };

    const config = getDifficultyConfig();

    return (
        <div className="flex items-center gap-1.5" title={config.label}>
            {[1, 2, 3].map((dot) => (
                <div
                    key={dot}
                    className={`size-2 rounded-full ${dot <= config.level ? config.color : 'bg-gray-200 dark:bg-gray-600'
                        }`}
                />
            ))}
            <span className="text-xs text-[#636f88] dark:text-gray-400 ml-1">{config.label}</span>
        </div>
    );
};

export default DifficultyDots;
