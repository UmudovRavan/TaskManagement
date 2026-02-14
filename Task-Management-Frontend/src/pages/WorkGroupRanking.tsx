import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sidebar, Header } from '../layout';
import { authService, notificationService, performanceService } from '../api';
import userService from '../api/userService';
import { workGroupService } from '../api/workGroupService';
import type { WorkGroupResponse, WorkGroupMemberPerformance, NotificationResponse, LeaderboardEntry, UserResponse } from '../dto';
import { parseJwtToken, isTokenExpired, getPrimaryRole } from '../utils';
import type { UserInfo } from '../utils';

const SECTORS = [
    'Texnologiya',
    'Yaradıcılıq',
    'Marketinq',
    'Satış',
    'Dəstək',
    'İnzibati',
    'Maliyyə',
    'Əməliyyatlar',
];

const AVATAR_COLORS = [
    { bg: 'bg-primary/10', text: 'text-primary' },
    { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
    { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' },
    { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
    { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-400' },
    { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
];

const WorkGroupRanking: React.FC = () => {
    const navigate = useNavigate();
    const { workGroupId } = useParams<{ workGroupId: string }>();

    const [workGroup, setWorkGroup] = useState<WorkGroupResponse | null>(null);
    const [members, setMembers] = useState<WorkGroupMemberPerformance[]>([]);
    const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

    // Filter State
    const [filterType, setFilterType] = useState<'all' | 'high_eff' | 'low_eff' | 'high_points' | 'low_points'>('all');
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const filterDropdownRef = React.useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
                setShowFilterDropdown(false);
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

    const isManager = useMemo(() => {
        if (!userInfo || !userInfo.roles.length) return false;
        return userInfo.roles.some(
            (role) => role.toLowerCase() === 'manager' || role.toLowerCase() === 'admin'
        );
    }, [userInfo]);

    const isAdmin = useMemo(() => {
        if (!userInfo || !userInfo.roles.length) return false;
        return userInfo.roles.some((role) => role.toLowerCase() === 'admin');
    }, [userInfo]);

    const topPerformers = useMemo(() => members.slice(0, 3), [members]);
    const otherMembers = useMemo(() => members.slice(3), [members]);

    const filteredOtherMembers = useMemo(() => {
        let result = otherMembers;

        // Apply Search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter((m) => m.userName.toLowerCase().includes(query));
        }

        // Apply Filter
        switch (filterType) {
            case 'high_eff':
                result = result.filter(m => m.efficiency >= 80);
                break;
            case 'low_eff':
                result = result.filter(m => m.efficiency < 60);
                break;
            case 'high_points':
                result = [...result].sort((a, b) => b.totalPoints - a.totalPoints);
                break;
            case 'low_points':
                result = [...result].sort((a, b) => a.totalPoints - b.totalPoints);
                break;
            default:
                break;
        }

        return result;
    }, [otherMembers, searchQuery, filterType]);

    const totalPoints = useMemo(() => {
        return members.reduce((sum, m) => sum + m.totalPoints, 0);
    }, [members]);

    const groupSector = useMemo(() => {
        if (!workGroupId) return 'Technology';
        const index = parseInt(workGroupId, 10) % SECTORS.length;
        return SECTORS[index];
    }, [workGroupId]);

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

            const hasManagerAccess = parsedUser.roles.some(
                (role) => role.toLowerCase() === 'manager' || role.toLowerCase() === 'admin'
            );

            if (!hasManagerAccess) {
                navigate('/dashboard');
                return;
            }
        } else {
            navigate('/login');
            return;
        }

        if (workGroupId) {
            loadWorkGroupData(parseInt(workGroupId, 10));
        }
    }, [navigate, workGroupId]);

    const loadWorkGroupData = async (id: number) => {
        try {
            setLoading(true);

            const [workGroupData, leaderboardData, allUsersData, notificationsData] = await Promise.all([
                workGroupService.getWorkGroupById(id).catch(() => null),
                performanceService.getLeaderboard().catch(() => []),
                userService.getAllUsers().catch(() => []),
                notificationService.getMyNotifications().catch(() => []),
            ]);

            if (!workGroupData) {
                navigate('/work-groups');
                return;
            }

            setWorkGroup(workGroupData);
            setNotifications(notificationsData);

            processMembers(workGroupData, leaderboardData, allUsersData);
        } catch {
            navigate('/work-groups');
        } finally {
            setLoading(false);
        }
    };

    const processMembers = (group: WorkGroupResponse, leaderboardRaw: LeaderboardEntry[], allUsers: UserResponse[]) => {
        const userIds = group.userIds || [];

        // Map PascalCase to camelCase (backend returns PascalCase)
        const leaderboard = leaderboardRaw.map((item: any) => ({
            userId: item.userId || item.UserId,
            userName: item.userName || item.UserName,
            totalPoints: item.totalPoints ?? item.TotalPoints ?? 0
        }));

        console.log('[WorkGroupRanking] Mapped leaderboard:', leaderboard);

        const memberPerformance: WorkGroupMemberPerformance[] = userIds.map((userId, index) => {
            const leaderEntry = leaderboard.find((l) => l.userId === userId);
            const userEntry = allUsers.find((u) => u.id === userId);

            const totalPoints = leaderEntry?.totalPoints || 0;
            const userName = userEntry?.userName || leaderEntry?.userName || `Member ${index + 1}`;

            console.log(`[WorkGroupRanking] User ${userId}: ${userName} - ${totalPoints} points`);

            const baseTaskCount = Math.floor(totalPoints / 300);
            const varianceFromIndex = (index % 3) + 1;
            const completedTasks = baseTaskCount + varianceFromIndex;
            const efficiency = totalPoints > 0 ? Math.min(98, 70 + Math.floor(totalPoints / 500)) : 75;

            return {
                rank: 0,
                userId,
                userName,
                totalPoints,
                completedTasks,
                efficiency,
            };
        });

        memberPerformance.sort((a, b) => b.totalPoints - a.totalPoints);

        memberPerformance.forEach((member, index) => {
            member.rank = index + 1;
        });

        setMembers(memberPerformance);
    };

    const getInitials = (name: string): string => {
        const parts = name.split(' ').filter(Boolean);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const getAvatarColor = (index: number) => {
        return AVATAR_COLORS[index % AVATAR_COLORS.length];
    };

    const getMaxPoints = (): number => {
        if (members.length === 0) return 1;
        return members[0]?.totalPoints || 1;
    };

    const getProgressWidth = (points: number): number => {
        const maxPoints = getMaxPoints();
        return Math.round((points / maxPoints) * 100);
    };

    const handleBackClick = () => {
        navigate('/work-groups');
    };

    const handleEmployeeClick = (userId: string) => {
        navigate(`/employee/${userId}`);
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
                            <p className="text-sm text-[#636f88]">Reytinq məlumatları yüklənir...</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (!isManager || !workGroup) {
        return null;
    }

    return (
        <div className="flex h-screen w-full bg-background-light dark:bg-background-dark text-[#111318] dark:text-white font-display overflow-hidden">
            <Sidebar userName={displayName} userRole={userRole} />

            <div className="flex flex-1 flex-col h-full overflow-hidden relative">
                <Header notificationCount={notifications.filter((n) => !n.isRead).length} />

                <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark">
                    <div className="w-full max-w-[1200px] mx-auto px-4 md:px-8 py-8 flex flex-col gap-8">
                        {/* Header Section */}
                        <div className="flex flex-col gap-6">
                            {/* Back Navigation - Only for admin */}
                            {isAdmin && (
                                <div className="flex items-center">
                                    <button
                                        onClick={handleBackClick}
                                        className="group flex items-center gap-2 text-sm font-medium text-[#636f88] dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                                        <span>İş Qrupları</span>
                                    </button>
                                </div>
                            )}

                            {/* Page Heading */}
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#dcdfe5] dark:border-gray-700 pb-6">
                                <div className="flex flex-col gap-2">
                                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#111318] dark:text-white">
                                        {workGroup.name}
                                    </h1>
                                    <div className="flex items-center gap-2 text-sm text-[#636f88] dark:text-slate-400">
                                        <span className="inline-flex items-center gap-1 bg-white dark:bg-[#1a212e] px-2 py-1 rounded border border-[#dcdfe5] dark:border-gray-700">
                                            <span className="material-symbols-outlined text-[16px]">code</span>
                                            {groupSector}
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-[#dcdfe5] dark:bg-gray-700"></span>
                                        <span>{members.length} Üzv</span>
                                        <span className="w-1 h-1 rounded-full bg-[#dcdfe5] dark:bg-gray-700"></span>
                                        <span className="font-medium text-primary">
                                            {totalPoints.toLocaleString()} Ümumi Xal
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="relative" ref={filterDropdownRef}>
                                        <button
                                            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1a212e] border border-[#dcdfe5] dark:border-gray-700 rounded-lg text-sm font-medium text-[#111318] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">filter_list</span>
                                            Filtr
                                            <span className={`material-symbols-outlined text-[18px] transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`}>arrow_drop_down</span>
                                        </button>

                                        {showFilterDropdown && (
                                            <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-[#1a212e] border border-[#dcdfe5] dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                                <div className="p-1">
                                                    <button
                                                        onClick={() => { setFilterType('all'); setShowFilterDropdown(false); }}
                                                        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg ${filterType === 'all' ? 'bg-primary/10 text-primary font-medium' : 'text-[#111318] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                                    >
                                                        Hamısı
                                                        {filterType === 'all' && <span className="material-symbols-outlined text-[16px]">check</span>}
                                                    </button>
                                                    <button
                                                        onClick={() => { setFilterType('high_eff'); setShowFilterDropdown(false); }}
                                                        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg ${filterType === 'high_eff' ? 'bg-primary/10 text-primary font-medium' : 'text-[#111318] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                                    >
                                                        Yüksək Səmərəlilik (&gt;80%)
                                                        {filterType === 'high_eff' && <span className="material-symbols-outlined text-[16px]">check</span>}
                                                    </button>
                                                    <button
                                                        onClick={() => { setFilterType('low_eff'); setShowFilterDropdown(false); }}
                                                        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg ${filterType === 'low_eff' ? 'bg-primary/10 text-primary font-medium' : 'text-[#111318] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                                    >
                                                        Aşağı Səmərəlilik (&lt;60%)
                                                        {filterType === 'low_eff' && <span className="material-symbols-outlined text-[16px]">check</span>}
                                                    </button>
                                                    <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
                                                    <button
                                                        onClick={() => { setFilterType('high_points'); setShowFilterDropdown(false); }}
                                                        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg ${filterType === 'high_points' ? 'bg-primary/10 text-primary font-medium' : 'text-[#111318] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                                    >
                                                        Ən Çox Xal
                                                        {filterType === 'high_points' && <span className="material-symbols-outlined text-[16px]">check</span>}
                                                    </button>
                                                    <button
                                                        onClick={() => { setFilterType('low_points'); setShowFilterDropdown(false); }}
                                                        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg ${filterType === 'low_points' ? 'bg-primary/10 text-primary font-medium' : 'text-[#111318] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                                    >
                                                        Ən Az Xal
                                                        {filterType === 'low_points' && <span className="material-symbols-outlined text-[16px]">check</span>}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
                                        <span className="material-symbols-outlined text-[18px]">download</span>
                                        Hesabatı İxrac Et
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Top Performers Section */}
                        {topPerformers.length > 0 && (
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-2 px-1">
                                    <span className="material-symbols-outlined text-yellow-500">emoji_events</span>
                                    <h3 className="text-xl font-bold text-[#111318] dark:text-white">Ən Yaxşı Performans Göstərənlər</h3>
                                </div>
                                <div className={`grid gap-6 ${topPerformers.length === 1 ? 'grid-cols-1 max-w-md' : topPerformers.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-2xl' : 'grid-cols-1 md:grid-cols-3'}`}>
                                    {topPerformers.map((performer, index) => (
                                        <TopPerformerCard
                                            key={performer.userId}
                                            performer={performer}
                                            rank={index + 1}
                                            progressWidth={getProgressWidth(performer.totalPoints)}
                                            onClick={() => handleEmployeeClick(performer.userId)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Other Members Table */}
                        {members.length > 3 && (
                            <div className="flex flex-col gap-4 mt-4">
                                <div className="flex items-center justify-between px-1">
                                    <h3 className="text-xl font-bold text-[#111318] dark:text-white">Digər Üzvlər</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-2.5 top-2 text-[#636f88] dark:text-slate-400 text-[20px]">
                                                search
                                            </span>
                                            <input
                                                className="pl-9 pr-4 py-1.5 text-sm bg-white dark:bg-[#1a212e] border border-[#dcdfe5] dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-[#111318] dark:text-white w-64 placeholder-[#636f88] dark:placeholder-slate-400"
                                                placeholder="Üzv axtar..."
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-[#1a212e] border border-[#dcdfe5] dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-[#dcdfe5] dark:border-gray-700">
                                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#636f88] dark:text-slate-400 w-24">
                                                        Rütbə
                                                    </th>
                                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#636f88] dark:text-slate-400">
                                                        İşçi Adı
                                                    </th>
                                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#636f88] dark:text-slate-400">
                                                        Tamamlanmış Tapşırıqlar
                                                    </th>
                                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#636f88] dark:text-slate-400">
                                                        Ümumi Xallar
                                                    </th>
                                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#636f88] dark:text-slate-400 w-1/4">
                                                        Səmərəlilik
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#dcdfe5] dark:divide-gray-700">
                                                {filteredOtherMembers.map((member, idx) => (
                                                    <MemberTableRow
                                                        key={member.userId}
                                                        member={member}
                                                        avatarColor={getAvatarColor(idx + 3)}
                                                        initials={getInitials(member.userName)}
                                                        onClick={() => handleEmployeeClick(member.userId)}
                                                    />
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    <div className="flex items-center justify-between px-6 py-4 border-t border-[#dcdfe5] dark:border-gray-700 bg-white dark:bg-[#1a212e]">
                                        <p className="text-sm text-[#636f88] dark:text-slate-400">
                                            Göstərilir: {' '}
                                            <span className="font-medium text-[#111318] dark:text-white">{members.length}</span> nəticədən{' '}
                                            <span className="font-medium text-[#111318] dark:text-white">4</span> -{' '}
                                            <span className="font-medium text-[#111318] dark:text-white">
                                                {Math.min(members.length, filteredOtherMembers.length + 3)}
                                            </span>{' '}
                                            arası
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-[#636f88] dark:text-slate-400 disabled:opacity-50 transition-colors"
                                                disabled
                                            >
                                                <span className="material-symbols-outlined">chevron_left</span>
                                            </button>
                                            <button className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-[#636f88] dark:text-slate-400 transition-colors">
                                                <span className="material-symbols-outlined">chevron_right</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {members.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 px-4">
                                <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">
                                    group_off
                                </span>
                                <h3 className="text-lg font-semibold text-[#111318] dark:text-white mb-2">
                                    Üzv tapılmadı
                                </h3>
                                <p className="text-[#636f88] dark:text-slate-400 text-sm text-center max-w-md">
                                    Bu iş qrupunun hazırda performans məlumatı olan üzvü yoxdur.
                                </p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

interface TopPerformerCardProps {
    performer: WorkGroupMemberPerformance;
    rank: number;
    progressWidth: number;
    onClick: () => void;
}

const TopPerformerCard: React.FC<TopPerformerCardProps> = ({ performer, rank, progressWidth, onClick }) => {
    const rankConfig: Record<number, {
        label: string;
        badgeBg: string;
        badgeText: string;
        badgeBorder: string;
        trophyColor: string;
        progressColor: string;
    }> = {
        1: {
            label: 'Qızıl Rütbə',
            badgeBg: 'bg-yellow-100 dark:bg-yellow-900/30',
            badgeText: 'text-yellow-600 dark:text-yellow-400',
            badgeBorder: 'border-yellow-200 dark:border-yellow-800',
            trophyColor: 'text-yellow-500',
            progressColor: 'bg-yellow-500',
        },
        2: {
            label: 'Gümüş Rütbə',
            badgeBg: 'bg-slate-100 dark:bg-slate-800',
            badgeText: 'text-slate-600 dark:text-slate-400',
            badgeBorder: 'border-slate-200 dark:border-slate-700',
            trophyColor: 'text-slate-400',
            progressColor: 'bg-slate-400',
        },
        3: {
            label: 'Bürünc Rütbə',
            badgeBg: 'bg-amber-50 dark:bg-amber-900/20',
            badgeText: 'text-amber-700 dark:text-amber-600',
            badgeBorder: 'border-amber-200 dark:border-amber-800',
            trophyColor: 'text-amber-700',
            progressColor: 'bg-amber-700',
        },
    };

    const defaultConfig = {
        label: `Rütbə #${rank}`,
        badgeBg: 'bg-gray-100 dark:bg-gray-800',
        badgeText: 'text-gray-600 dark:text-gray-400',
        badgeBorder: 'border-gray-200 dark:border-gray-700',
        trophyColor: 'text-gray-400',
        progressColor: 'bg-gray-400',
    };

    const config = rankConfig[rank] || defaultConfig;

    return (
        <div
            onClick={onClick}
            className="relative flex flex-col gap-4 rounded-xl p-6 bg-white dark:bg-[#1a212e] border border-[#dcdfe5] dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow group overflow-hidden cursor-pointer">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className={`material-symbols-outlined text-8xl ${config.trophyColor}`}>trophy</span>
            </div>
            <div className="flex items-center gap-3 relative z-10">
                <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full ${config.badgeBg} ${config.badgeText} border ${config.badgeBorder}`}
                >
                    <span className="font-bold text-lg">{rank}</span>
                </div>
                <div>
                    <p className="text-sm font-medium text-[#636f88] dark:text-slate-400">{config.label}</p>
                    <p className="text-lg font-bold text-[#111318] dark:text-white">{performer.userName}</p>
                </div>
            </div>
            <div className="flex flex-col gap-1 relative z-10 mt-2">
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-[#111318] dark:text-white">
                        {performer.totalPoints.toLocaleString()}
                    </span>
                    <span className="text-sm text-[#636f88] dark:text-slate-400">pts</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#636f88] dark:text-slate-400 mt-2">
                    <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>
                    {performer.completedTasks} Tapşırıq Tamamlandı
                </div>
            </div>
            <div className="h-1 w-full bg-gray-100 dark:bg-gray-700 rounded-full mt-2 overflow-hidden">
                <div className={`h-full ${config.progressColor}`} style={{ width: `${progressWidth}%` }}></div>
            </div>
        </div>
    );
};

interface MemberTableRowProps {
    member: WorkGroupMemberPerformance;
    avatarColor: { bg: string; text: string };
    initials: string;
    onClick: () => void;
}

const MemberTableRow: React.FC<MemberTableRowProps> = ({ member, avatarColor, initials, onClick }) => {
    const getEfficiencyColor = (efficiency: number) => {
        if (efficiency >= 80) return 'text-emerald-600 dark:text-emerald-400';
        if (efficiency >= 60) return 'text-primary';
        return 'text-amber-600 dark:text-amber-400';
    };

    const getProgressColor = (efficiency: number) => {
        if (efficiency >= 80) return 'bg-emerald-500';
        if (efficiency >= 60) return 'bg-primary';
        return 'bg-amber-500';
    };

    return (
        <tr onClick={onClick} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
            <td className="px-6 py-4 text-sm font-medium text-[#636f88] dark:text-slate-400">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-bold text-[#111318] dark:text-white">
                    {member.rank}
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div
                        className={`w-8 h-8 rounded-full ${avatarColor.bg} flex items-center justify-center ${avatarColor.text} font-bold text-xs`}
                    >
                        {initials}
                    </div>
                    <span className="text-sm font-medium text-[#111318] dark:text-white">{member.userName}</span>
                </div>
            </td>
            <td className="px-6 py-4 text-sm text-[#636f88] dark:text-slate-400">{member.completedTasks}</td>
            <td className="px-6 py-4 text-sm font-semibold text-[#111318] dark:text-white">
                {member.totalPoints.toLocaleString()}
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${getProgressColor(member.efficiency)} rounded-full`}
                            style={{ width: `${member.efficiency}%` }}
                        ></div>
                    </div>
                    <span className={`text-sm font-medium ${getEfficiencyColor(member.efficiency)} w-8`}>
                        {member.efficiency}%
                    </span>
                </div>
            </td>
        </tr>
    );
};

export default WorkGroupRanking;
