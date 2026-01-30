import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Calendar, AlertCircle, Paperclip, User } from 'lucide-react';
import { DifficultyLevel } from '../dto';
import type { UserResponse } from '../dto';
import { taskService, userService } from '../api';
import { parseJwtToken } from '../utils';

import UserSuggestionList from './UserSuggestionList';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTaskCreated: () => void;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
    isOpen,
    onClose,
    onTaskCreated,
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [difficulty, setDifficulty] = useState<DifficultyLevel>(DifficultyLevel.Medium);
    const [deadline, setDeadline] = useState('');
    const [assignedUser, setAssignedUser] = useState<UserResponse | null>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Mention logic state
    const [allUsers, setAllUsers] = useState<UserResponse[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [suggestionIndex, setSuggestionIndex] = useState(0);

    // Mention logic for assigned user
    const [assignInputValue, setAssignInputValue] = useState('');
    const assignInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
            // Reset state
            setTitle('');
            setDescription('');
            setDifficulty(DifficultyLevel.Medium);
            setDeadline('');
            setAssignedUser(null);
            setFiles([]);
            setError(null);
            setAssignInputValue('');
            setShowSuggestions(false);
            setMentionQuery('');
        }
    }, [isOpen]);

    // Handle ESC key to close modal
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Disable body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const fetchUsers = async () => {
        try {
            const data = await userService.getAllUsers();
            setAllUsers(data);
        } catch (err) {
            console.error('Failed to fetch users', err);
        }
    };

    // Filter only Employees and only when there's a search query
    const filteredUsers = useMemo(() => {
        // Only show suggestions if user has typed something
        if (!mentionQuery || mentionQuery.trim().length === 0) {
            return [];
        }

        // Filter only Employees
        const employees = allUsers.filter(u => u.role?.toLowerCase() === 'employee' || !u.role);

        const query = mentionQuery.toLowerCase();
        return employees.filter(
            (u) =>
                u.userName.toLowerCase().includes(query) ||
                u.email.toLowerCase().includes(query)
        );
    }, [allUsers, mentionQuery]);

    const handleAssignInputStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setAssignInputValue(value);

        // Check for @ trigger
        const lastAtPos = value.lastIndexOf('@');
        if (lastAtPos !== -1) {
            const queryAfterAt = value.substring(lastAtPos + 1);
            // Only show suggestions if there's at least 1 character after @
            if (queryAfterAt.length > 0) {
                setShowSuggestions(true);
                setMentionQuery(queryAfterAt);
                setSuggestionIndex(0);
            } else {
                setShowSuggestions(false);
                setMentionQuery('');
            }
        } else {
            // No @ found, don't show suggestions
            setShowSuggestions(false);
            setMentionQuery('');
        }
    };

    const handleUserSelect = (user: UserResponse) => {
        setAssignedUser(user);
        setAssignInputValue('');
        setShowSuggestions(false);
        setMentionQuery('');
        assignInputRef.current?.blur();
    };

    // Handle keyboard navigation for suggestions
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (showSuggestions && filteredUsers.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSuggestionIndex(prev => (prev + 1) % filteredUsers.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSuggestionIndex(prev => (prev - 1 + filteredUsers.length) % filteredUsers.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                handleUserSelect(filteredUsers[suggestionIndex]);
            } else if (e.key === 'Escape') {
                setShowSuggestions(false);
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            setError('Tapşırıq başlığı mütləqdir');
            return;
        }
        if (!description.trim()) {
            setError('Tapşırıq təsviri mütləqdir');
            return;
        }
        if (!deadline) {
            setError('Son tarix mütləqdir');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Get current user ID from token - use correct key 'authToken'
            const token = localStorage.getItem('authToken');
            let createdByUserId = '';

            if (token) {
                const userInfo = parseJwtToken(token);
                if (userInfo) {
                    createdByUserId = userInfo.userId;
                }
            }

            if (!createdByUserId) {
                throw new Error('İstifadəçi sessiyası etibarsızdır. Zəhmət olmasa yenidən daxil olun.');
            }

            // Format deadline properly for backend (ISO format)
            const formattedDeadline = new Date(deadline).toISOString();

            const newTask = {
                title: title.trim(),
                description: description.trim(),
                difficulty,
                status: 0, // Pending
                deadline: formattedDeadline,
                assignedToUserId: assignedUser?.id || undefined, // Ensure it's undefined if no user selected
                createdByUserId,
            };

            console.log('Creating task with data:', newTask);
            const result = await taskService.createTask(newTask, files.length > 0 ? files : undefined);
            console.log('Task created successfully:', result);

            // Task created successfully - close modal and refresh
            onTaskCreated();
            onClose();
        } catch (err: any) {
            console.error('Task creation error details:', {
                error: err,
                response: err.response,
                status: err.response?.status,
                data: err.response?.data
            });

            // Only show error if status is not 2xx
            if (err.response?.status && err.response.status >= 200 && err.response.status < 300) {
                // Success response - don't show error
                console.log('Task created successfully despite error catch');
                onTaskCreated();
                onClose();
                return;
            }

            // Actual error - show message
            if (err.response) {
                // Server responded with error status
                const message = err.response?.data?.message
                    || err.response?.data?.title
                    || (typeof err.response?.data === 'string' ? err.response.data : null)
                    || 'Tapşırıq yaradıla bilmədi';
                setError(message);
            } else if (err.request) {
                // Request was made but no response received
                setError('Server cavab vermir. Zəhmət olmasa bir daha cəhd edin.');
            } else {
                // Something else went wrong
                setError(err.message || 'Tapşırıq yaradıla bilmədi');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle backdrop click
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/75 backdrop-blur-sm transition-opacity"
            onClick={handleBackdropClick}
        >
            <div
                className="bg-white dark:bg-card-dark border border-gray-200 dark:border-input-border-dark w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden"
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-input-border-dark bg-gray-50 dark:bg-surface-dark/50">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-main-dark tracking-tight">Yeni Tapşırıq Yarat</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {/* Title */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tapşırıq Başlığı <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="məs., Ana Səhifənin Yenidən Dizaynı"
                            className="w-full bg-white dark:bg-surface-dark border border-gray-300 dark:border-input-border-dark rounded-lg px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Təsvir <span className="text-red-500">*</span></label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Tapşırığın ətraflı təsviri..."
                            rows={3}
                            className="w-full bg-white dark:bg-surface-dark border border-gray-300 dark:border-input-border-dark rounded-lg px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Deadline */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Son Tarix <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500" size={18} />
                                <input
                                    type="datetime-local"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                    className="w-full bg-white dark:bg-surface-dark border border-gray-300 dark:border-input-border-dark rounded-lg pl-10 pr-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all dark:[color-scheme:dark]"
                                />
                            </div>
                        </div>

                        {/* Difficulty */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Çətinlik <span className="text-red-500">*</span></label>
                            <select
                                value={difficulty}
                                onChange={(e) => setDifficulty(Number(e.target.value) as DifficultyLevel)}
                                className="w-full bg-white dark:bg-surface-dark border border-gray-300 dark:border-input-border-dark rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                            >
                                <option value={DifficultyLevel.Easy}>Asan</option>
                                <option value={DifficultyLevel.Medium}>Orta</option>
                                <option value={DifficultyLevel.Hard}>Çətin</option>
                            </select>
                        </div>
                    </div>

                    {/* Assigned User - Mention Style (Optional) */}
                    <div className="space-y-1.5 relative">
                        <label className="text-sm font-medium text-gray-700">Təyin Et (İşçi) <span className="text-gray-400 text-xs font-normal">(İstəyə bağlı)</span></label>

                        {assignedUser ? (
                            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-surface-dark border border-gray-200 dark:border-input-border-dark rounded-lg">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                    {assignedUser.userName.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-900 dark:text-main-dark">{assignedUser.userName}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{assignedUser.email}</div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setAssignedUser(null)}
                                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                <input
                                    ref={assignInputRef}
                                    type="text"
                                    value={assignInputValue}
                                    onChange={handleAssignInputStringChange}
                                    onKeyDown={handleKeyDown}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    placeholder="İşçiləri axtarmaq üçün @istifadəçi_adı yazın..."
                                    className="w-full bg-white dark:bg-surface-dark border border-gray-300 dark:border-input-border-dark rounded-lg pl-10 pr-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                    autoComplete="off"
                                />
                                {showSuggestions && filteredUsers.length > 0 && (
                                    <UserSuggestionList
                                        users={filteredUsers}
                                        onSelect={handleUserSelect}
                                        position={{ top: 50, left: 0 }}
                                        selectedIndex={suggestionIndex}
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    {/* Attachments */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Əlavələr (İstəyə bağlı)</label>
                        <div className="relative group">
                            <input
                                type="file"
                                multiple
                                onChange={handleFileChange}
                                className="hidden"
                                id="file-upload"
                            />
                            <label
                                htmlFor="file-upload"
                                className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 dark:border-input-border-dark rounded-lg cursor-pointer bg-gray-50 dark:bg-surface-dark hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-primary/50 transition-all"
                            >
                                <div className="flex flex-col items-center justify-center py-4">
                                    <Paperclip className="w-6 h-6 mb-1 text-gray-400 dark:text-gray-500 group-hover:text-primary transition-colors" />
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        <span className="font-medium text-primary">Yükləmək üçün klikləyin</span> və ya sürükləyib buraxın
                                    </p>
                                </div>
                            </label>
                        </div>
                        {files.length > 0 && (
                            <ul className="space-y-1.5 mt-2">
                                {files.map((file, i) => (
                                    <li key={i} className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-surface-dark px-3 py-2 rounded-md border border-gray-200 dark:border-input-border-dark">
                                        <span className="truncate max-w-[90%]">{file.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                                            className="text-gray-400 hover:text-red-500"
                                        >
                                            <X size={14} />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                </form>

                {/* Footer */}
                <div className="flex items-center justify-end px-6 py-4 border-t border-gray-200 dark:border-input-border-dark bg-gray-50 dark:bg-surface-dark/50 gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                        disabled={isSubmitting}
                    >
                        Ləğv et
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-6 py-2 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                        {isSubmitting ? 'Yaradılır...' : 'Tapşırıq Yarat'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateTaskModal;
