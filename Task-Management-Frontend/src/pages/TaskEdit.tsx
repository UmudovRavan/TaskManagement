import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Sidebar, Header } from '../layout';
import { taskService, authService, notificationService, userService } from '../api';
import type { TaskResponse, NotificationResponse, UserResponse } from '../dto';
import { TaskStatus, DifficultyLevel } from '../dto';
import { parseJwtToken, isTokenExpired } from '../utils';
import type { UserInfo } from '../utils';
import UserSuggestionList from '../components/UserSuggestionList';

const TaskEdit: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [task, setTask] = useState<TaskResponse | null>(null);
    const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
    const [allUsers, setAllUsers] = useState<UserResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<number>(TaskStatus.Pending);
    const [difficulty, setDifficulty] = useState<number>(DifficultyLevel.Medium);
    const [deadline, setDeadline] = useState('');
    const [assignedUser, setAssignedUser] = useState<UserResponse | null>(null);

    // Mention state
    const [assignInputValue, setAssignInputValue] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [suggestionIndex, setSuggestionIndex] = useState(0);
    const assignInputRef = useRef<HTMLInputElement>(null);

    const displayName = useMemo(() => {
        if (!userInfo) return 'User';
        if (userInfo.userName) {
            return userInfo.userName.charAt(0).toUpperCase() + userInfo.userName.slice(1);
        }
        if (userInfo.email) {
            return userInfo.email.split('@')[0];
        }
        return 'User';
    }, [userInfo]);

    const userRole = useMemo(() => {
        if (!userInfo || !userInfo.roles.length) return 'Team Member';
        const role = userInfo.roles[0];
        return role.charAt(0).toUpperCase() + role.slice(1);
    }, [userInfo]);

    const filteredUsers = useMemo(() => {
        if (!mentionQuery || mentionQuery.trim().length === 0) {
            return [];
        }
        const employees = allUsers.filter(u => u.role?.toLowerCase() === 'employee' || !u.role);
        const query = mentionQuery.toLowerCase();
        return employees.filter(
            (u) =>
                u.userName.toLowerCase().includes(query) ||
                u.email.toLowerCase().includes(query)
        );
    }, [allUsers, mentionQuery]);

    useEffect(() => {
        const token = authService.getToken();

        if (!token || isTokenExpired(token)) {
            authService.clearToken();
            navigate('/login');
            return;
        }

        const parsedUser = parseJwtToken(token);
        if (parsedUser) {
            setUserInfo(parsedUser);
        }

        loadData();
    }, [navigate, id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const taskId = parseInt(id || '0');
            if (!taskId) {
                navigate('/tasks');
                return;
            }

            const [taskData, notificationsData, usersData] = await Promise.all([
                taskService.getTaskById(taskId).catch(() => null),
                notificationService.getMyNotifications().catch(() => []),
                userService.getAllUsers().catch(() => []),
            ]);

            if (!taskData) {
                navigate('/tasks');
                return;
            }

            setTask(taskData);
            setNotifications(notificationsData);
            setAllUsers(usersData);

            // Populate form fields
            setTitle(taskData.title);
            setDescription(taskData.description || '');
            setStatus(taskData.status);
            setDifficulty(taskData.difficulty);

            // Format deadline for datetime-local input
            const deadlineDate = new Date(taskData.deadline);
            const formattedDeadline = deadlineDate.toISOString().slice(0, 16);
            setDeadline(formattedDeadline);

            // Find assigned user
            if (taskData.assignedToUserId) {
                const foundUser = usersData.find(u => u.id === taskData.assignedToUserId);
                if (foundUser) {
                    setAssignedUser(foundUser);
                }
            }
        } catch {
            navigate('/tasks');
        } finally {
            setLoading(false);
        }
    };

    const handleAssignInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setAssignInputValue(value);

        const lastAtPos = value.lastIndexOf('@');
        if (lastAtPos !== -1) {
            const queryAfterAt = value.substring(lastAtPos + 1);
            if (queryAfterAt.length > 0) {
                setShowSuggestions(true);
                setMentionQuery(queryAfterAt);
                setSuggestionIndex(0);
            } else {
                setShowSuggestions(false);
                setMentionQuery('');
            }
        } else {
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

    const handleSave = async () => {
        if (!task || !userInfo) return;

        if (!title.trim()) {
            setError('Başlıq mütləqdir');
            return;
        }
        if (!deadline) {
            setError('Son tarix mütləqdir');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const formattedDeadline = new Date(deadline).toISOString();

            await taskService.updateTask({
                id: task.id,
                title: title.trim(),
                description: description.trim(),
                difficulty,
                status,
                deadline: formattedDeadline,
                assignedToUserId: assignedUser?.id,
                createdByUserId: task.createdByUserId,
                parentTaskId: task.parentTaskId,
            });

            setSuccessMessage('Tapşırıq uğurla yeniləndi');
            setTimeout(() => {
                navigate(`/tasks/${task.id}`);
            }, 1500);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Tapşırığı yeniləmək mümkün olmadı');
        } finally {
            setSaving(false);
        }
    };

    const handleDiscard = () => {
        navigate(`/tasks/${id}`);
    };

    if (loading) {
        return (
            <div className="flex h-screen w-full bg-background-light dark:bg-background-dark">
                <Sidebar userName={displayName} userRole={userRole} />
                <div className="flex flex-1 flex-col h-full overflow-hidden relative">
                    <Header notificationCount={0} />
                    <main className="flex-1 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm text-[#636f88]">Tapşırıq yüklənir...</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (!task) return null;

    return (
        <div className="flex h-screen w-full bg-background-light dark:bg-background-dark text-[#111318] dark:text-white font-display overflow-hidden">
            <Sidebar userName={displayName} userRole={userRole} />

            <div className="flex flex-1 flex-col h-full overflow-hidden relative">
                <Header notificationCount={notifications.filter((n) => !n.isRead).length} />

                <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark py-8 px-4 sm:px-6 lg:px-8">
                    <div className="w-full max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                        {/* LEFT COLUMN - Main Content */}
                        <div className="lg:col-span-8 flex flex-col gap-6">
                            {/* Breadcrumbs */}
                            <nav className="flex items-center gap-2 text-sm">
                                <Link to="/tasks" className="text-gray-500 hover:text-primary transition-colors font-medium">Tapşırıqlarım</Link>
                                <span className="material-symbols-outlined text-gray-400 text-[16px]">chevron_right</span>
                                <Link to={`/tasks/${task.id}`} className="text-gray-500 hover:text-primary transition-colors font-medium">Tapşırıq #{task.id}</Link>
                                <span className="material-symbols-outlined text-gray-400 text-[16px]">chevron_right</span>
                                <span className="text-gray-900 dark:text-white font-semibold">Düzəliş Et</span>
                            </nav>

                            {/* Task Title & Description */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                                {error && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                                        {error}
                                    </div>
                                )}

                                <div className="group relative mb-6">
                                    <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Tapşırıq Başlığı</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="block w-full text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white bg-transparent border-2 border-gray-200 dark:border-gray-600 focus:border-primary focus:ring-0 rounded-lg px-4 py-3 transition-colors placeholder-gray-400"
                                        placeholder="Tapşırıq başlığını daxil edin..."
                                    />
                                </div>

                                <div className="group relative">
                                    <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Təsvir</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="block w-full min-h-[250px] text-base text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none leading-relaxed"
                                        placeholder="Daha ətraflı təsvir əlavə edin..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN - Properties Sidebar */}
                        <div className="lg:col-span-4 flex flex-col gap-6 sticky top-6">
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800">
                                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">Xüsusiyyətlər</h2>
                                </div>
                                <div className="p-6 space-y-6">
                                    {/* Status */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Status</label>
                                        <select
                                            value={status}
                                            onChange={(e) => setStatus(Number(e.target.value))}
                                            className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-primary focus:border-primary p-2.5"
                                        >
                                            <option value={TaskStatus.Pending}>Gözləyir</option>
                                            <option value={TaskStatus.Assigned}>Təyin edilib</option>
                                            <option value={TaskStatus.InProgress}>Davam edir</option>
                                            <option value={TaskStatus.Completed}>Tamamlandı</option>
                                            <option value={TaskStatus.Expired}>Vaxtı bitib</option>
                                        </select>
                                    </div>

                                    {/* Assignee with @ mention */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">İcraçı</label>
                                        {assignedUser ? (
                                            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                                    {assignedUser.userName.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1">
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">{assignedUser.userName}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setAssignedUser(null)}
                                                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-gray-400 hover:text-red-500"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <input
                                                    ref={assignInputRef}
                                                    type="text"
                                                    value={assignInputValue}
                                                    onChange={handleAssignInputChange}
                                                    onKeyDown={handleKeyDown}
                                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                                    placeholder="@istifadəçi adı yazın..."
                                                    className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-primary focus:border-primary p-2.5"
                                                    autoComplete="off"
                                                />
                                                {showSuggestions && filteredUsers.length > 0 && (
                                                    <UserSuggestionList
                                                        users={filteredUsers}
                                                        onSelect={handleUserSelect}
                                                        position={{ top: 45, left: 0 }}
                                                        selectedIndex={suggestionIndex}
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Difficulty */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Çətinlik</label>
                                        <select
                                            value={difficulty}
                                            onChange={(e) => setDifficulty(Number(e.target.value))}
                                            className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-primary focus:border-primary p-2.5"
                                        >
                                            <option value={DifficultyLevel.Easy}>Asan</option>
                                            <option value={DifficultyLevel.Medium}>Orta</option>
                                            <option value={DifficultyLevel.Hard}>Çətin</option>
                                        </select>
                                    </div>

                                    {/* Due Date */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Son Tarix</label>
                                        <div className="relative">
                                            <input
                                                type="datetime-local"
                                                value={deadline}
                                                onChange={(e) => setDeadline(e.target.value)}
                                                className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-primary focus:border-primary p-2.5 pl-10"
                                            />
                                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                                                <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-3">
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50"
                                    >
                                        {saving ? 'Yadda saxlanılır...' : 'Dəyişiklikləri Yadda Saxla'}
                                    </button>
                                    <button
                                        onClick={handleDiscard}
                                        className="w-full flex justify-center items-center py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        Ləğv Et
                                    </button>
                                </div>
                            </div>

                            {/* Tip Box */}
                            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/10 p-4 border border-blue-100 dark:border-blue-900/20">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <span className="material-symbols-outlined text-blue-400 dark:text-blue-300">info</span>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">İpucu</h3>
                                        <div className="mt-1 text-xs text-blue-700 dark:text-blue-300/80">
                                            Komanda üzvlərini qeyd etmək və təyin etmək üçün <span className="font-mono bg-blue-100 dark:bg-blue-900/40 px-1 rounded">@</span> işarəsindən istifadə edin.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Success Toast */}
            {successMessage && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-pulse">
                    <div className="flex items-center gap-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-3 rounded-lg shadow-lg">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white">
                            <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                        </div>
                        <p className="text-sm font-medium">{successMessage}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskEdit;
