import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar, Header } from '../layout';
import { KpiCard, WorkloadChart, ActivityFeed } from '../components';
import { dashboardService, notificationService, authService } from '../api';
import type { TaskResponse, NotificationResponse } from '../dto';
import { TaskStatus } from '../dto';
import { parseJwtToken, isTokenExpired } from '../utils';
import type { UserInfo } from '../utils';

interface DashboardStats {
    activeTasks: number;
    overdueTasks: number;
    overdueNew: number;
    completedTasks: number;
    completedGrowth: number;
    workloadPercentage: number;
}

const DashboardOverview: React.FC = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState<TaskResponse[]>([]);
    const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
    const [stats, setStats] = useState<DashboardStats>({
        activeTasks: 0,
        overdueTasks: 0,
        overdueNew: 0,
        completedTasks: 0,
        completedGrowth: 0,
        workloadPercentage: 0,
    });
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

        loadDashboardData();
    }, [navigate]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            const [tasksData, notificationsData] = await Promise.all([
                dashboardService.getAllTasks().catch(() => []),
                notificationService.getMyNotifications().catch(() => []),
            ]);

            setTasks(tasksData);
            setNotifications(notificationsData);
            calculateStats(tasksData);
        } catch {
            // Silent fail - data will show as empty
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (taskList: TaskResponse[]) => {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 86400000);

        const activeTasks = taskList.filter(
            (t) => t.status !== TaskStatus.Completed && t.status !== TaskStatus.Expired
        ).length;

        const overdueTasks = taskList.filter(
            (t) => new Date(t.deadline) < now && t.status !== TaskStatus.Completed
        ).length;

        const overdueNew = taskList.filter(
            (t) =>
                new Date(t.deadline) < now &&
                new Date(t.deadline) > yesterday &&
                t.status !== TaskStatus.Completed
        ).length;

        const completedTasks = taskList.filter(
            (t) => t.status === TaskStatus.Completed
        ).length;

        const assignedTasks = taskList.filter((t) => t.assignedToUserId).length;
        const workloadPercentage =
            taskList.length > 0 ? Math.round((assignedTasks / taskList.length) * 100) : 0;

        const completedGrowth = taskList.length > 0
            ? Math.round((completedTasks / taskList.length) * 100)
            : 0;

        setStats({
            activeTasks,
            overdueTasks,
            overdueNew,
            completedTasks,
            completedGrowth,
            workloadPercentage,
        });
    };

    const getGreeting = (): string => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Sabahınız xeyir';
        if (hour < 18) return 'Hər vaxtınız xeyir';
        return 'Axşamınız xeyir';
    };

    const getCapacityLabel = (percentage: number): string => {
        if (percentage >= 80) return 'Yüksək tutum';
        if (percentage >= 50) return 'Orta tutum';
        return 'Aşağı tutum';
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
                            <p className="text-sm text-[#636f88]">İdarə paneli yüklənir...</p>
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
                <Header
                    notificationCount={notifications.filter((n) => !n.isRead).length}
                />

                <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-6 md:p-10">
                    <div className="mx-auto max-w-7xl flex flex-col gap-8">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-3xl md:text-4xl font-extrabold text-[#111318] dark:text-white tracking-tight">
                                {getGreeting()}, {displayName}
                            </h1>
                            <p className="text-[#636f88] text-base dark:text-gray-400">
                                Bu gün layihələrinizdə baş verənlər.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <KpiCard
                                title="Aktiv Tapşırıqlar"
                                value={stats.activeTasks}
                                subtitle="tapşırıq"
                                icon="assignment"
                                iconBgColor="bg-blue-50 dark:bg-blue-900/20"
                                iconColor="text-primary"
                            />

                            <KpiCard
                                title="Gecikmiş"
                                value={stats.overdueTasks}
                                subtitle={stats.overdueNew > 0 ? `+${stats.overdueNew} yeni` : undefined}
                                subtitleColor="red"
                                icon="warning"
                                iconBgColor="bg-red-50 dark:bg-red-900/20"
                                iconColor="text-red-600"
                            />

                            <KpiCard
                                title="Komanda İş Yükü"
                                value={stats.workloadPercentage}
                                icon="groups"
                                iconBgColor=""
                                iconColor=""
                                showProgress
                                progressValue={stats.workloadPercentage}
                                progressLabel={getCapacityLabel(stats.workloadPercentage)}
                            />

                            <KpiCard
                                title="Tamamlandı"
                                value={stats.completedTasks}
                                subtitle={`${stats.completedGrowth}%`}
                                subtitleColor="green"
                                trendIcon="trending_up"
                                icon="check_circle"
                                iconBgColor="bg-green-50 dark:bg-green-900/20"
                                iconColor="text-green-600"
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <WorkloadChart tasks={tasks} />
                            <ActivityFeed
                                notifications={notifications}
                                onViewAll={() => navigate('/notifications')}
                            />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardOverview;
