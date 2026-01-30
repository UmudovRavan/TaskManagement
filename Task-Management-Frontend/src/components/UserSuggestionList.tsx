import React, { useEffect, useRef } from 'react';
import type { UserResponse } from '../dto';

interface UserSuggestionListProps {
    users: UserResponse[];
    onSelect: (user: UserResponse) => void;
    position: { top: number; left: number };
    selectedIndex: number;
}

const UserSuggestionList: React.FC<UserSuggestionListProps> = ({
    users,
    onSelect,
    position,
    selectedIndex,
}) => {
    const listRef = useRef<HTMLUListElement>(null);

    useEffect(() => {
        if (listRef.current) {
            const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedIndex]);

    if (users.length === 0) return null;

    return (
        <ul
            ref={listRef}
            className="absolute z-50 w-72 bg-white dark:bg-card-dark border border-gray-200 dark:border-input-border-dark rounded-lg shadow-xl max-h-48 overflow-y-auto"
            style={{ top: position.top, left: position.left }}
        >
            {users.map((user, index) => (
                <li
                    key={user.id}
                    className={`px-4 py-2.5 cursor-pointer flex items-center gap-3 transition-colors duration-150 ${index === selectedIndex
                        ? 'bg-primary/10 text-primary'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                    onClick={() => onSelect(user)}
                >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-xs text-white font-bold shadow-sm">
                        {user.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">{user.userName}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{user.email}</span>
                    </div>
                </li>
            ))}
        </ul>
    );
};

export default UserSuggestionList;
