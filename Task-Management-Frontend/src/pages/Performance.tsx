import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar, Header } from '../layout';
import { performanceService, taskService, notificationService } from '../api';
import type { NotificationResponse, TaskResponse, LeaderboardEntry } from '../dto';
import { parseJwtToken, isTokenExpired } from '../utils';
import type { UserInfo } from '../utils';

const Performance: React.FC = () => {
    const navigate = useNavigate();
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [totalPoints, setTotalPoints] = useState<number>(0);
    const [allTasks, setAllTasks] = useState<TaskResponse[]>([]);
    const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
    const [loading, setLoading] = useState(true);
    // Date Filter State
    const [dateFilter, setDateFilter] = useState<'7d' | '30d' | 'thisMonth' | 'all'>('30d');
    const [showDateDropdown, setShowDateDropdown] = useState(false);
    const dateDropdownRef = React.useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
                setShowDateDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

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

    // Calculate performance metrics from tasks
    const performanceMetrics = useMemo(() => {
        if (!userInfo || !allTasks.length) {
            return {
                totalPoints,
                completionRate: 0,
                tasksCompleted: 0,
                difficultyBreakdown: [
                    { difficulty: 'Easy' as const, difficultyLevel: 0, tasksCompleted: 0, pointsEarned: 0 },
                    { difficulty: 'Medium' as const, difficultyLevel: 1, tasksCompleted: 0, pointsEarned: 0 },
                    { difficulty: 'Hard' as const, difficultyLevel: 2, tasksCompleted: 0, pointsEarned: 0 },
                ],
                trend: { direction: 'stable' as const, percentage: 0 }
            };
        }

        // Filter tasks for current user (assigned or created)
        let userTasks = allTasks.filter(
            task => task.assignedToUserId === userInfo.userId || task.createdByUserId === userInfo.userId
        );

        // Apply Date Filter
        if (dateFilter !== 'all') {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            userTasks = userTasks.filter(task => {
                const taskDate = new Date(task.deadline); // Use deadline

                if (dateFilter === '7d') {
                    const sevenDaysAgo = new Date(today);
                    sevenDaysAgo.setDate(today.getDate() - 7);
                    return taskDate >= sevenDaysAgo;
                }
                if (dateFilter === '30d') {
                    const thirtyDaysAgo = new Date(today);
                    thirtyDaysAgo.setDate(today.getDate() - 30);
                    return taskDate >= thirtyDaysAgo;
                }
                if (dateFilter === 'thisMonth') {
                    return taskDate.getMonth() === today.getMonth() && taskDate.getFullYear() === today.getFullYear();
                }
                return true;
            });
        }

        // Completed tasks
        const completedTasks = userTasks.filter(task => task.status === 3); // TaskStatus.Completed

        // Completion rate
        const completionRate = userTasks.length > 0
            ? Math.round((completedTasks.length / userTasks.length) * 100)
            : 0;

        // Difficulty breakdown
        const difficultyMap: Record<number, { difficulty: 'Easy' | 'Medium' | 'Hard', pointsPerTask: number }> = {
            0: { difficulty: 'Easy', pointsPerTask: 10 },
            1: { difficulty: 'Medium', pointsPerTask: 20 },
            2: { difficulty: 'Hard', pointsPerTask: 30 }
        };

        const breakdown = [0, 1, 2].map(level => {
            const tasksAtLevel = completedTasks.filter(task => task.difficulty === level);
            const config = difficultyMap[level];
            return {
                difficulty: config.difficulty,
                difficultyLevel: level,
                tasksCompleted: tasksAtLevel.length,
                pointsEarned: tasksAtLevel.length * config.pointsPerTask
            };
        });

        // Calculate trend (mock calculation based on recent activity)
        const last30DaysTask = completedTasks.filter(task => {
            const taskDate = new Date(task.deadline);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return taskDate >= thirtyDaysAgo;
        });

        const trendPercentage = completedTasks.length > 0
            ? Math.round((last30DaysTask.length / completedTasks.length) * 100)
            : 0;

        return {
            totalPoints,
            completionRate,
            tasksCompleted: completedTasks.length,
            difficultyBreakdown: breakdown,
            trend: {
                direction: trendPercentage >= 50 ? ('up' as const) : ('stable' as const),
                percentage: trendPercentage
            }
        };
    }, [userInfo, allTasks, totalPoints, dateFilter]);

    useEffect(() => {
        const token = localStorage.getItem('authToken');

        if (!token || isTokenExpired(token)) {
            localStorage.removeItem('authToken');
            navigate('/login');
            return;
        }

        const parsedUser = parseJwtToken(token);
        if (parsedUser) {
            setUserInfo(parsedUser);
            loadData(parsedUser.userId);
        }
    }, [navigate]);

    const loadData = async (userId: string) => {
        try {
            setLoading(true);
            const [leaderboardRaw, tasksData, notificationsData] = await Promise.all([
                performanceService.getLeaderboard().catch(() => []),
                taskService.getAllTasks().catch(() => []),
                notificationService.getMyNotifications().catch(() => []),
            ]);

            // Map PascalCase to camelCase (backend returns PascalCase)
            const leaderboardData = leaderboardRaw.map((item: any) => ({
                userId: item.userId || item.UserId,
                userName: item.userName || item.UserName,
                totalPoints: item.totalPoints ?? item.TotalPoints ?? 0
            }));

            console.log('[Performance] Leaderboard data:', leaderboardData);
            console.log('[Performance] Looking for userId:', userId);

            // Find user's points from leaderboard
            const userEntry = leaderboardData.find((entry: LeaderboardEntry) => entry.userId === userId);
            const points = userEntry?.totalPoints || 0;

            console.log('[Performance] User entry found:', userEntry);
            console.log('[Performance] Total points:', points);

            setTotalPoints(points);
            setAllTasks(tasksData);
            setNotifications(notificationsData);
        } catch (error) {
            console.error('[Performance] Failed to load data:', error);
        } finally {
            setLoading(false);
        }
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
                            <p className="text-sm text-[#636f88]">Performans məlumatları yüklənir...</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    const getDifficultyColor = (difficulty: 'Easy' | 'Medium' | 'Hard') => {
        switch (difficulty) {
            case 'Easy':
                return { dot: 'bg-green-500', badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' };
            case 'Medium':
                return { dot: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' };
            case 'Hard':
                return { dot: 'bg-red-500', badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' };
        }
    };

    const totalPointsFromBreakdown = performanceMetrics.difficultyBreakdown.reduce((sum, item) => sum + item.pointsEarned, 0);

    return (
        <div className="flex h-screen w-full bg-background-light dark:bg-background-dark text-[#111318] dark:text-white font-display overflow-hidden">
            <Sidebar userName={displayName} userRole={userRole} />

            <div className="flex flex-1 flex-col h-full overflow-hidden relative">
                <Header notificationCount={notifications.filter((n) => !n.isRead).length} />

                <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mx-auto max-w-7xl flex flex-col gap-6">

                        {/* Breadcrumbs */}
                        <nav aria-label="Breadcrumb" className="flex mb-2">
                            <ol className="inline-flex items-center space-x-1 md:space-x-3">
                                <li className="inline-flex items-center">
                                    <button
                                        onClick={() => navigate('/')}
                                        className="inline-flex items-center text-sm font-medium text-text-muted hover:text-primary dark:text-gray-400 dark:hover:text-white transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[20px] mr-2">home</span>
                                        Ana səhifə
                                    </button>
                                </li>
                                <li>
                                    <div className="flex items-center">
                                        <span className="material-symbols-outlined text-text-muted text-sm mx-1">chevron_right</span>
                                        <span className="text-sm font-medium text-text-muted dark:text-gray-400">Analitika</span>
                                    </div>
                                </li>
                                <li aria-current="page">
                                    <div className="flex items-center">
                                        <span className="material-symbols-outlined text-text-muted text-sm mx-1">chevron_right</span>
                                        <span className="text-sm font-medium text-text-main dark:text-gray-100">Performans</span>
                                    </div>
                                </li>
                            </ol>
                        </nav>

                        {/* Page Heading */}
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-2">
                            <div className="flex flex-col gap-1">
                                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-text-main dark:text-white">
                                    Fərdi Performans
                                </h1>
                                <p className="text-text-muted dark:text-gray-400 text-base">
                                    Son 30 gün ərzində məhsuldarlığınızı və nailiyyətlərinizi izləyin.
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* Date Picker Mock */}
                                {/* Date Picker Dropdown */}
                                <div className="relative" ref={dateDropdownRef}>
                                    <button
                                        onClick={() => setShowDateDropdown(!showDateDropdown)}
                                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-text-main dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                                        {dateFilter === '7d' ? 'Son 7 gün' : dateFilter === '30d' ? 'Son 30 gün' : dateFilter === 'thisMonth' ? 'Bu ay' : 'Bütün vaxtlar'}
                                        <span className={`material-symbols-outlined text-[18px] transition-transform ${showDateDropdown ? 'rotate-180' : ''}`}>arrow_drop_down</span>
                                    </button>

                                    {showDateDropdown && (
                                        <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                            <div className="p-1">
                                                <button
                                                    onClick={() => { setDateFilter('7d'); setShowDateDropdown(false); }}
                                                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg ${dateFilter === '7d' ? 'bg-primary/10 text-primary font-medium' : 'text-text-main dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                                >
                                                    Son 7 gün
                                                    {dateFilter === '7d' && <span className="material-symbols-outlined text-[16px]">check</span>}
                                                </button>
                                                <button
                                                    onClick={() => { setDateFilter('30d'); setShowDateDropdown(false); }}
                                                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg ${dateFilter === '30d' ? 'bg-primary/10 text-primary font-medium' : 'text-text-main dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                                >
                                                    Son 30 gün
                                                    {dateFilter === '30d' && <span className="material-symbols-outlined text-[16px]">check</span>}
                                                </button>
                                                <button
                                                    onClick={() => { setDateFilter('thisMonth'); setShowDateDropdown(false); }}
                                                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg ${dateFilter === 'thisMonth' ? 'bg-primary/10 text-primary font-medium' : 'text-text-main dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                                >
                                                    Bu ay
                                                    {dateFilter === 'thisMonth' && <span className="material-symbols-outlined text-[16px]">check</span>}
                                                </button>
                                                <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
                                                <button
                                                    onClick={() => { setDateFilter('all'); setShowDateDropdown(false); }}
                                                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg ${dateFilter === 'all' ? 'bg-primary/10 text-primary font-medium' : 'text-text-main dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                                >
                                                    Bütün vaxtlar
                                                    {dateFilter === 'all' && <span className="material-symbols-outlined text-[16px]">check</span>}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {/* Export Button */}
                                <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md transition-all active:scale-95">
                                    <span className="material-symbols-outlined text-[18px]">download</span>
                                    Hesabatı ixrac et
                                </button>
                            </div>
                        </div>

                        {/* KPI Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Total Points Card */}
                            <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <span className="material-symbols-outlined text-8xl text-primary">military_tech</span>
                                </div>
                                <div className="flex items-start justify-between z-10">
                                    <div className="flex flex-col gap-1">
                                        <p className="text-text-muted dark:text-gray-400 text-sm font-semibold uppercase tracking-wider">
                                            Ümumi Xallar
                                        </p>
                                        <h2 className="text-4xl font-black text-text-main dark:text-white mt-1">
                                            {totalPoints.toLocaleString()}
                                        </h2>
                                    </div>
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <span className="material-symbols-outlined text-primary">emoji_events</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-6 z-10">
                                    <div className={`flex items-center px-2 py-1 rounded ${performanceMetrics.trend.direction === 'up'
                                        ? 'bg-accent/50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                        } text-xs font-bold`}>
                                        <span className="material-symbols-outlined text-[14px] mr-1">
                                            {performanceMetrics.trend.direction === 'up' ? 'trending_up' : 'trending_flat'}
                                        </span>
                                        {performanceMetrics.trend.direction === 'up' ? '+' : ''}
                                        {performanceMetrics.trend.percentage}%
                                    </div>
                                    <span className="text-text-muted dark:text-gray-500 text-sm">keçən ayla müqayisədə</span>
                                </div>
                            </div>

                            {/* Completion Rate Card */}
                            <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <span className="material-symbols-outlined text-8xl text-green-600">check_circle</span>
                                </div>
                                <div className="flex items-start justify-between z-10">
                                    <div className="flex flex-col gap-1">
                                        <p className="text-text-muted dark:text-gray-400 text-sm font-semibold uppercase tracking-wider">
                                            Tamamlanma Faizi
                                        </p>
                                        <h2 className="text-4xl font-black text-text-main dark:text-white mt-1">
                                            {performanceMetrics.completionRate}%
                                        </h2>
                                    </div>
                                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                        <span className="material-symbols-outlined text-green-600 dark:text-green-400">task_alt</span>
                                    </div>
                                </div>
                                {/* Progress Bar Visual */}
                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mt-5 mb-1 z-10">
                                    <div
                                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${performanceMetrics.completionRate}%` }}
                                    ></div>
                                </div>
                                <div className="flex items-center gap-2 mt-2 z-10">
                                    <span className="text-text-muted dark:text-gray-500 text-sm">
                                        {performanceMetrics.tasksCompleted} tapşırıq tamamlandı
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Performance Trend Chart - Simplified */}
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-text-main dark:text-white">Performans Trendi</h3>
                                    <p className="text-sm text-text-muted dark:text-gray-400">
                                        Son 30 gün ərzində toplanmış xallar
                                    </p>
                                </div>
                            </div>

                            {/* Simple visual representation */}
                            <div className="flex items-center justify-center h-[200px] border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                                <div className="text-center">
                                    <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-2">
                                        show_chart
                                    </span>
                                    <p className="text-text-muted dark:text-gray-400 text-sm">
                                        Qrafik vizuallaşdırması tezliklə gələcək
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Data Table Section */}
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex-1 flex flex-col">
                            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50 dark:bg-gray-800/50">
                                <h2 className="text-xl font-bold text-text-main dark:text-white tracking-tight">
                                    Çətinliyə görə töhfə
                                </h2>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-100 dark:border-gray-700 bg-secondary/20 dark:bg-gray-800">
                                            <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-text-muted dark:text-gray-400">
                                                Tapşırıq Çətinliyi
                                            </th>
                                            <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-text-muted dark:text-gray-400 text-center">
                                                Tamamlanmış Tapşırıqlar
                                            </th>
                                            <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-text-muted dark:text-gray-400 text-right">
                                                Qazanılan Xallar
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {performanceMetrics.difficultyBreakdown.map((item, index) => {
                                            const colors = getDifficultyColor(item.difficulty);
                                            return (
                                                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-2 h-2 rounded-full ${colors.dot}`}></div>
                                                            <span className="font-semibold text-text-main dark:text-gray-200">
                                                                {item.difficulty === 'Easy' ? 'Asan' : item.difficulty === 'Medium' ? 'Orta' : 'Çətin'} Tapşırıqlar
                                                            </span>
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${colors.badge}`}>
                                                                {item.difficulty === 'Easy' ? 'ASAN' : item.difficulty === 'Medium' ? 'ORTA' : 'ÇƏTİN'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <span className="font-medium text-text-main dark:text-gray-300">
                                                            {item.tasksCompleted}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-right">
                                                        <span className="font-bold text-text-main dark:text-white">
                                                            {item.pointsEarned} xal
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}

                                        {/* Row 4: Totals */}
                                        <tr className="bg-gray-50/80 dark:bg-gray-800/30 border-t-2 border-gray-100 dark:border-gray-700">
                                            <td className="py-4 px-6">
                                                <span className="font-bold text-sm text-text-muted dark:text-gray-400 uppercase tracking-wide">
                                                    Ümumi Töhfə
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className="font-bold text-lg text-text-main dark:text-white">
                                                    {performanceMetrics.tasksCompleted}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <span className="font-bold text-lg text-primary">
                                                    {totalPointsFromBreakdown} xal
                                                </span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-surface-dark flex items-center justify-between">
                                <p className="text-sm text-text-muted dark:text-gray-400">
                                    Göstərilir: <span className="font-medium text-text-main dark:text-white">3</span> kateqoriyadan{' '}
                                    <span className="font-medium text-text-main dark:text-white">3</span>-ü
                                </p>
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
};

export default Performance;
