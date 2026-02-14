import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar, Header } from '../layout';
import { performanceService, notificationService, taskService } from '../api';
import type { LeaderboardEntry, NotificationResponse, TaskResponse } from '../dto';
import { TaskStatus, DifficultyLevel } from '../dto';
import { parseJwtToken, isTokenExpired, getPrimaryRole } from '../utils';
import type { UserInfo } from '../utils';

const Leaderboard: React.FC = () => {
    const navigate = useNavigate();
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [allTasks, setAllTasks] = useState<TaskResponse[]>([]); // Store tasks for filtering
    const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter State
    const [dateFilter, setDateFilter] = useState<'all' | '7d' | '30d' | 'thisMonth'>('all');
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
        return getPrimaryRole(userInfo.roles);
    }, [userInfo]);

    // Filtered Leaderboard
    const filteredLeaderboard = useMemo(() => {
        if (dateFilter === 'all') return leaderboard;

        // Recalculate points based on filtered tasks
        const filteredTasks = allTasks.filter(task => {
            if (task.status !== TaskStatus.Completed) return false;

            const taskDate = new Date(task.deadline); // Using deadline as proxy for completion date
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

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

        const userPointsMap = new Map<string, number>();
        const DIFFICULTY_POINTS = {
            [DifficultyLevel.Easy]: 10,
            [DifficultyLevel.Medium]: 20,
            [DifficultyLevel.Hard]: 30,
        };

        filteredTasks.forEach(task => {
            const points = DIFFICULTY_POINTS[task.difficulty] || 10;
            const userId = task.assignedToUserId;
            if (userId) {
                userPointsMap.set(userId, (userPointsMap.get(userId) || 0) + points);
            }
        });

        // Map existing leaderboard users to new points (preserving mostly correct set of users)
        // Or create new list from map? Better to map over existing leaderboard to keep metadata like UserName
        const newLeaderboard = leaderboard.map(user => ({
            ...user,
            totalPoints: userPointsMap.get(user.userId) || 0
        })).sort((a, b) => b.totalPoints - a.totalPoints);

        return newLeaderboard;
    }, [leaderboard, allTasks, dateFilter]);

    // Top 3 users (or less if fewer users available)
    const topThree = useMemo(() => {
        return {
            first: filteredLeaderboard[0] || null,
            second: filteredLeaderboard[1] || null,
            third: filteredLeaderboard[2] || null
        };
    }, [filteredLeaderboard]);

    // Remaining users (4+)
    const remainingUsers = useMemo(() => {
        return filteredLeaderboard.slice(3);
    }, [filteredLeaderboard]);

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
        }

        loadData();
    }, [navigate]);

    const loadData = async () => {
        try {
            setLoading(true);
            console.log('[Leaderboard] Fetching data...');

            const [leaderboardData, notificationsData, allTasksData] = await Promise.all([
                performanceService.getLeaderboard().catch((err) => {
                    console.error('[Leaderboard] API Error:', err);
                    console.error('[Leaderboard] Error response:', err.response);
                    return [];
                }),
                notificationService.getMyNotifications().catch(() => []),
                taskService.getAllTasks().catch(() => []),
            ]);

            console.log('[Leaderboard] Raw data from backend:', leaderboardData);
            console.log('[Leaderboard] Total users:', leaderboardData.length);

            // Map backend PascalCase to frontend camelCase and sort by totalPoints descending
            const mappedData: LeaderboardEntry[] = leaderboardData.map((item: any) => ({
                userId: item.userId || item.UserId,
                userName: item.userName || item.UserName,
                totalPoints: item.totalPoints || item.TotalPoints || 0
            }));

            // Sort by totalPoints descending (highest first)
            const sortedData = mappedData.sort((a, b) => b.totalPoints - a.totalPoints);

            console.log('[Leaderboard] Mapped and sorted data:', sortedData);
            console.log('[Leaderboard] Top user:', sortedData[0]);

            setLeaderboard(sortedData);
            setAllTasks(allTasksData);
            setNotifications(notificationsData);
        } catch (error) {
            console.error('[Leaderboard] Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getUserInitials = (userName: string): string => {
        if (!userName) return '?';
        const parts = userName.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return userName.substring(0, 2).toUpperCase();
    };

    const getDepartmentColor = (rank: number): string => {
        const colors = [
            'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
            'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
            'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
            'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
            'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
            'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
            'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
        ];
        return colors[rank % colors.length];
    };

    const getEfficiency = (points: number): number => {
        // Mock efficiency calculation (85-95%)
        return Math.min(95, Math.max(75, 75 + (points / 50)));
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
                            <p className="text-sm text-[#636f88]">Liderlər lövhəsi yüklənir...</p>
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

                <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-4 md:p-8">
                    <div className="mx-auto max-w-7xl w-full">

                        {/* Page Heading & Filters */}
                        <div className="flex flex-col gap-6 mb-8">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#111318] dark:text-white mb-2">
                                        Liderlər Lövhəsi
                                    </h1>
                                    <p className="text-[#636f88] dark:text-gray-400 text-base">
                                        Həftəlik Sprint • {new Date().toLocaleDateString('az-AZ', { month: 'short', day: 'numeric' })} - {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('az-AZ', { month: 'short', day: 'numeric' })}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">

                                    <div className="relative" ref={dateDropdownRef}>
                                        <button
                                            onClick={() => setShowDateDropdown(!showDateDropdown)}
                                            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#2d3748] border border-[#dcdfe5] dark:border-[#4a5568] rounded-lg hover:bg-[#f0f2f4] dark:hover:bg-[#4a5568] transition-colors"
                                        >
                                            <span className="text-sm font-medium text-[#111318] dark:text-white">
                                                {dateFilter === '7d' ? 'Bu həftə' : dateFilter === '30d' ? 'Bu ay (30 gün)' : dateFilter === 'thisMonth' ? 'Bu ay' : 'Bütün vaxtlar'}
                                            </span>
                                            <span className={`material-symbols-outlined text-sm transition-transform ${showDateDropdown ? 'rotate-180' : ''}`}>expand_more</span>
                                        </button>

                                        {showDateDropdown && (
                                            <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-[#2d3748] border border-[#dcdfe5] dark:border-[#4a5568] rounded-xl shadow-lg z-50 overflow-hidden">
                                                <div className="p-1">
                                                    <button
                                                        onClick={() => { setDateFilter('7d'); setShowDateDropdown(false); }}
                                                        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg ${dateFilter === '7d' ? 'bg-primary/10 text-primary font-medium' : 'text-[#111318] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                                    >
                                                        Bu həftə
                                                        {dateFilter === '7d' && <span className="material-symbols-outlined text-[16px]">check</span>}
                                                    </button>
                                                    <button
                                                        onClick={() => { setDateFilter('30d'); setShowDateDropdown(false); }}
                                                        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg ${dateFilter === '30d' ? 'bg-primary/10 text-primary font-medium' : 'text-[#111318] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                                    >
                                                        Bu ay (30 gün)
                                                        {dateFilter === '30d' && <span className="material-symbols-outlined text-[16px]">check</span>}
                                                    </button>
                                                    <button
                                                        onClick={() => { setDateFilter('thisMonth'); setShowDateDropdown(false); }}
                                                        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg ${dateFilter === 'thisMonth' ? 'bg-primary/10 text-primary font-medium' : 'text-[#111318] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                                    >
                                                        Bu ay (Təqvim)
                                                        {dateFilter === 'thisMonth' && <span className="material-symbols-outlined text-[16px]">check</span>}
                                                    </button>
                                                    <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
                                                    <button
                                                        onClick={() => { setDateFilter('all'); setShowDateDropdown(false); }}
                                                        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg ${dateFilter === 'all' ? 'bg-primary/10 text-primary font-medium' : 'text-[#111318] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                                    >
                                                        Bütün vaxtlar
                                                        {dateFilter === 'all' && <span className="material-symbols-outlined text-[16px]">check</span>}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <button className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#2d3748] border border-[#dcdfe5] dark:border-[#4a5568] rounded-lg hover:bg-[#f0f2f4] dark:hover:bg-[#4a5568] transition-colors">
                                        <span className="text-sm font-medium text-[#111318] dark:text-white">Bütün Şöbələr</span>
                                        <span className="material-symbols-outlined text-sm">expand_more</span>
                                    </button>
                                    <button className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm">
                                        <span className="material-symbols-outlined text-sm">download</span>
                                        <span className="text-sm font-medium">İxrac et</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Top 3 Stats Podium */}
                        {topThree.first ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 items-end">
                                {/* 2nd Place */}
                                {topThree.second && (
                                    <div className="order-2 md:order-1 flex flex-col items-center bg-white dark:bg-[#1a202c] rounded-xl p-6 border-t-4 border-[#94a3b8] shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                                        <div className="absolute top-0 right-0 p-3 opacity-10">
                                            <span className="material-symbols-outlined text-6xl text-[#94a3b8]">military_tech</span>
                                        </div>
                                        <div className="relative mb-4">
                                            <div className="size-20 rounded-full border-4 border-[#94a3b8] p-1 flex items-center justify-center bg-gradient-to-br from-[#94a3b8] to-[#cbd5e1] text-white font-bold text-2xl">
                                                {getUserInitials(topThree.second.userName)}
                                            </div>
                                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#94a3b8] text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                                                2nd
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-bold text-[#111318] dark:text-white">{topThree.second.userName}</h3>
                                        <p className="text-sm text-[#636f88] dark:text-gray-400 mb-3">Komanda Üzvü</p>
                                        <div className="flex items-center gap-1 text-primary">
                                            <span className="material-symbols-outlined text-base">bolt</span>
                                            <span className="text-xl font-black">{topThree.second.totalPoints.toLocaleString()}</span>
                                            <span className="text-xs font-medium text-[#636f88] dark:text-gray-400">pts</span>
                                        </div>
                                    </div>
                                )}

                                {/* 1st Place */}
                                <div className="order-1 md:order-2 flex flex-col items-center bg-white dark:bg-[#1a202c] rounded-xl p-8 border-t-4 border-[#eab308] shadow-lg relative overflow-hidden z-10 transform md:-translate-y-4 group hover:-translate-y-6 transition-transform duration-300">
                                    <div className="absolute inset-0 bg-gradient-to-b from-[#eab308]/5 to-transparent pointer-events-none"></div>
                                    <div className="absolute top-0 right-0 p-3 opacity-20">
                                        <span className="material-symbols-outlined text-7xl text-[#eab308]">emoji_events</span>
                                    </div>
                                    <div className="relative mb-5">
                                        <div className="size-24 rounded-full border-4 border-[#eab308] p-1 shadow-md bg-white dark:bg-[#1a202c] flex items-center justify-center">
                                            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#eab308] to-[#fbbf24] flex items-center justify-center text-white font-bold text-3xl">
                                                {getUserInitials(topThree.first.userName)}
                                            </div>
                                        </div>
                                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#eab308] text-white text-sm font-bold px-3 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">crown</span> 1st
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-[#111318] dark:text-white">{topThree.first.userName}</h3>
                                    <p className="text-sm text-[#636f88] dark:text-gray-400 mb-4">Komanda Üzvü</p>
                                    <div className="flex items-center gap-1 text-primary">
                                        <span className="material-symbols-outlined text-lg">bolt</span>
                                        <span className="text-3xl font-black">{topThree.first.totalPoints.toLocaleString()}</span>
                                        <span className="text-sm font-medium text-[#636f88] dark:text-gray-400">pts</span>
                                    </div>
                                </div>

                                {/* 3rd Place */}
                                {topThree.third && (
                                    <div className="order-3 md:order-3 flex flex-col items-center bg-white dark:bg-[#1a202c] rounded-xl p-6 border-t-4 border-[#b45309] shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                                        <div className="absolute top-0 right-0 p-3 opacity-10">
                                            <span className="material-symbols-outlined text-6xl text-[#b45309]">military_tech</span>
                                        </div>
                                        <div className="relative mb-4">
                                            <div className="size-20 rounded-full border-4 border-[#b45309] p-1 flex items-center justify-center bg-gradient-to-br from-[#b45309] to-[#d97706] text-white font-bold text-2xl">
                                                {getUserInitials(topThree.third.userName)}
                                            </div>
                                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#b45309] text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                                                3rd
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-bold text-[#111318] dark:text-white">{topThree.third.userName}</h3>
                                        <p className="text-sm text-[#636f88] dark:text-gray-400 mb-3">Komanda Üzvü</p>
                                        <div className="flex items-center gap-1 text-primary">
                                            <span className="material-symbols-outlined text-base">bolt</span>
                                            <span className="text-xl font-black">{topThree.third.totalPoints.toLocaleString()}</span>
                                            <span className="text-xs font-medium text-[#636f88] dark:text-gray-400">pts</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-[#636f88]">
                                <span className="material-symbols-outlined text-6xl mb-4 block opacity-30">emoji_events</span>
                                <p>Hələlik liderlər lövhəsi məlumatı yoxdur. Xal qazanmaq üçün tapşırıqları tamamlayın!</p>
                            </div>
                        )}

                        {/* Main Leaderboard Table */}
                        {remainingUsers.length > 0 && (
                            <div className="bg-white dark:bg-[#1a202c] rounded-xl shadow-sm border border-[#f0f2f4] dark:border-[#2d3748] overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-[#f0f2f4] dark:border-[#2d3748] bg-gray-50/50 dark:bg-[#2d3748]/30">
                                                <th className="py-4 px-6 text-xs font-semibold text-[#636f88] dark:text-gray-400 uppercase tracking-wider w-20 text-center">
                                                    Rütbə
                                                </th>
                                                <th className="py-4 px-6 text-xs font-semibold text-[#636f88] dark:text-gray-400 uppercase tracking-wider">
                                                    İstifadəçi
                                                </th>
                                                <th className="py-4 px-6 text-xs font-semibold text-[#636f88] dark:text-gray-400 uppercase tracking-wider">
                                                    Şöbə
                                                </th>
                                                <th className="py-4 px-6 text-xs font-semibold text-[#636f88] dark:text-gray-400 uppercase tracking-wider text-right">
                                                    Səmərəlilik
                                                </th>
                                                <th className="py-4 px-6 text-xs font-semibold text-[#636f88] dark:text-gray-400 uppercase tracking-wider text-right">
                                                    Ümumi Xallar
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#f0f2f4] dark:divide-[#2d3748]">
                                            {remainingUsers.map((user, index) => {
                                                const rank = index + 4;
                                                const isCurrentUser = userInfo && user.userId === userInfo.userId;
                                                const efficiency = getEfficiency(user.totalPoints);

                                                return (
                                                    <tr
                                                        key={user.userId}
                                                        className={`group transition-colors ${isCurrentUser
                                                            ? 'bg-primary/5 dark:bg-primary/10 border-l-4 border-l-primary'
                                                            : 'hover:bg-background-light dark:hover:bg-[#2d3748]/50'
                                                            }`}
                                                    >
                                                        <td className="py-4 px-6 text-center">
                                                            <span className={`font-bold ${isCurrentUser ? 'text-primary' : 'text-[#636f88] dark:text-gray-400'}`}>
                                                                {rank}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`size-9 rounded-full shrink-0 flex items-center justify-center bg-gradient-to-br from-primary to-purple-500 text-white font-bold text-sm ${isCurrentUser ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-[#1a202c]' : ''}`}>
                                                                    {getUserInitials(user.userName)}
                                                                </div>
                                                                <div>
                                                                    <p className={`text-sm font-semibold ${isCurrentUser ? 'text-[#111318] dark:text-white font-bold' : 'text-[#111318] dark:text-white'}`}>
                                                                        {user.userName} {isCurrentUser && <span className="text-primary">(Siz)</span>}
                                                                    </p>
                                                                    <p className="text-xs text-[#636f88] dark:text-gray-400">Komanda Üzvü</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDepartmentColor(index)}`}>
                                                                Şöbə
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-6 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full ${efficiency >= 90 ? 'bg-green-500' : efficiency >= 80 ? 'bg-yellow-500' : 'bg-orange-500'}`}
                                                                        style={{ width: `${efficiency}%` }}
                                                                    ></div>
                                                                </div>
                                                                <span className="text-xs font-medium text-[#111318] dark:text-white">
                                                                    {Math.round(efficiency)}%
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6 text-right">
                                                            <p className={`text-sm font-bold ${isCurrentUser ? 'text-primary' : 'text-[#111318] dark:text-white'}`}>
                                                                {user.totalPoints.toLocaleString()}
                                                            </p>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                <div className="border-t border-[#f0f2f4] dark:border-[#2d3748] px-6 py-4 flex items-center justify-between">
                                    <p className="text-sm text-[#636f88] dark:text-gray-400">
                                        Göstərilir: <span className="font-medium text-[#111318] dark:text-white">{leaderboard.length}</span> nəticədən{' '}
                                        <span className="font-medium text-[#111318] dark:text-white">1</span> -{' '}
                                        <span className="font-medium text-[#111318] dark:text-white">{Math.min(10, remainingUsers.length)}</span> arası
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            className="px-3 py-1 text-sm border border-[#dcdfe5] dark:border-[#4a5568] rounded-lg text-[#636f88] dark:text-gray-400 disabled:opacity-50"
                                            disabled
                                        >
                                            Əvvəlki
                                        </button>
                                        <button className="px-3 py-1 text-sm border border-[#dcdfe5] dark:border-[#4a5568] rounded-lg text-[#111318] dark:text-white hover:bg-[#f0f2f4] dark:hover:bg-[#2d3748]">
                                            Növbəti
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Leaderboard;
