import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar, Header } from '../layout';
import { TaskRow, CustomSelect } from '../components';
import CreateTaskModal from '../components/CreateTaskModal';
import { taskService, authService, notificationService } from '../api';
import type { TaskResponse, NotificationResponse } from '../dto';
import { TaskStatus } from '../dto';
import { parseJwtToken, isTokenExpired, getPrimaryRole } from '../utils';
import type { UserInfo } from '../utils';

const ITEMS_PER_PAGE = 10;

const MyTasks: React.FC = () => {
    const navigate = useNavigate();
    const [allTasks, setAllTasks] = useState<TaskResponse[]>([]);
    const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
    const [ownershipFilter, setOwnershipFilter] = useState<string>('assigned');
    const [currentPage, setCurrentPage] = useState(1);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
        return getPrimaryRole(userInfo.roles);
    }, [userInfo]);

    const isManager = useMemo(() => {
        if (!userInfo || !userInfo.roles.length) return false;
        return userInfo.roles.some(
            (r) => r.toLowerCase() === 'manager' || r.toLowerCase() === 'admin'
        );
    }, [userInfo]);

    const filteredTasks = useMemo(() => {
        let result = allTasks;

        // IMPORTANT: Hide tasks that are awaiting acceptance by the current user
        // If status = Assigned AND assignedToUserId = currentUser AND createdByUserId != currentUser
        // This task should NOT appear in the list - user needs to Accept via notification first
        result = result.filter((task) => {
            const isPendingAcceptance =
                task.status === TaskStatus.Assigned &&
                task.assignedToUserId === userInfo?.userId &&
                task.createdByUserId !== userInfo?.userId;

            // If task is pending acceptance, hide it from the list
            return !isPendingAcceptance;
        });

        // 1. Ownership / Role Logic
        if (ownershipFilter === 'created') {
            result = result.filter((task) => task.createdByUserId === userInfo?.userId);
        } else if (ownershipFilter === 'assigned') {
            result = result.filter((task) => task.assignedToUserId === userInfo?.userId);
        } else {
            // 'all' case
            if (isManager) {
                // Manager sees absolutely everything
            } else {
                // Employee sees tasks they are involved in (Assigned OR Created)
                result = result.filter(
                    (task) =>
                        task.assignedToUserId === userInfo?.userId ||
                        task.createdByUserId === userInfo?.userId
                );
            }
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (task) =>
                    task.title.toLowerCase().includes(query) ||
                    task.description?.toLowerCase().includes(query)
            );
        }

        if (statusFilter !== 'all') {
            result = result.filter((task) => task.status === parseInt(statusFilter));
        }

        if (difficultyFilter !== 'all') {
            result = result.filter((task) => task.difficulty === parseInt(difficultyFilter));
        }

        return result;
    }, [allTasks, isManager, userInfo, ownershipFilter, searchQuery, statusFilter, difficultyFilter]);

    const stats = useMemo(() => {
        const total = filteredTasks.length;
        const pending = filteredTasks.filter(
            (t) => t.status === TaskStatus.Pending || t.status === TaskStatus.Assigned
        ).length;
        const inProgress = filteredTasks.filter((t) => t.status === TaskStatus.InProgress).length;
        const completed = filteredTasks.filter((t) => t.status === TaskStatus.Completed).length;

        return { total, pending, inProgress, completed };
    }, [filteredTasks]);

    const paginatedTasks = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredTasks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredTasks, currentPage]);

    const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);

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
    }, [navigate]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter, difficultyFilter, ownershipFilter]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [tasksData, notificationsData] = await Promise.all([
                taskService.getAllTasks().catch(() => []),
                notificationService.getMyNotifications().catch(() => []),
            ]);
            setAllTasks(tasksData);
            setNotifications(notificationsData);
        } catch {
            // Silent fail
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTask = async (taskId: number) => {
        if (!confirm('Bu tapşırığı silmək istədiyinizə əminsiniz?')) return;

        try {
            await taskService.deleteTask(taskId);
            setAllTasks((prev) => prev.filter((t) => t.id !== taskId));
        } catch {
            alert('Tapşırığı silmək mümkün olmadı');
        }
    };

    const handleEditTask = (task: TaskResponse) => {
        navigate(`/tasks/edit/${task.id}`);
    };

    const handleViewTask = (task: TaskResponse) => {
        navigate(`/tasks/${task.id}`);
    };

    const handleNewTask = () => {
        setIsCreateModalOpen(true);
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
                            <p className="text-sm text-[#636f88]">Tapşırıqlar yüklənir...</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full bg-background-light dark:bg-background-dark text-[#111318] dark:text-white font-display overflow-hidden">
            <Sidebar userName={displayName} userRole={userRole} />

            <div className="flex flex-1 flex-col h-full overflow-hidden relative">
                <Header notificationCount={notifications.filter((n) => !n.isRead).length} />

                <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-6 md:p-10">
                    <div className="mx-auto max-w-7xl flex flex-col gap-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-[#111318] dark:text-white tracking-tight">
                                    Tapşırıqlarım
                                </h1>
                                <p className="text-[#636f88] text-sm dark:text-gray-400 mt-1">
                                    {isManager ? 'Bütün komanda tapşırıqlarını idarə et' : 'Təyin edilmiş tapşırıqlarınıza baxın və idarə edin'}
                                </p>
                            </div>
                            <button
                                onClick={handleNewTask}
                                className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg shadow-sm transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px]">add</span>
                                Yeni Tapşırıq
                            </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="bg-white dark:bg-card-dark rounded-xl border border-[#e5e7eb] dark:border-input-border-dark p-4">
                                <p className="text-xs font-medium text-[#636f88] dark:text-gray-400 mb-1">Ümumi Tapşırıqlar</p>
                                <p className="text-2xl font-bold text-[#111318] dark:text-white">{stats.total}</p>
                            </div>
                            <div className="bg-white dark:bg-card-dark rounded-xl border border-[#e5e7eb] dark:border-input-border-dark p-4">
                                <p className="text-xs font-medium text-[#636f88] dark:text-gray-400 mb-1">Gözləmədə</p>
                                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                            </div>
                            <div className="bg-white dark:bg-card-dark rounded-xl border border-[#e5e7eb] dark:border-input-border-dark p-4">
                                <p className="text-xs font-medium text-[#636f88] dark:text-gray-400 mb-1">İcrada</p>
                                <p className="text-2xl font-bold text-purple-600">{stats.inProgress}</p>
                            </div>
                            <div className="bg-white dark:bg-card-dark rounded-xl border border-[#e5e7eb] dark:border-input-border-dark p-4">
                                <p className="text-xs font-medium text-[#636f88] dark:text-gray-400 mb-1">Tamamlandı</p>
                                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-card-dark rounded-xl border border-[#e5e7eb] dark:border-input-border-dark p-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center rounded-lg bg-[#f0f2f4] dark:bg-gray-800 px-3 py-2">
                                        <span className="material-symbols-outlined text-[#636f88] text-[20px]">search</span>
                                        <input
                                            className="ml-2 w-full bg-transparent text-sm text-[#111318] dark:text-white placeholder-[#636f88] outline-none border-none focus:ring-0 p-0"
                                            placeholder="Tapşırıq axtar..."
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <div className="min-w-[200px]">
                                        <CustomSelect
                                            value={ownershipFilter}
                                            onChange={setOwnershipFilter}
                                            icon="person"
                                            options={[
                                                { value: 'assigned', label: 'Mənə təyin olunanlar' },
                                                { value: 'created', label: 'Mənim yaratdıqlarım' },
                                                { value: 'all', label: 'Bütün Tapşırıqlar' }
                                            ]}
                                        />
                                    </div>

                                    <div className="min-w-[160px]">
                                        <CustomSelect
                                            value={statusFilter}
                                            onChange={setStatusFilter}
                                            options={[
                                                { value: 'all', label: 'Bütün Statuslar' },
                                                { value: '0', label: 'Gözləmədə' },
                                                { value: '1', label: 'Təyin edilib' },
                                                { value: '2', label: 'İcrada' },
                                                { value: '3', label: 'Nəzərdən keçirilir' },
                                                { value: '4', label: 'Tamamlandı' },
                                                { value: '5', label: 'Vaxtı bitib' }
                                            ]}
                                        />
                                    </div>

                                    <div className="min-w-[160px]">
                                        <CustomSelect
                                            value={difficultyFilter}
                                            onChange={setDifficultyFilter}
                                            options={[
                                                { value: 'all', label: 'Bütün Çətinliklər' },
                                                { value: '0', label: 'Asan' },
                                                { value: '1', label: 'Orta' },
                                                { value: '2', label: 'Çətin' }
                                            ]}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            {paginatedTasks.length === 0 ? (
                                <div className="bg-white dark:bg-card-dark rounded-xl border border-[#e5e7eb] dark:border-input-border-dark p-12 text-center">
                                    <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600 mb-4">
                                        task
                                    </span>
                                    <h3 className="text-lg font-semibold text-[#111318] dark:text-white mb-2">
                                        Tapşırıq tapılmadı
                                    </h3>
                                    <p className="text-sm text-[#636f88] dark:text-gray-400">
                                        {searchQuery || statusFilter !== 'all' || difficultyFilter !== 'all'
                                            ? 'Filtrləri dəyişərək yoxlayın'
                                            : 'Başlamaq üçün ilk tapşırığınızı yaradın'}
                                    </p>
                                </div>
                            ) : (
                                paginatedTasks.map((task) => (
                                    <TaskRow
                                        key={task.id}
                                        task={task}
                                        currentUserId={userInfo?.userId}
                                        onEdit={handleEditTask}
                                        onDelete={handleDeleteTask}
                                        onView={handleViewTask}
                                        onPerformance={handleViewTask}
                                    />
                                ))
                            )}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-between bg-white dark:bg-card-dark rounded-xl border border-[#e5e7eb] dark:border-input-border-dark px-4 py-3">
                                <p className="text-sm text-[#636f88] dark:text-gray-400">
                                    Göstərilir {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{' '}
                                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredTasks.length)} (Cəmi {' '}
                                    {filteredTasks.length} tapşırıq)
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="flex size-8 items-center justify-center rounded-lg border border-[#e5e7eb] dark:border-gray-700 text-[#636f88] hover:bg-[#f0f2f4] dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`flex size-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${currentPage === page
                                                ? 'bg-primary text-white'
                                                : 'border border-[#e5e7eb] dark:border-gray-700 text-[#636f88] hover:bg-[#f0f2f4] dark:hover:bg-gray-800'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="flex size-8 items-center justify-center rounded-lg border border-[#e5e7eb] dark:border-gray-700 text-[#636f88] hover:bg-[#f0f2f4] dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
            {/* Create Task Modal */}
            <CreateTaskModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onTaskCreated={loadData}
            />
        </div>
    );
};

export default MyTasks;
