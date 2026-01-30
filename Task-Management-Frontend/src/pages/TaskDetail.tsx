import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Sidebar, Header } from '../layout';
import { taskService, authService, notificationService, userService, attachmentService, performanceService } from '../api';
import type { TaskResponse, NotificationResponse, UserResponse } from '../dto';
import { TaskStatus, DifficultyLevel } from '../dto';
import { parseJwtToken, isTokenExpired } from '../utils';
import type { UserInfo } from '../utils';
import UserSuggestionList from '../components/UserSuggestionList';

const TaskDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [task, setTask] = useState<TaskResponse | null>(null);
    const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
    const [allUsers, setAllUsers] = useState<UserResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

    // Comment state
    const [newComment, setNewComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);

    // Performance Points state
    const [performanceReason, setPerformanceReason] = useState('');
    const [submittingPerformance, setSubmittingPerformance] = useState(false);

    // Mention state for comments
    const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionIndex, setMentionIndex] = useState(0);
    const [mentionStartPosition, setMentionStartPosition] = useState(-1);
    const commentTextareaRef = useRef<HTMLTextAreaElement>(null);

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
            (r) => r.toLowerCase() === 'manager' || r.toLowerCase() === 'admin'
        );
    }, [userInfo]);

    const canEdit = useMemo(() => {
        if (!task || !userInfo) return false;
        return isManager || task.createdByUserId === userInfo.userId || task.assignedToUserId === userInfo.userId;
    }, [task, userInfo, isManager]);

    const canAddPerformance = useMemo(() => {
        if (!task || !userInfo) return false;
        // Only task creator can add performance points and task must be completed
        return task.createdByUserId === userInfo.userId && task.status === TaskStatus.Completed;
    }, [task, userInfo]);

    const assignedUser = useMemo(() => {
        if (!task?.assignedToUserId || !allUsers.length) return null;
        return allUsers.find(u => u.id === task.assignedToUserId) || null;
    }, [task, allUsers]);

    const createdByUser = useMemo(() => {
        if (!task?.createdByUserId || !allUsers.length) return null;
        return allUsers.find(u => u.id === task.createdByUserId) || null;
    }, [task, allUsers]);

    const getUserName = (userId: string) => {
        const user = allUsers.find(u => u.id === userId);
        return user?.userName || 'Naməlum İstifadəçi';
    };

    // Filter users for mention suggestions
    const filteredMentionUsers = useMemo(() => {
        if (!mentionQuery || mentionQuery.trim().length === 0) {
            return [];
        }
        const query = mentionQuery.toLowerCase();
        return allUsers.filter(
            (u) =>
                u.userName.toLowerCase().includes(query) ||
                u.email.toLowerCase().includes(query)
        ).slice(0, 5); // Limit to 5 suggestions
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
        } catch {
            navigate('/tasks');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!task || !confirm('Bu tapşırığı silmək istədiyinizə əminsiniz?')) return;
        try {
            await taskService.deleteTask(task.id);
            navigate('/tasks');
        } catch {
            alert('Tapşırığı silmək mümkün olmadı');
        }
    };

    const handleSubmitComment = async () => {
        if (!task || !userInfo || !newComment.trim()) return;

        setSubmittingComment(true);
        try {
            await taskService.addComment(task.id, userInfo.userId, newComment.trim());
            setNewComment('');
            // Reload task to get updated comments
            const updatedTask = await taskService.getTaskById(task.id);
            setTask(updatedTask);
        } catch {
            alert('Şərh əlavə etmək mümkün olmadı');
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleSubmitPerformance = async () => {
        if (!task || !userInfo || !performanceReason.trim()) return;
        if (task.status !== TaskStatus.Completed) {
            alert('Performans xalları yalnız tamamlanmış tapşırıqlara əlavə edilə bilər');
            return;
        }
        if (task.createdByUserId !== userInfo.userId) {
            alert('Yalnız tapşırığı yaradan performans xalı əlavə edə bilər');
            return;
        }
        if (!task.assignedToUserId) {
            alert('Bu tapşırığa təyin edilmiş istifadəçi yoxdur');
            return;
        }

        setSubmittingPerformance(true);
        try {
            await performanceService.addPerformancePoint({
                userId: task.assignedToUserId,
                taskId: task.id,
                reason: performanceReason.trim(),
                senderId: userInfo.userId
            });
            setPerformanceReason('');
            alert('Performans xalları uğurla əlavə edildi!');
        } catch (error: any) {
            const errorMessage = error.response?.data?.message
                || error.response?.data
                || 'Performans xalları əlavə etmək mümkün olmadı';
            alert(errorMessage);
        } finally {
            setSubmittingPerformance(false);
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
            alert('Faylı yükləmək mümkün olmadı');
        }
    };

    const handlePreviewAttachment = async (attachmentId: number) => {
        if (!userInfo) {
            console.error('[Preview] No user info');
            return;
        }

        console.log('[Preview] Starting preview for attachment:', attachmentId);

        try {
            const previewUrl = await attachmentService.getPreviewUrl(attachmentId, userInfo.userId);

            console.log('[Preview] Received URL from backend:', previewUrl);

            if (!previewUrl || previewUrl === 'undefined' || previewUrl === 'null') {
                console.error('[Preview] Invalid URL received:', previewUrl);
                alert('Önizləmə URL-i alına bilmədi - serverdən yanlış cavab');
                return;
            }

            // Create temporary link to bypass popup blocker
            const link = document.createElement('a');
            link.href = previewUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            console.log('[Preview] File opened in new tab');
        } catch (error: any) {
            console.error('[Preview] Error:', error);
            alert(`Faylın önizləməsi mümkün olmadı: ${error.message || 'Naməlum xəta'}`);
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

    // Handle comment textarea change with @ mention detection
    const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        const cursorPosition = e.target.selectionStart;
        setNewComment(value);

        // Find the last @ before cursor
        const textBeforeCursor = value.substring(0, cursorPosition);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        if (lastAtIndex !== -1) {
            // Check if there's a space between @ and cursor (means mention is complete)
            const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
            const hasSpace = textAfterAt.includes(' ');

            if (!hasSpace && textAfterAt.length > 0) {
                setShowMentionSuggestions(true);
                setMentionQuery(textAfterAt);
                setMentionStartPosition(lastAtIndex);
                setMentionIndex(0);
            } else {
                setShowMentionSuggestions(false);
                setMentionQuery('');
            }
        } else {
            setShowMentionSuggestions(false);
            setMentionQuery('');
        }
    };

    // Handle user selection from mention dropdown
    const handleMentionSelect = (user: UserResponse) => {
        if (mentionStartPosition === -1) return;

        const beforeMention = newComment.substring(0, mentionStartPosition);
        const cursorPos = commentTextareaRef.current?.selectionStart || mentionStartPosition + mentionQuery.length + 1;
        const afterMention = newComment.substring(cursorPos);

        const newText = `${beforeMention}@${user.userName} ${afterMention}`;
        setNewComment(newText);
        setShowMentionSuggestions(false);
        setMentionQuery('');
        setMentionStartPosition(-1);

        // Focus back to textarea
        setTimeout(() => {
            if (commentTextareaRef.current) {
                const newCursorPos = beforeMention.length + user.userName.length + 2;
                commentTextareaRef.current.focus();
                commentTextareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
        }, 0);
    };

    // Handle keyboard navigation in mention dropdown
    const handleCommentKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showMentionSuggestions && filteredMentionUsers.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setMentionIndex(prev => (prev + 1) % filteredMentionUsers.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setMentionIndex(prev => (prev - 1 + filteredMentionUsers.length) % filteredMentionUsers.length);
            } else if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleMentionSelect(filteredMentionUsers[mentionIndex]);
            } else if (e.key === 'Escape') {
                setShowMentionSuggestions(false);
            }
        }
    };

    // Render comment content with highlighted mentions
    const renderCommentContent = (content: string) => {
        const mentionRegex = /@(\w+)/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = mentionRegex.exec(content)) !== null) {
            // Add text before the mention
            if (match.index > lastIndex) {
                parts.push(content.substring(lastIndex, match.index));
            }
            // Add the mention with styling
            parts.push(
                <span key={match.index} className="text-primary font-medium">
                    @{match[1]}
                </span>
            );
            lastIndex = match.index + match[0].length;
        }
        // Add remaining text
        if (lastIndex < content.length) {
            parts.push(content.substring(lastIndex));
        }

        return parts.length > 0 ? parts : content;
    };

    const getStatusLabel = (status: number) => {
        switch (status) {
            case TaskStatus.Pending: return 'Gözləmədə';
            case TaskStatus.Assigned: return 'Təyin edilib';
            case TaskStatus.InProgress: return 'İcrada';
            case TaskStatus.Completed: return 'Tamamlandı';
            case TaskStatus.Expired: return 'Vaxtı bitib';
            default: return 'Naməlum';
        }
    };

    const getStatusColor = (status: number) => {
        switch (status) {
            case TaskStatus.Pending: return 'bg-yellow-50 text-yellow-700 border-yellow-100';
            case TaskStatus.Assigned: return 'bg-blue-50 text-blue-700 border-blue-100';
            case TaskStatus.InProgress: return 'bg-purple-50 text-purple-700 border-purple-100';
            case TaskStatus.Completed: return 'bg-green-50 text-green-700 border-green-100';
            case TaskStatus.Expired: return 'bg-red-50 text-red-700 border-red-100';
            default: return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    const getDifficultyLabel = (difficulty: number) => {
        switch (difficulty) {
            case DifficultyLevel.Easy: return 'Asan';
            case DifficultyLevel.Medium: return 'Orta';
            case DifficultyLevel.Hard: return 'Çətin';
            default: return 'Naməlum';
        }
    };

    const getDifficultyColor = (difficulty: number) => {
        switch (difficulty) {
            case DifficultyLevel.Easy: return 'bg-green-50 text-green-700 border-green-100';
            case DifficultyLevel.Medium: return 'bg-amber-50 text-amber-700 border-amber-100';
            case DifficultyLevel.Hard: return 'bg-red-50 text-red-700 border-red-100';
            default: return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatCommentDate = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'İndi';
        if (diffMins < 60) return `${diffMins} dəq əvvəl`;
        if (diffHours < 24) return `${diffHours} saat əvvəl`;
        if (diffDays < 7) return `${diffDays} gün əvvəl`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
                            <p className="text-sm text-[#636f88]">Tapşırıq məlumatları yüklənir...</p>
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

                <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-6 md:p-10">
                    <div className="mx-auto max-w-[1440px]">
                        {/* Breadcrumbs */}
                        <nav className="mb-6">
                            <div className="flex flex-wrap gap-2 text-sm">
                                <Link to="/tasks" className="text-[#636f88] hover:text-primary transition-colors font-medium">Tapşırıqlarım</Link>
                                <span className="text-[#636f88] font-medium">/</span>
                                <span className="text-[#111318] dark:text-gray-200 font-medium">Tapşırıq #{task.id}</span>
                            </div>
                        </nav>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            {/* LEFT COLUMN */}
                            <div className="lg:col-span-8 space-y-8">
                                {/* Task Header */}
                                <section className="bg-white dark:bg-[#1a202c] rounded-xl p-8 border border-[#dcdfe5] dark:border-gray-700 shadow-sm">
                                    <div className="flex flex-col gap-6">
                                        <div className="flex justify-between items-start gap-4">
                                            <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight text-[#111318] dark:text-white">
                                                {task.title}
                                            </h1>
                                            {canEdit && (
                                                <div className="flex gap-2 shrink-0">
                                                    <button
                                                        onClick={() => navigate(`/tasks/edit/${task.id}`)}
                                                        className="h-10 px-4 flex items-center justify-center rounded-lg bg-primary text-white font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm shadow-primary/30"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px] mr-2">edit</span>
                                                        Tapşırığı redaktə et
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Description */}
                                        <div className="prose prose-slate dark:prose-invert max-w-none">
                                            <h3 className="text-sm uppercase tracking-wider font-bold text-[#636f88] mb-3">Təsvir</h3>
                                            <p className="text-base text-[#111318] dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                                {task.description || 'Təsvir yoxdur.'}
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                {/* Attachments Section */}
                                {task.files && task.files.length > 0 && (
                                    <section className="bg-white dark:bg-[#1a202c] rounded-xl p-8 border border-[#dcdfe5] dark:border-gray-700 shadow-sm">
                                        <h2 className="text-xl font-bold text-[#111318] dark:text-white mb-6">
                                            Əlavələr ({task.files.length})
                                        </h2>
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
                                                            title="Preview"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                        </button>
                                                        <button
                                                            onClick={() => file.id && handleDownloadAttachment(file.id, file.fileName)}
                                                            className="p-2 text-[#636f88] hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                            title="Download"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">download</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Activity / Comments Section */}
                                <section className="bg-white dark:bg-[#1a202c] rounded-xl p-8 border border-[#dcdfe5] dark:border-gray-700 shadow-sm flex flex-col gap-6">
                                    <h2 className="text-xl font-bold text-[#111318] dark:text-white">Fəaliyyət</h2>

                                    {/* Comments List */}
                                    <div className="space-y-6">
                                        {task.taskComments && task.taskComments.length > 0 ? (
                                            task.taskComments.map((comment) => (
                                                <div key={comment.id} className="flex gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0 ring-2 ring-white dark:ring-gray-800">
                                                        {(comment.userName || getUserName(comment.userId)).charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="bg-background-light dark:bg-gray-800 p-4 rounded-2xl rounded-tl-none">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="font-bold text-[#111318] dark:text-white">
                                                                    {comment.userName || getUserName(comment.userId)}
                                                                </span>
                                                                <span className="text-xs text-[#636f88]">
                                                                    {formatCommentDate(comment.createdAt)}
                                                                </span>
                                                            </div>
                                                            <p className="text-[#111318] dark:text-gray-300 text-sm leading-relaxed">
                                                                {renderCommentContent(comment.content)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-[#636f88]">
                                                <span className="material-symbols-outlined text-4xl mb-2 block opacity-50">chat_bubble_outline</span>
                                                <p className="text-sm">Hələ şərh yoxdur. İlk şərh yazan siz olun!</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Comment Input with @mention */}
                                    <div className="flex gap-4 pt-6 border-t border-[#dcdfe5] dark:border-gray-700">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold text-sm shrink-0">
                                            {displayName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <div className="relative">
                                                <textarea
                                                    ref={commentTextareaRef}
                                                    value={newComment}
                                                    onChange={handleCommentChange}
                                                    onKeyDown={handleCommentKeyDown}
                                                    onBlur={() => setTimeout(() => setShowMentionSuggestions(false), 200)}
                                                    placeholder="Şərh yazın... komanda üzvlərini qeyd etmək üçün @ işarəsindən istifadə edin"
                                                    className="w-full bg-white dark:bg-gray-900 border border-[#dcdfe5] dark:border-gray-600 rounded-lg p-3 min-h-[100px] text-sm focus:ring-primary focus:border-primary resize-y text-[#111318] dark:text-white placeholder-[#636f88]"
                                                    disabled={submittingComment}
                                                />

                                                {/* Mention Suggestions Dropdown */}
                                                {showMentionSuggestions && filteredMentionUsers.length > 0 && (
                                                    <UserSuggestionList
                                                        users={filteredMentionUsers}
                                                        onSelect={handleMentionSelect}
                                                        position={{ top: -filteredMentionUsers.length * 52 - 10, left: 0 }}
                                                        selectedIndex={mentionIndex}
                                                    />
                                                )}
                                            </div>
                                            <div className="flex justify-between items-center mt-3">
                                                <div className="flex gap-2 items-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const cursorPos = commentTextareaRef.current?.selectionStart || newComment.length;
                                                            const newText = newComment.slice(0, cursorPos) + '@' + newComment.slice(cursorPos);
                                                            setNewComment(newText);
                                                            setMentionStartPosition(cursorPos);
                                                            setShowMentionSuggestions(false);
                                                            setTimeout(() => {
                                                                commentTextareaRef.current?.focus();
                                                                commentTextareaRef.current?.setSelectionRange(cursorPos + 1, cursorPos + 1);
                                                            }, 0);
                                                        }}
                                                        className="p-1.5 text-[#636f88] hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                                                        title="Mention a team member"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">alternate_email</span>
                                                    </button>
                                                    <span className="text-xs text-[#636f88]">Qeyd etmək üçün @ yazın</span>
                                                </div>
                                                <button
                                                    onClick={handleSubmitComment}
                                                    disabled={!newComment.trim() || submittingComment}
                                                    className="bg-primary text-white text-sm font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {submittingComment ? 'Göndərilir...' : 'Şərh yaz'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* RIGHT COLUMN */}
                            <aside className="lg:col-span-4 space-y-6">
                                {/* Properties Card */}
                                <div className="bg-white dark:bg-[#1a202c] rounded-xl p-6 border border-[#dcdfe5] dark:border-gray-700 shadow-sm">
                                    <h3 className="text-sm uppercase tracking-wider font-bold text-[#636f88] mb-4">Xüsusiyyətlər</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-[#636f88]">Status</span>
                                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getStatusColor(task.status)}`}>
                                                <span className="material-symbols-outlined text-[16px]">sync</span>
                                                <span className="text-sm font-bold">{getStatusLabel(task.status)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-[#636f88]">Çətinlik</span>
                                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getDifficultyColor(task.difficulty)}`}>
                                                <span className="material-symbols-outlined text-[16px]">flag</span>
                                                <span className="text-sm font-bold">{getDifficultyLabel(task.difficulty)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-[#636f88]">Son tarix</span>
                                            <div className="flex items-center gap-2 text-[#111318] dark:text-gray-200">
                                                <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                                                <span className="text-sm font-medium">{formatDate(task.deadline)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Performance Points Section - Only for completed tasks created by current user */}
                                {canAddPerformance && task.assignedToUserId && (
                                    <div className="bg-white dark:bg-[#1a202c] rounded-xl p-6 border border-[#dcdfe5] dark:border-gray-700 shadow-sm">
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="material-symbols-outlined text-primary text-[20px]">military_tech</span>
                                            <h3 className="text-sm uppercase tracking-wider font-bold text-[#636f88]">
                                                Performans Xalı Əlavə et
                                            </h3>
                                        </div>

                                        <p className="text-xs text-[#636f88] dark:text-gray-400 mb-4">
                                            Tamamlanmış tapşırıq haqqında fikirlərinizi bölüşün. Xallar çətinliyə əsasən avtomatik hesablanacaq.
                                        </p>

                                        <div className="space-y-3">
                                            <textarea
                                                value={performanceReason}
                                                onChange={(e) => setPerformanceReason(e.target.value)}
                                                placeholder="Bu tamamlanmış tapşırıq haqqında rəy və fikirlərinizi yazın..."
                                                className="w-full bg-white dark:bg-gray-900 border border-[#dcdfe5] dark:border-gray-600 rounded-lg p-3 min-h-[100px] text-sm focus:ring-primary focus:border-primary resize-y text-[#111318] dark:text-white placeholder-[#636f88]"
                                                disabled={submittingPerformance}
                                            />

                                            <div className="flex items-center justify-between text-xs text-[#636f88]">
                                                <span>
                                                    Xallar: {task.difficulty === DifficultyLevel.Easy ? '10' : task.difficulty === DifficultyLevel.Medium ? '20' : '30'} xal
                                                </span>
                                                <span className="font-medium">
                                                    {getDifficultyLabel(task.difficulty)} Tapşırıq
                                                </span>
                                            </div>

                                            <button
                                                onClick={handleSubmitPerformance}
                                                disabled={!performanceReason.trim() || submittingPerformance}
                                                className="w-full bg-primary text-white text-sm font-bold py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {submittingPerformance ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                        Xallar əlavə edilir...
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="material-symbols-outlined text-[18px]">add_circle</span>
                                                        Performans Xalı Əlavə et
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Assignee Card */}
                                <div className="bg-white dark:bg-[#1a202c] rounded-xl p-6 border border-[#dcdfe5] dark:border-gray-700 shadow-sm">
                                    <h3 className="text-sm uppercase tracking-wider font-bold text-[#636f88] mb-4">İcraçı</h3>
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
                                        <div className="mt-4 pt-4 border-t border-[#dcdfe5] dark:border-gray-700">
                                            <h4 className="text-xs font-bold text-[#636f88] mb-2">Yaradan</h4>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm">
                                                    {createdByUser.userName.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-sm font-medium text-[#111318] dark:text-white">{createdByUser.userName}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Delete Button */}
                                {canEdit && (
                                    <div className="bg-white dark:bg-[#1a202c] rounded-xl p-4 border border-[#dcdfe5] dark:border-gray-700 shadow-sm">
                                        <button
                                            onClick={handleDelete}
                                            className="w-full flex justify-center items-center py-2.5 px-4 border border-red-300 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[18px] mr-2">delete</span>
                                            Tapşırığı Sil
                                        </button>
                                    </div>
                                )}
                            </aside>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default TaskDetail;
