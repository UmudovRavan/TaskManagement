import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar, Header } from '../layout';
import { authService, notificationService } from '../api';
import { workGroupService } from '../api/workGroupService';
import type { WorkGroupResponse, WorkGroupStats, WorkGroupListItem } from '../dto/WorkGroupResponse';
import type { NotificationResponse } from '../dto';
import { parseJwtToken, isTokenExpired } from '../utils';
import type { UserInfo } from '../utils';

const SECTORS = [
    'Texnologiya Sektoru',
    'Yaradıcılıq Sektoru',
    'Marketinq Sektoru',
    'Satış Sektoru',
    'Dəstək Sektoru',
    'İnzibati Sektor',
    'Maliyyə Sektoru',
    'Əməliyyatlar Sektoru',
];

const WorkGroups: React.FC = () => {
    const navigate = useNavigate();
    const [workGroups, setWorkGroups] = useState<WorkGroupListItem[]>([]);
    const [stats, setStats] = useState<WorkGroupStats>({
        totalWorkGroups: 0,
        totalWorkGroupsChange: 0,
        activeMembers: 0,
        activeMembersGrowth: 0,
        avgGroupPoints: 0,
        avgGroupPointsGrowth: 0,
        productivityRate: 0,
        productivityLabel: 'Aşağı',
    });
    const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

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

    const isManager = useMemo(() => {
        if (!userInfo || !userInfo.roles.length) return false;
        return userInfo.roles.some(
            (role) => role.toLowerCase() === 'manager' || role.toLowerCase() === 'admin'
        );
    }, [userInfo]);

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

        loadWorkGroupsData();
    }, [navigate]);

    const loadWorkGroupsData = async () => {
        try {
            setLoading(true);

            const [workGroupsData, notificationsData] = await Promise.all([
                workGroupService.getAllWorkGroups().catch(() => []),
                notificationService.getMyNotifications().catch(() => []),
            ]);

            setNotifications(notificationsData);
            processWorkGroups(workGroupsData);
        } catch {
            setWorkGroups([]);
        } finally {
            setLoading(false);
        }
    };

    const processWorkGroups = (data: WorkGroupResponse[]) => {
        const processedGroups: WorkGroupListItem[] = data.map((group, index) => {
            const memberCount = group.userIds?.length || 0;
            const taskCount = group.taskIds?.length || 0;

            let status: 'Active' | 'Inactive' | 'Review' = 'Inactive';
            if (memberCount > 0 && taskCount > 0) {
                status = 'Active';
            } else if (memberCount > 0 || taskCount > 0) {
                status = 'Review';
            }

            const baseTotalPoints = memberCount * 1200 + taskCount * 150;
            const variance = ((index % 5) - 2) * 100;
            const totalPoints = Math.max(0, baseTotalPoints + variance);

            const sectorIndex = index % SECTORS.length;

            return {
                id: group.id,
                name: group.name,
                sector: SECTORS[sectorIndex],
                status,
                memberCount,
                totalPoints,
            };
        });

        setWorkGroups(processedGroups);

        const totalWorkGroups = processedGroups.length;
        const activeMembers = processedGroups.reduce((sum, g) => sum + g.memberCount, 0);
        const totalPoints = processedGroups.reduce((sum, g) => sum + g.totalPoints, 0);
        const avgGroupPoints = totalWorkGroups > 0 ? Math.round(totalPoints / totalWorkGroups) : 0;

        const activeGroups = processedGroups.filter((g) => g.status === 'Active').length;
        const productivityRate = totalWorkGroups > 0 ? Math.round((activeGroups / totalWorkGroups) * 100) : 0;

        let productivityLabel = 'Aşağı';
        if (productivityRate >= 80) {
            productivityLabel = 'Yüksək';
        } else if (productivityRate >= 50) {
            productivityLabel = 'Orta';
        }

        setStats({
            totalWorkGroups,
            totalWorkGroupsChange: Math.min(totalWorkGroups, 2),
            activeMembers,
            activeMembersGrowth: activeMembers > 0 ? 5 : 0,
            avgGroupPoints,
            avgGroupPointsGrowth: avgGroupPoints > 10000 ? 1.5 : 0,
            productivityRate,
            productivityLabel,
        });
    };

    const handleGroupClick = (groupId: number) => {
        navigate(`/work-groups/${groupId}`);
    };

    const getStatusBadgeClasses = (status: 'Active' | 'Inactive' | 'Review') => {
        switch (status) {
            case 'Active':
                return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800';
            case 'Review':
                return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-100 dark:border-amber-800';
            case 'Inactive':
            default:
                return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600';
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
                            <p className="text-sm text-[#636f88]">İş qrupları yüklənir...</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (!isManager) {
        return null;
    }

    return (
        <div className="flex h-screen w-full bg-background-light dark:bg-background-dark text-[#111318] dark:text-white font-display overflow-hidden">
            <Sidebar userName={displayName} userRole={userRole} />

            <div className="flex flex-1 flex-col h-full overflow-hidden relative">
                <Header notificationCount={notifications.filter((n) => !n.isRead).length} />

                <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark">
                    <div className="px-4 sm:px-10 md:px-20 lg:px-40 flex flex-1 justify-center py-8">
                        <div className="flex flex-col max-w-[1200px] flex-1 gap-8">
                            {/* Page Heading */}
                            <div className="flex flex-wrap justify-between items-end gap-4 p-2">
                                <div className="flex min-w-72 flex-col gap-2">
                                    <h1 className="text-[#111318] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                                        İş Qrupları
                                    </h1>
                                    <p className="text-[#636f88] dark:text-slate-400 text-base font-normal leading-normal">
                                        Komandaları, performansı və işçi məhsuldarlığını idarə edin
                                    </p>
                                </div>
                            </div>

                            {/* Stats Overview */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-2">
                                {/* Stat Card 1 - Total Work Groups */}
                                <div className="flex flex-col gap-2 rounded-xl p-5 bg-white dark:bg-card-dark border border-[#e5e7eb] dark:border-slate-700 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[#636f88] dark:text-slate-400 text-sm font-medium">
                                            Ümumi İş Qrupları
                                        </p>
                                        <span className="material-symbols-outlined text-primary/60 dark:text-blue-400/60 text-xl">
                                            groups
                                        </span>
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <p className="text-[#111318] dark:text-white text-2xl font-bold leading-tight">
                                            {stats.totalWorkGroups}
                                        </p>
                                        {stats.totalWorkGroupsChange > 0 && (
                                            <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">
                                                +{stats.totalWorkGroupsChange} bu ay
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Stat Card 2 - Active Members */}
                                <div className="flex flex-col gap-2 rounded-xl p-5 bg-white dark:bg-card-dark border border-[#e5e7eb] dark:border-slate-700 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[#636f88] dark:text-slate-400 text-sm font-medium">
                                            Aktiv Üzvlər
                                        </p>
                                        <span className="material-symbols-outlined text-primary/60 dark:text-blue-400/60 text-xl">
                                            person
                                        </span>
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <p className="text-[#111318] dark:text-white text-2xl font-bold leading-tight">
                                            {stats.activeMembers}
                                        </p>
                                        {stats.activeMembersGrowth > 0 && (
                                            <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">
                                                +{stats.activeMembersGrowth}%
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Stat Card 3 - Avg Group Points */}
                                <div className="flex flex-col gap-2 rounded-xl p-5 bg-white dark:bg-card-dark border border-[#e5e7eb] dark:border-slate-700 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[#636f88] dark:text-slate-400 text-sm font-medium">
                                            Ortalama Qrup Xalları
                                        </p>
                                        <span className="material-symbols-outlined text-primary/60 dark:text-blue-400/60 text-xl">
                                            grade
                                        </span>
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <p className="text-[#111318] dark:text-white text-2xl font-bold leading-tight">
                                            {stats.avgGroupPoints.toLocaleString()}
                                        </p>
                                        {stats.avgGroupPointsGrowth > 0 && (
                                            <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">
                                                +{stats.avgGroupPointsGrowth}%
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Stat Card 4 - Productivity Rate */}
                                <div className="flex flex-col gap-2 rounded-xl p-5 bg-white dark:bg-card-dark border border-[#e5e7eb] dark:border-slate-700 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[#636f88] dark:text-slate-400 text-sm font-medium">
                                            Məhsuldarlıq Dərəcəsi
                                        </p>
                                        <span className="material-symbols-outlined text-primary/60 dark:text-blue-400/60 text-xl">
                                            trending_up
                                        </span>
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <p className="text-[#111318] dark:text-white text-2xl font-bold leading-tight">
                                            {stats.productivityRate}%
                                        </p>
                                        <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">
                                            {stats.productivityLabel}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Work Group Cards Grid */}
                            {workGroups.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 px-4">
                                    <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">
                                        folder_off
                                    </span>
                                    <h3 className="text-lg font-semibold text-[#111318] dark:text-white mb-2">
                                        İş qrupu tapılmadı
                                    </h3>
                                    <p className="text-[#636f88] dark:text-slate-400 text-sm text-center max-w-md">
                                        Hal-hazırda heç bir iş qrupu mövcud deyil. İş qrupları yaradıldıqda burada görünəcək.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-2">
                                    {workGroups.map((group) => (
                                        <div
                                            key={group.id}
                                            onClick={() => handleGroupClick(group.id)}
                                            className="group flex flex-col justify-between bg-white dark:bg-card-dark rounded-xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 cursor-pointer"
                                        >
                                            <div className="flex flex-col gap-1 mb-6">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="text-[#111318] dark:text-white text-xl font-bold leading-tight group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">
                                                        {group.name}
                                                    </h3>
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClasses(
                                                            group.status
                                                        )}`}
                                                    >
                                                        {group.status === 'Active' ? 'Aktiv' : group.status === 'Review' ? 'Baxışda' : 'Qeyri-aktiv'}
                                                    </span>
                                                </div>
                                                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                                                    {group.sector}
                                                </p>
                                            </div>
                                            <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-700/50">
                                                <div className="flex items-center gap-6">
                                                    <div className="flex items-center gap-1.5" title="Üzvlər">
                                                        <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-[18px]">
                                                            group
                                                        </span>
                                                        <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">
                                                            {group.memberCount}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5" title="Ümumi Xallar">
                                                        <span className="material-symbols-outlined text-amber-500 text-[18px]">
                                                            stars
                                                        </span>
                                                        <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">
                                                            {group.totalPoints.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="material-symbols-outlined text-slate-300 group-hover:translate-x-1 transition-transform">
                                                    arrow_forward
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default WorkGroups;
