import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Sidebar, Header } from '../layout';
import { useNotifications } from '../context';
import { taskService, authService, notificationService, userService, attachmentService } from '../api';
import type { TaskResponse, NotificationResponse, UserResponse } from '../dto';
import { TaskStatus } from '../dto';
import { parseJwtToken, isTokenExpired, getPrimaryRole } from '../utils';
import type { UserInfo } from '../utils';

type AssignmentStatus = 'pending' | 'accepted' | 'rejected';

const TaskAssignmentDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addToast } = useNotifications();
    const [task, setTask] = useState<TaskResponse | null>(null);
    const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
    const [allUsers, setAllUsers] = useState<UserResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

    // Assignment action state
    const [assignmentStatus, setAssignmentStatus] = useState<AssignmentStatus>('pending');
    const [isProcessing, setIsProcessing] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);

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

    const assignedUser = useMemo(() => {
        if (!task?.assignedToUserId || !allUsers.length) return null;
        return allUsers.find(u => u.id === task.assignedToUserId) || null;
    }, [task, allUsers]);

    const createdByUser = useMemo(() => {
        if (!task?.createdByUserId || !allUsers.length) return null;
        return allUsers.find(u => u.id === task.createdByUserId) || null;
    }, [task, allUsers]);

    // Check if current user is the assigned user (can accept/reject)
    const isAssignedUser = useMemo(() => {
        if (!task || !userInfo) return false;
        return task.assignedToUserId === userInfo.userId;
    }, [task, userInfo]);

    // Check if task is in assigned status (can be accepted/rejected)
    const canAcceptReject = useMemo(() => {
        if (!task || !isAssignedUser) return false;
        return task.status === TaskStatus.Assigned;
    }, [task, isAssignedUser]);

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

            // Determine initial assignment status based on task status
            if (taskData.status === TaskStatus.InProgress) {
                setAssignmentStatus('accepted');
            } else if (taskData.status === TaskStatus.Assigned && !taskData.assignedToUserId) {
                setAssignmentStatus('rejected');
            }
        } catch {
            navigate('/tasks');
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptTask = async () => {
        if (!task || !userInfo) return;

        setIsProcessing(true);
        try {
            await taskService.acceptTask(task.id);
            setAssignmentStatus('accepted');
            // Reload task to get updated status
            const updatedTask = await taskService.getTaskById(task.id);
            setTask(updatedTask);
            addToast('Tapşırıq uğurla qəbul edildi', undefined, 'success');
        } catch (error: any) {
            const errorMessage = error.response?.data?.message
                || error.response?.data
                || 'Tapşırığı qəbul etmək mümkün olmadı';
            addToast(errorMessage, undefined, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRejectTask = async () => {
        if (!task || !userInfo || !rejectReason.trim()) return;

        setIsProcessing(true);
        try {
            await taskService.rejectTask(task.id, rejectReason.trim());
            setAssignmentStatus('rejected');
            setShowRejectModal(false);
            // Reload task to get updated status
            const updatedTask = await taskService.getTaskById(task.id);
            setTask(updatedTask);
            addToast('Tapşırıq rədd edildi', undefined, 'success');
        } catch (error: any) {
            const errorMessage = error.response?.data?.message
                || error.response?.data
                || 'Tapşırığı rədd etmək mümkün olmadı';
            addToast(errorMessage, undefined, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownloadAttachment = async (attachmentId: number, fileName: string) => {
        if (!userInfo) return;

        try {
            const blob = await attachmentService.downloadAttachment(attachmentId, userInfo.userId);

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();

            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch {
            addToast('Faylı yükləmək mümkün olmadı', undefined, 'error');
        }
    };

    const handlePreviewAttachment = async (attachmentId: number) => {
        if (!userInfo) return;

        try {
            const previewUrl = await attachmentService.getPreviewUrl(attachmentId, userInfo.userId);

            if (!previewUrl || previewUrl === 'undefined' || previewUrl === 'null') {
                alert('Fayl önizləməsi mümkün deyil');
                return;
            }

            const link = document.createElement('a');
            link.href = previewUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error: any) {
            addToast(`Fayl önizləməsi mümkün olmadı: ${error.message || 'Naməlum xəta'}`, undefined, 'error');
        }
    };

    const getFileIcon = (contentType: string) => {
        if (contentType.startsWith('image/')) return 'image';
        if (contentType === 'application/pdf') return 'picture_as_pdf';
        if (contentType.includes('word') || contentType.includes('document')) return 'description';
        if (contentType.includes('spreadsheet') || contentType.includes('excel')) return 'table_chart';
        return 'attach_file';
    };

    const getFileIconColor = (contentType: string) => {
        if (contentType.startsWith('image/')) return 'text-blue-500 bg-blue-100 dark:bg-blue-900/30';
        if (contentType === 'application/pdf') return 'text-red-500 bg-red-100 dark:bg-red-900/30';
        if (contentType.includes('word')) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
        if (contentType.includes('spreadsheet') || contentType.includes('excel')) return 'text-green-600 bg-green-100 dark:bg-green-900/30';
        return 'text-gray-500 bg-gray-100 dark:bg-gray-800';
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
                            <p className="text-sm text-[#636f88]">Yüklənir...</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (!task) return null;

    // If task is accepted, show full task detail
    if (assignmentStatus === 'accepted' && task.status === TaskStatus.InProgress) {
        navigate(`/tasks/${task.id}`);
        return null;
    }

    return (
        <div className="flex h-screen w-full bg-background-light dark:bg-background-dark text-[#111318] dark:text-white font-display overflow-hidden">
            <Sidebar userName={displayName} userRole={userRole} />

            <div className="flex flex-1 flex-col h-full overflow-hidden relative">
                <Header notificationCount={notifications.filter((n) => !n.isRead).length} />

                <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-6 md:p-10">
                    <div className="mx-auto max-w-3xl">
                        {/* Breadcrumbs */}
                        <nav className="mb-6">
                            <div className="flex flex-wrap gap-2 text-sm">
                                <Link to="/notifications" className="text-[#636f88] hover:text-primary transition-colors font-medium">Bildirişlər</Link>
                                <span className="text-[#636f88] font-medium">/</span>
                                <span className="text-[#111318] dark:text-gray-200 font-medium">Tapşırıq #{task.id}</span>
                            </div>
                        </nav>

                        {/* Main Card */}
                        <div className="bg-white dark:bg-[#1a202c] rounded-2xl border border-[#dcdfe5] dark:border-gray-700 shadow-lg overflow-hidden">
                            {/* Header Section */}
                            <div className="p-8 border-b border-[#dcdfe5] dark:border-gray-700">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="px-3 py-1 text-xs font-bold rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                                                Yeni Tapşırıq
                                            </span>
                                            {assignmentStatus === 'rejected' && (
                                                <span className="px-3 py-1 text-xs font-bold rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                                                    Rədd edildi
                                                </span>
                                            )}
                                        </div>
                                        <h1 className="text-2xl md:text-3xl font-black leading-tight tracking-tight text-[#111318] dark:text-white">
                                            {task.title}
                                        </h1>
                                    </div>
                                </div>
                            </div>

                            {/* Description Section */}
                            <div className="p-8 border-b border-[#dcdfe5] dark:border-gray-700">
                                <h3 className="text-sm uppercase tracking-wider font-bold text-[#636f88] mb-3">Təsvir</h3>
                                <p className="text-base text-[#111318] dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {task.description || 'Təsvir verilməyib.'}
                                </p>
                            </div>

                            {/* Attachments Section */}
                            {task.files && task.files.length > 0 && (
                                <div className="p-8 border-b border-[#dcdfe5] dark:border-gray-700">
                                    <h3 className="text-sm uppercase tracking-wider font-bold text-[#636f88] mb-4">
                                        Əlavələr ({task.files.length})
                                    </h3>
                                    <div className="flex flex-col gap-3">
                                        {task.files.map((file, index) => (
                                            <div
                                                key={index}
                                                className="group flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-background-light dark:hover:bg-gray-800 transition-colors"
                                            >
                                                {/* File Icon */}
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getFileIconColor(file.contentType)}`}>
                                                    <span className="material-symbols-outlined">
                                                        {getFileIcon(file.contentType)}
                                                    </span>
                                                </div>

                                                {/* File Info */}
                                                <div
                                                    className="flex-1 min-w-0 cursor-pointer"
                                                    onClick={() => file.id && handlePreviewAttachment(file.id)}
                                                >
                                                    <p className="text-sm font-medium text-[#111318] dark:text-gray-200 truncate hover:text-primary">
                                                        {file.fileName}
                                                    </p>
                                                    <p className="text-xs text-[#636f88]">{file.contentType}</p>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => file.id && handlePreviewAttachment(file.id)}
                                                        className="p-2 text-[#636f88] hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                        title="Önizləmə"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                    </button>
                                                    <button
                                                        onClick={() => file.id && handleDownloadAttachment(file.id, file.fileName)}
                                                        className="p-2 text-[#636f88] hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                        title="Yüklə"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">download</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Assignee Section */}
                            <div className="p-8 border-b border-[#dcdfe5] dark:border-gray-700">
                                <h3 className="text-sm uppercase tracking-wider font-bold text-[#636f88] mb-4">Təyin edilən şəxs</h3>
                                {assignedUser ? (
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                                                {assignedUser.userName.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-[#1a202c] rounded-full"></div>
                                        </div>
                                        <div>
                                            <p className="text-base font-bold text-[#111318] dark:text-white">{assignedUser.userName}</p>
                                            <p className="text-xs text-[#636f88]">{assignedUser.email}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-[#636f88]">Heç kim təyin edilməyib</p>
                                )}

                                {createdByUser && (
                                    <div className="mt-6 pt-4 border-t border-[#dcdfe5] dark:border-gray-700">
                                        <h4 className="text-xs font-bold text-[#636f88] mb-2">Yaradan</h4>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm">
                                                {createdByUser.userName.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-sm font-medium text-[#111318] dark:text-white">{createdByUser.userName}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Rejected Status Message */}
                                {assignmentStatus === 'rejected' && (
                                    <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-red-500">cancel</span>
                                            <p className="text-sm font-medium text-red-700 dark:text-red-400">
                                                Bu tapşırıq rədd edildi
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            {canAcceptReject && assignmentStatus === 'pending' && (
                                <div className="p-8 bg-gray-50 dark:bg-gray-800/50">
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <button
                                            onClick={handleAcceptTask}
                                            disabled={isProcessing}
                                            className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/30"
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    Emal edilir...
                                                </>
                                            ) : (
                                                <>
                                                    <span className="material-symbols-outlined">check_circle</span>
                                                    Qəbul Et
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setShowRejectModal(true)}
                                            disabled={isProcessing}
                                            className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 bg-white dark:bg-gray-700 border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 font-bold rounded-xl transition-all hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="material-symbols-outlined">cancel</span>
                                            Rədd Et
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowRejectModal(false)}
                    ></div>

                    {/* Modal */}
                    <div className="relative bg-white dark:bg-[#1a202c] rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-red-500">warning</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-[#111318] dark:text-white">Tapşırığı Rədd Et</h3>
                                    <p className="text-sm text-[#636f88]">Rədd səbəbini bildirin</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Rədd etmə səbəbi..."
                                className="w-full bg-white dark:bg-gray-900 border border-[#dcdfe5] dark:border-gray-600 rounded-xl p-4 min-h-[120px] text-sm focus:ring-primary focus:border-primary resize-none text-[#111318] dark:text-white placeholder-[#636f88]"
                                autoFocus
                            />
                        </div>

                        <div className="p-6 pt-0 flex gap-3">
                            <button
                                onClick={() => setShowRejectModal(false)}
                                disabled={isProcessing}
                                className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-[#111318] dark:text-white font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                            >
                                Ləğv Et
                            </button>
                            <button
                                onClick={handleRejectTask}
                                disabled={isProcessing || !rejectReason.trim()}
                                className="flex-1 py-3 px-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Emal edilir...
                                    </>
                                ) : (
                                    'Rədd Et'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskAssignmentDetail;
