import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar, Header } from '../layout';
import { authService, notificationService, userService } from '../api';
import { workGroupService } from '../api/workGroupService';
import type { WorkGroupResponse, WorkGroupStats, WorkGroupListItem, CreateWorkGroupRequest } from '../dto/WorkGroupResponse';
import type { NotificationResponse, UserResponse } from '../dto';
import { parseJwtToken, isTokenExpired, getPrimaryRole } from '../utils';
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

    // Modal state for creating new work group
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState('');

    // Wizard states
    const [wizardStep, setWizardStep] = useState(1);
    const [allUsers, setAllUsers] = useState<UserResponse[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [selectedManagerId, setSelectedManagerId] = useState<string>('');
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
    const [managerSearch, setManagerSearch] = useState('');
    const [employeeSearch, setEmployeeSearch] = useState('');

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
        return userInfo.roles.some(
            (role) => role.toLowerCase() === 'admin'
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

            // Manager (not admin): redirect to their own group detail page
            const isUserAdmin = parsedUser.roles.some(r => r.toLowerCase() === 'admin');
            if (!isUserAdmin) {
                workGroupService.getAllWorkGroups().then(groups => {
                    const myGroup = groups.find(g => g.leaderId === parsedUser.userId);
                    if (myGroup) {
                        navigate(`/work-groups/${myGroup.id}`, { replace: true });
                    } else {
                        navigate('/dashboard');
                    }
                }).catch(() => navigate('/dashboard'));
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

            // Manager: only show the group they lead. Admin: show all.
            const token = authService.getToken();
            const parsedUser = token ? parseJwtToken(token) : null;
            const isUserAdmin = parsedUser?.roles.some(r => r.toLowerCase() === 'admin') ?? false;

            const filtered = isUserAdmin
                ? workGroupsData
                : workGroupsData.filter(g => g.leaderId === parsedUser?.userId);

            processWorkGroups(filtered);
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

    const loadUsers = async () => {
        setUsersLoading(true);
        try {
            const users = await userService.getAllUsers();
            setAllUsers(users);
        } catch {
            setAllUsers([]);
        } finally {
            setUsersLoading(false);
        }
    };

    const managers = useMemo(() => {
        return allUsers.filter(u => u.role?.toLowerCase() === 'manager');
    }, [allUsers]);

    const employees = useMemo(() => {
        return allUsers.filter(u => u.role?.toLowerCase() === 'employee');
    }, [allUsers]);

    const filteredManagers = useMemo(() => {
        if (!managerSearch.trim()) return managers;
        const s = managerSearch.toLowerCase();
        return managers.filter(m => m.userName.toLowerCase().includes(s) || m.email.toLowerCase().includes(s));
    }, [managers, managerSearch]);

    const filteredEmployees = useMemo(() => {
        if (!employeeSearch.trim()) return employees;
        const s = employeeSearch.toLowerCase();
        return employees.filter(e => e.userName.toLowerCase().includes(s) || e.email.toLowerCase().includes(s));
    }, [employees, employeeSearch]);

    const handleOpenCreateModal = () => {
        setShowCreateModal(true);
        setWizardStep(1);
        setNewGroupName('');
        setSelectedManagerId('');
        setSelectedEmployeeIds([]);
        setCreateError('');
        setManagerSearch('');
        setEmployeeSearch('');
        loadUsers();
    };

    const handleNextStep = () => {
        if (wizardStep === 1 && !newGroupName.trim()) {
            setCreateError('İş qrupu adı boş ola bilməz');
            return;
        }
        if (wizardStep === 2 && !selectedManagerId) {
            setCreateError('Manager seçilməlidir');
            return;
        }
        setCreateError('');
        setWizardStep(prev => prev + 1);
    };

    const handlePrevStep = () => {
        setCreateError('');
        setWizardStep(prev => prev - 1);
    };

    const toggleEmployee = (id: string) => {
        setSelectedEmployeeIds(prev =>
            prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
        );
    };

    const handleCreateWorkGroup = async () => {
        if (selectedEmployeeIds.length === 0) {
            setCreateError('Ən azı 1 işçi seçilməlidir');
            return;
        }

        setCreating(true);
        setCreateError('');

        try {
            const request: CreateWorkGroupRequest = {
                name: newGroupName.trim(),
                leaderId: selectedManagerId,
                userIds: selectedEmployeeIds,
                taskIds: [],
            };

            await workGroupService.createWorkGroup(request);
            setShowCreateModal(false);
            loadWorkGroupsData();
        } catch (error: any) {
            console.error('Error creating work group:', error);
            setCreateError(error.response?.data?.message || 'İş qrupu yaradılarkən xəta baş verdi');
        } finally {
            setCreating(false);
        }
    };

    const handleCloseModal = () => {
        setShowCreateModal(false);
        setNewGroupName('');
        setCreateError('');
        setWizardStep(1);
        setSelectedManagerId('');
        setSelectedEmployeeIds([]);
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
                                {/* Create Work Group Button - Only visible for admin */}
                                {isAdmin && (
                                    <button
                                        onClick={handleOpenCreateModal}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                                    >
                                        <span className="material-symbols-outlined text-xl">add</span>
                                        Yeni İş Qrupu Yarat
                                    </button>
                                )}
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

            {/* Create Work Group Wizard Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-card-dark rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                            <h2 className="text-lg font-bold text-[#111318] dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">group_add</span>
                                Yeni İş Qrupu Yarat
                            </h2>
                            <button onClick={handleCloseModal} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                <span className="material-symbols-outlined text-slate-500 dark:text-slate-400">close</span>
                            </button>
                        </div>

                        {/* Step Indicator */}
                        <div className="flex items-center gap-2 px-6 pt-4">
                            {[1, 2, 3].map(step => (
                                <div key={step} className="flex items-center flex-1 gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all ${wizardStep === step ? 'bg-primary text-white shadow-md' :
                                        wizardStep > step ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                                        }`}>{wizardStep > step ? '✓' : step}</div>
                                    {step < 3 && <div className={`flex-1 h-1 rounded-full transition-all ${wizardStep > step ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />}
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between px-6 mt-1 mb-2">
                            <span className="text-xs text-slate-500 w-1/3">Ad</span>
                            <span className="text-xs text-slate-500 w-1/3 text-center">Manager</span>
                            <span className="text-xs text-slate-500 w-1/3 text-right">İşçilər</span>
                        </div>

                        {/* Step Content */}
                        <div className="px-6 py-4 min-h-[280px] max-h-[400px] overflow-y-auto">
                            {/* Step 1: Group Name */}
                            {wizardStep === 1 && (
                                <div>
                                    <label className="block text-sm font-medium text-[#636f88] dark:text-slate-400 mb-2">İş Qrupu Adı</label>
                                    <input
                                        type="text"
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                        placeholder="Məsələn: Marketinq Komandası"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-[#111318] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                        autoFocus
                                    />
                                </div>
                            )}

                            {/* Step 2: Select Manager */}
                            {wizardStep === 2 && (
                                <div>
                                    <label className="block text-sm font-medium text-[#636f88] dark:text-slate-400 mb-2">Manager Seçin</label>
                                    <input
                                        type="text"
                                        value={managerSearch}
                                        onChange={(e) => setManagerSearch(e.target.value)}
                                        placeholder="Manager axtar..."
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-[#111318] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 mb-3 text-sm"
                                    />
                                    {usersLoading ? (
                                        <div className="flex justify-center py-8"><div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin"></div></div>
                                    ) : filteredManagers.length === 0 ? (
                                        <p className="text-sm text-slate-500 text-center py-6">Manager tapılmadı</p>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            {filteredManagers.map(m => (
                                                <div
                                                    key={m.id}
                                                    onClick={() => setSelectedManagerId(m.id)}
                                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedManagerId === m.id
                                                        ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-sm'
                                                        : 'border-slate-200 dark:border-slate-700 hover:border-primary/40'
                                                        }`}
                                                >
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${selectedManagerId === m.id ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                                        }`}>{m.userName.charAt(0).toUpperCase()}</div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-[#111318] dark:text-white truncate">{m.userName}</p>
                                                        <p className="text-xs text-slate-500 truncate">{m.email}</p>
                                                    </div>
                                                    {selectedManagerId === m.id && (
                                                        <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Step 3: Select Employees */}
                            {wizardStep === 3 && (
                                <div>
                                    <label className="block text-sm font-medium text-[#636f88] dark:text-slate-400 mb-2">
                                        İşçilər Seçin <span className="text-primary">({selectedEmployeeIds.length} seçildi)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={employeeSearch}
                                        onChange={(e) => setEmployeeSearch(e.target.value)}
                                        placeholder="İşçi axtar..."
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-[#111318] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 mb-3 text-sm"
                                    />
                                    {usersLoading ? (
                                        <div className="flex justify-center py-8"><div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin"></div></div>
                                    ) : filteredEmployees.length === 0 ? (
                                        <p className="text-sm text-slate-500 text-center py-6">İşçi tapılmadı</p>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            {filteredEmployees.map(e => {
                                                const isSelected = selectedEmployeeIds.includes(e.id);
                                                return (
                                                    <div
                                                        key={e.id}
                                                        onClick={() => toggleEmployee(e.id)}
                                                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isSelected
                                                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-sm'
                                                            : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                                                            }`}
                                                    >
                                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-slate-600'
                                                            }`}>
                                                            {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                                                        </div>
                                                        <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300">
                                                            {e.userName.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-[#111318] dark:text-white truncate">{e.userName}</p>
                                                            <p className="text-xs text-slate-500 truncate">{e.email}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Error Message */}
                            {createError && (
                                <div className="mt-3 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                                    <span className="material-symbols-outlined text-base">error</span>
                                    {createError}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700">
                            <button
                                onClick={wizardStep === 1 ? handleCloseModal : handlePrevStep}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-[#636f88] dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                {wizardStep === 1 ? 'Ləğv Et' : '← Geri'}
                            </button>
                            {wizardStep < 3 ? (
                                <button
                                    onClick={handleNextStep}
                                    className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary hover:bg-blue-700 text-white text-sm font-semibold transition-all"
                                >
                                    Növbəti →
                                </button>
                            ) : (
                                <button
                                    onClick={handleCreateWorkGroup}
                                    disabled={creating || selectedEmployeeIds.length === 0}
                                    className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {creating ? (
                                        <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Yaradılır...</>
                                    ) : (
                                        <><span className="material-symbols-outlined text-lg">check</span> Yarat</>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkGroups;
