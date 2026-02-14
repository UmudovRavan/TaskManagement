import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { TaskResponse } from '../dto';
import { TaskStatus } from '../dto';
import type { WorkGroupResponse } from '../dto/WorkGroupResponse';
import type { UserResponse } from '../dto';

// ── Types ──────────────────────────────────────────────
export type UserRole = 'employee' | 'manager' | 'admin';

export interface WorkloadChartProps {
    tasks: TaskResponse[];
    userRole: UserRole;
    userId: string;
    workGroups: WorkGroupResponse[];
    users: UserResponse[];
}

interface DonutSlice {
    label: string;
    value: number;
    color: string;
    darkColor: string;
    icon: string;
    filterKey: string;
    filterValue: string;
    entityId?: string | number;
    showEvenIfZero?: boolean;
}

type TabKey = 'status' | 'difficulty' | 'time' | 'member' | 'group';

interface TabConfig {
    key: TabKey;
    label: string;
    icon: string;
}

const AUTO_SLIDE_INTERVAL = 17000;
const IDLE_RESTART_DELAY = 30000;

const PALETTE = [
    { color: '#3b82f6', dark: '#60a5fa' },
    { color: '#8b5cf6', dark: '#a78bfa' },
    { color: '#06b6d4', dark: '#22d3ee' },
    { color: '#f59e0b', dark: '#fbbf24' },
    { color: '#10b981', dark: '#34d399' },
    { color: '#ef4444', dark: '#f87171' },
    { color: '#ec4899', dark: '#f472b6' },
    { color: '#14b8a6', dark: '#2dd4bf' },
    { color: '#f97316', dark: '#fb923c' },
    { color: '#6366f1', dark: '#818cf8' },
    { color: '#84cc16', dark: '#a3e635' },
    { color: '#e11d48', dark: '#fb7185' },
];

/** Lighten a hex color by mixing with white */
const lighten = (hex: string, amount: number): string => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, ((num >> 16) & 0xff) + Math.round(amount * 255));
    const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(amount * 255));
    const b = Math.min(255, (num & 0xff) + Math.round(amount * 255));
    return `rgb(${r},${g},${b})`;
};

// ── Component ──────────────────────────────────────────
const WorkloadChart: React.FC<WorkloadChartProps> = ({ tasks, userRole, userId, workGroups, users }) => {
    const navigate = useNavigate();

    const tabConfig: TabConfig[] = useMemo(() => {
        const base: TabConfig[] = [
            { key: 'status', label: 'Status', icon: 'toggle_on' },
            { key: 'difficulty', label: 'Çətinlik', icon: 'speed' },
            { key: 'time', label: 'Vaxt', icon: 'schedule' },
        ];
        if (userRole === 'manager') base.push({ key: 'member', label: 'Üzv üzrə', icon: 'group' });
        if (userRole === 'admin') base.push({ key: 'group', label: 'Qrup üzrə', icon: 'apartment' });
        return base;
    }, [userRole]);

    const [activeTab, setActiveTab] = useState<TabKey>('status');
    const [animationProgress, setAnimationProgress] = useState(0);
    const [isAnimated, setIsAnimated] = useState(false);
    const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);
    const [selectedSlice, setSelectedSlice] = useState<number | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [autoSlideActive, setAutoSlideActive] = useState(true);
    const [slideProgress, setSlideProgress] = useState(0);

    const autoSlideTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const chartContainerRef = useRef<HTMLDivElement>(null);

    // ── Dark mode ──
    const [isDark, setIsDark] = useState(false);
    useEffect(() => {
        const check = () => setIsDark(document.documentElement.classList.contains('dark'));
        check();
        const obs = new MutationObserver(check);
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => obs.disconnect();
    }, []);

    // ── Scope tasks based on role ──
    const scopedTasks = useMemo(() => {
        if (userRole === 'admin') return tasks;
        if (userRole === 'manager') {
            const myGroup = workGroups.find(g => g.leaderId === userId);
            if (!myGroup) return [];
            const memberIds = new Set([...(myGroup.userIds || []), myGroup.leaderId]);
            return tasks.filter(t =>
                (t.assignedToUserId && memberIds.has(t.assignedToUserId)) ||
                (t.createdByUserId && memberIds.has(t.createdByUserId))
            );
        }
        return tasks.filter(t => t.assignedToUserId === userId || t.createdByUserId === userId);
    }, [tasks, userRole, userId, workGroups]);

    const getUserName = useCallback((uid?: string) => {
        if (!uid) return 'Təyin olunmayıb';
        const u = users.find(u => u.id === uid);
        return u ? u.userName : uid.substring(0, 8);
    }, [users]);

    const getGroupNameForTask = useCallback((task: TaskResponse) => {
        if (!task.assignedToUserId) return '—';
        const group = workGroups.find(g =>
            (g.userIds && g.userIds.includes(task.assignedToUserId!)) || g.leaderId === task.assignedToUserId
        );
        return group ? group.name : '—';
    }, [workGroups]);

    const myWorkGroup = useMemo(() => {
        if (userRole !== 'manager') return null;
        return workGroups.find(g => g.leaderId === userId) || null;
    }, [userRole, userId, workGroups]);

    const centerLabel = useMemo(() => {
        if (userRole === 'employee') return 'tapşırığım';
        if (userRole === 'manager') return 'qrup tapşırığı';
        return 'ümumi tapşırıq';
    }, [userRole]);

    // ══════════════════════════════════════════════════════
    //  SLICES COMPUTATION
    // ══════════════════════════════════════════════════════

    const getStatusSlices = useCallback((): DonutSlice[] => {
        const map: DonutSlice[] = [
            { label: 'Gözləyir', value: 0, color: '#f59e0b', darkColor: '#fbbf24', icon: 'hourglass_empty', filterKey: 'status', filterValue: '0' },
            { label: 'Təyin olunub', value: 0, color: '#3b82f6', darkColor: '#60a5fa', icon: 'person_add', filterKey: 'status', filterValue: '1' },
            { label: 'Davam edir', value: 0, color: '#f97316', darkColor: '#fb923c', icon: 'play_circle', filterKey: 'status', filterValue: '2' },
            { label: 'Yoxlamada', value: 0, color: '#8b5cf6', darkColor: '#a78bfa', icon: 'rate_review', filterKey: 'status', filterValue: '3' },
            { label: 'Tamamlanıb', value: 0, color: '#10b981', darkColor: '#34d399', icon: 'check_circle', filterKey: 'status', filterValue: '4' },
            { label: 'Vaxtı keçib', value: 0, color: '#ef4444', darkColor: '#f87171', icon: 'event_busy', filterKey: 'status', filterValue: '5' },
        ];
        scopedTasks.forEach(t => { if (t.status >= 0 && t.status <= 5) map[t.status].value++; });
        return map.filter(s => s.value > 0);
    }, [scopedTasks]);

    const getDifficultySlices = useCallback((): DonutSlice[] => {
        const map: DonutSlice[] = [
            { label: 'Asan', value: 0, color: '#10b981', darkColor: '#34d399', icon: 'sentiment_satisfied', filterKey: 'difficulty', filterValue: '0' },
            { label: 'Orta', value: 0, color: '#f59e0b', darkColor: '#fbbf24', icon: 'sentiment_neutral', filterKey: 'difficulty', filterValue: '1' },
            { label: 'Çətin', value: 0, color: '#ef4444', darkColor: '#f87171', icon: 'local_fire_department', filterKey: 'difficulty', filterValue: '2' },
        ];
        scopedTasks.forEach(t => { if (t.difficulty >= 0 && t.difficulty <= 2) map[t.difficulty].value++; });
        return map.filter(s => s.value > 0);
    }, [scopedTasks]);

    const getTimeSlices = useCallback((): DonutSlice[] => {
        const now = new Date();
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        const weekEnd = new Date(todayEnd); weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()));
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const map: DonutSlice[] = [
            { label: 'Bu gün bitməli', value: 0, color: '#ef4444', darkColor: '#f87171', icon: 'alarm', filterKey: 'time', filterValue: 'today' },
            { label: 'Bu həftə bitməli', value: 0, color: '#f97316', darkColor: '#fb923c', icon: 'date_range', filterKey: 'time', filterValue: 'week' },
            { label: 'Bu ay bitməli', value: 0, color: '#3b82f6', darkColor: '#60a5fa', icon: 'calendar_month', filterKey: 'time', filterValue: 'month' },
            { label: 'Gələcəkdə', value: 0, color: '#10b981', darkColor: '#34d399', icon: 'event', filterKey: 'time', filterValue: 'future' },
        ];
        scopedTasks.forEach(t => {
            if (t.status === TaskStatus.Completed || t.status === TaskStatus.Expired) return;
            const dl = new Date(t.deadline);
            if (dl <= todayEnd) map[0].value++;
            else if (dl <= weekEnd) map[1].value++;
            else if (dl <= monthEnd) map[2].value++;
            else map[3].value++;
        });
        return map.filter(s => s.value > 0);
    }, [scopedTasks]);

    const getMemberSlices = useCallback((): DonutSlice[] => {
        if (!myWorkGroup) return [];
        const memberIds = [...(myWorkGroup.userIds || [])];
        if (!memberIds.includes(myWorkGroup.leaderId)) memberIds.push(myWorkGroup.leaderId);
        return memberIds.map((uid, i) => {
            const activeTasks = scopedTasks.filter(t => t.assignedToUserId === uid && t.status !== TaskStatus.Completed && t.status !== TaskStatus.Expired).length;
            const pal = PALETTE[i % PALETTE.length];
            return { label: getUserName(uid), value: activeTasks, color: pal.color, darkColor: pal.dark, icon: 'person', filterKey: 'member', filterValue: uid, entityId: uid, showEvenIfZero: true };
        });
    }, [myWorkGroup, scopedTasks, getUserName]);

    const getGroupSlices = useCallback((): DonutSlice[] => {
        return workGroups.map((g, i) => {
            const groupMemberIds = new Set([...(g.userIds || []), g.leaderId]);
            const activeTasks = tasks.filter(t => t.assignedToUserId && groupMemberIds.has(t.assignedToUserId) && t.status !== TaskStatus.Completed && t.status !== TaskStatus.Expired).length;
            const pal = PALETTE[i % PALETTE.length];
            return { label: g.name, value: activeTasks, color: pal.color, darkColor: pal.dark, icon: 'apartment', filterKey: 'group', filterValue: String(g.id), entityId: g.id, showEvenIfZero: true };
        });
    }, [workGroups, tasks]);

    const rawSlices = useMemo(() => {
        switch (activeTab) {
            case 'status': return getStatusSlices();
            case 'difficulty': return getDifficultySlices();
            case 'time': return getTimeSlices();
            case 'member': return getMemberSlices();
            case 'group': return getGroupSlices();
        }
    }, [activeTab, getStatusSlices, getDifficultySlices, getTimeSlices, getMemberSlices, getGroupSlices]);

    const slices = useMemo(() => {
        if (activeTab === 'member' || activeTab === 'group') return rawSlices;
        return rawSlices.filter(s => s.value > 0);
    }, [rawSlices, activeTab]);

    const totalValue = useMemo(() => slices.reduce((s, sl) => s + sl.value, 0), [slices]);

    // ══════════════════════════════════════════════════════
    //  ANIMATIONS & AUTO-SLIDE
    // ══════════════════════════════════════════════════════

    useEffect(() => {
        setAnimationProgress(0);
        setIsAnimated(false);
        const startTime = performance.now();
        const duration = 900;
        const animate = (current: number) => {
            const elapsed = current - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setAnimationProgress(eased);
            if (progress < 1) animationFrameRef.current = requestAnimationFrame(animate);
            else setIsAnimated(true);
        };
        animationFrameRef.current = requestAnimationFrame(animate);
        return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
    }, [activeTab]);

    useEffect(() => { setSelectedSlice(null); setShowModal(false); }, [activeTab]);

    const startAutoSlide = useCallback(() => {
        if (autoSlideTimerRef.current) clearInterval(autoSlideTimerRef.current);
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        setSlideProgress(0);
        const step = 100 / (AUTO_SLIDE_INTERVAL / 50);
        progressTimerRef.current = setInterval(() => setSlideProgress(p => Math.min(p + step, 100)), 50);
        autoSlideTimerRef.current = setInterval(() => {
            setActiveTab(prev => {
                const idx = tabConfig.findIndex(t => t.key === prev);
                return tabConfig[(idx + 1) % tabConfig.length].key;
            });
            setSlideProgress(0);
        }, AUTO_SLIDE_INTERVAL);
    }, [tabConfig]);

    const stopAutoSlide = useCallback(() => {
        if (autoSlideTimerRef.current) { clearInterval(autoSlideTimerRef.current); autoSlideTimerRef.current = null; }
        if (progressTimerRef.current) { clearInterval(progressTimerRef.current); progressTimerRef.current = null; }
        setSlideProgress(0);
    }, []);

    const startIdleTimer = useCallback(() => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        idleTimerRef.current = setTimeout(() => setAutoSlideActive(true), IDLE_RESTART_DELAY);
    }, []);

    useEffect(() => {
        if (autoSlideActive) startAutoSlide();
        else { stopAutoSlide(); startIdleTimer(); }
        return () => { stopAutoSlide(); if (idleTimerRef.current) clearTimeout(idleTimerRef.current); };
    }, [autoSlideActive, startAutoSlide, stopAutoSlide, startIdleTimer]);

    const handleTabClick = (key: TabKey) => { setActiveTab(key); setAutoSlideActive(false); setSlideProgress(0); };

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (chartContainerRef.current && !chartContainerRef.current.contains(e.target as Node)) {
                setSelectedSlice(null); setShowModal(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ══════════════════════════════════════════════════════
    //  SVG DONUT — PREMIUM
    // ══════════════════════════════════════════════════════
    const svgSize = 280;
    const cx = svgSize / 2, cy = svgSize / 2;
    const outerR = 110, innerR = 72, gap = 0.025;

    const computeArcs = () => {
        if (slices.length === 0) return [];
        const displayTotal = slices.reduce((sum, sl) => sum + Math.max(sl.value, 0.3), 0);
        const arcs: { slice: DonutSlice; index: number; startAngle: number; endAngle: number; percentage: number }[] = [];
        let current = -Math.PI / 2;
        slices.forEach((sl, i) => {
            const displayValue = Math.max(sl.value, sl.showEvenIfZero ? 0.3 : 0);
            const fraction = displayTotal > 0 ? displayValue / displayTotal : 0;
            const angle = fraction * 2 * Math.PI * animationProgress;
            const start = current + gap / 2;
            const end = current + angle - gap / 2;
            const realPercentage = totalValue > 0 ? (sl.value / totalValue) * 100 : 0;
            arcs.push({ slice: sl, index: i, startAngle: start, endAngle: end, percentage: realPercentage });
            current += angle;
        });
        return arcs;
    };

    const describeArc = (sa: number, ea: number, oR: number, iR: number) => {
        if (ea - sa <= 0) return '';
        const la = ea - sa > Math.PI ? 1 : 0;
        const ox1 = cx + oR * Math.cos(sa), oy1 = cy + oR * Math.sin(sa);
        const ox2 = cx + oR * Math.cos(ea), oy2 = cy + oR * Math.sin(ea);
        const ix1 = cx + iR * Math.cos(ea), iy1 = cy + iR * Math.sin(ea);
        const ix2 = cx + iR * Math.cos(sa), iy2 = cy + iR * Math.sin(sa);
        return `M ${ox1} ${oy1} A ${oR} ${oR} 0 ${la} 1 ${ox2} ${oy2} L ${ix1} ${iy1} A ${iR} ${iR} 0 ${la} 0 ${ix2} ${iy2} Z`;
    };

    const arcs = computeArcs();

    // ══════════════════════════════════════════════════════
    //  MINI MODAL — TASK LIST
    // ══════════════════════════════════════════════════════
    const selectedTasks = useMemo(() => {
        if (selectedSlice === null || !slices[selectedSlice]) return [];
        const sl = slices[selectedSlice];
        let filtered: TaskResponse[] = [];
        if (sl.filterKey === 'status') filtered = scopedTasks.filter(t => t.status === Number(sl.filterValue));
        else if (sl.filterKey === 'difficulty') filtered = scopedTasks.filter(t => t.difficulty === Number(sl.filterValue));
        else if (sl.filterKey === 'time') {
            const now = new Date();
            const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            const weekEnd = new Date(todayEnd); weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()));
            const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
            filtered = scopedTasks.filter(t => {
                if (t.status === TaskStatus.Completed || t.status === TaskStatus.Expired) return false;
                const dl = new Date(t.deadline);
                switch (sl.filterValue) { case 'today': return dl <= todayEnd; case 'week': return dl > todayEnd && dl <= weekEnd; case 'month': return dl > weekEnd && dl <= monthEnd; case 'future': return dl > monthEnd; default: return false; }
            });
        } else if (sl.filterKey === 'member') filtered = scopedTasks.filter(t => t.assignedToUserId === sl.filterValue && t.status !== TaskStatus.Completed && t.status !== TaskStatus.Expired);
        else if (sl.filterKey === 'group') {
            const group = workGroups.find(g => g.id === Number(sl.filterValue));
            if (group) { const members = new Set([...(group.userIds || []), group.leaderId]); filtered = tasks.filter(t => t.assignedToUserId && members.has(t.assignedToUserId) && t.status !== TaskStatus.Completed && t.status !== TaskStatus.Expired); }
        }
        return filtered.slice(0, 5);
    }, [selectedSlice, slices, scopedTasks, tasks, workGroups]);

    const formatRemaining = (deadline: string) => {
        const diff = new Date(deadline).getTime() - Date.now();
        if (diff < 0) return 'Gecikib';
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        if (days > 0) return `${days} gün`;
        if (hours > 0) return `${hours} saat`;
        return 'Bu gün';
    };

    const getStatusIcon = (s: number) => ['hourglass_empty', 'person_add', 'play_circle', 'rate_review', 'check_circle', 'event_busy'][s] || 'task';
    const getStatusColor = (s: number) => ['text-amber-500', 'text-blue-500', 'text-orange-500', 'text-violet-500', 'text-emerald-500', 'text-red-500'][s] || 'text-gray-500';

    const handleSliceClick = (index: number) => {
        if (selectedSlice === index) { setSelectedSlice(null); setShowModal(false); }
        else { setSelectedSlice(index); setShowModal(true); }
        setAutoSlideActive(false);
    };

    const handleViewAll = () => {
        if (selectedSlice === null || !slices[selectedSlice]) return;
        const sl = slices[selectedSlice];
        if (sl.filterKey === 'member' && sl.entityId) navigate(`/employee/${sl.entityId}`);
        else if (sl.filterKey === 'group' && sl.entityId) navigate(`/work-groups/${sl.entityId}`);
        else navigate(`/tasks?${sl.filterKey}=${sl.filterValue}`);
    };

    // ══════════════════════════════════════════════════════
    //  RENDER
    // ══════════════════════════════════════════════════════
    return (
        <div ref={chartContainerRef} className="lg:col-span-2 rounded-2xl border border-[#e5e7eb]/60 dark:border-gray-700/60 bg-white dark:bg-[#1a202c] p-5 sm:p-6 shadow-lg shadow-black/[0.03] dark:shadow-black/20 flex flex-col relative overflow-hidden">
            {/* Subtle background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-purple-500/[0.02] dark:from-primary/[0.04] dark:to-purple-500/[0.04] pointer-events-none" />

            {/* ── Header ── */}
            <div className="flex items-center justify-between mb-5 relative z-10">
                <h3 className="text-lg font-bold text-[#111318] dark:text-white flex items-center gap-2.5">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10">
                        <span className="material-symbols-outlined text-primary text-[20px]">donut_large</span>
                    </div>
                    İş Yükü Paylanması
                </h3>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold tracking-wide ${userRole === 'admin' ? 'bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 dark:from-purple-900/40 dark:to-purple-900/20 dark:text-purple-300 border border-purple-200/50 dark:border-purple-700/30' :
                    userRole === 'manager' ? 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 dark:from-blue-900/40 dark:to-blue-900/20 dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/30' :
                        'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-600 dark:from-gray-800 dark:to-gray-800/60 dark:text-gray-400 border border-gray-200/50 dark:border-gray-700/30'
                    }`}>
                    {userRole === 'admin' ? '🛡️ Admin' : userRole === 'manager' ? '👔 Manager' : '👤 Employee'}
                </span>
            </div>

            {/* ── Content: Donut + Modal ── */}
            <div className="flex flex-col lg:flex-row flex-1 gap-4 min-h-[300px] relative z-10">

                {/* ── Left: Donut ── */}
                <div className={`flex flex-col items-center justify-center transition-all duration-500 ${showModal ? 'lg:flex-[0_0_55%]' : 'flex-1'}`}>
                    {slices.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-8">
                            <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600">pie_chart</span>
                            <p className="text-sm text-[#636f88] dark:text-gray-400">Tapşırıq yoxdur</p>
                        </div>
                    ) : (
                        <div className="relative">
                            <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} className="overflow-visible">
                                {/* ── SVG Defs: gradients, filters, glow ── */}
                                <defs>
                                    {/* Per-slice gradients */}
                                    {slices.map((sl, i) => {
                                        const baseColor = isDark ? sl.darkColor : sl.color;
                                        const lightColor = lighten(baseColor, 0.15);
                                        return (
                                            <linearGradient key={`grad-${activeTab}-${i}`} id={`slice-grad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor={lightColor} />
                                                <stop offset="100%" stopColor={baseColor} />
                                            </linearGradient>
                                        );
                                    })}

                                    {/* Soft outer glow */}
                                    <filter id="donut-glow" x="-20%" y="-20%" width="140%" height="140%">
                                        <feGaussianBlur stdDeviation="6" result="blur" />
                                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                    </filter>

                                    {/* Hover shadow */}
                                    <filter id="slice-hover-shadow" x="-30%" y="-30%" width="160%" height="160%">
                                        <feDropShadow dx="0" dy="3" stdDeviation="6" floodOpacity="0.25" />
                                    </filter>

                                    {/* Inner circle glass effect */}
                                    <radialGradient id="center-glass" cx="40%" cy="35%" r="60%">
                                        <stop offset="0%" stopColor={isDark ? '#2d374850' : '#ffffff'} />
                                        <stop offset="100%" stopColor={isDark ? '#1a202c' : '#f8fafc'} />
                                    </radialGradient>

                                    {/* Subtle ring pattern */}
                                    <radialGradient id="ring-bg" cx="50%" cy="50%" r="50%">
                                        <stop offset="70%" stopColor={isDark ? '#1e293b' : '#f1f5f9'} />
                                        <stop offset="100%" stopColor={isDark ? '#0f172a' : '#e2e8f0'} />
                                    </radialGradient>
                                </defs>

                                {/* ── Decorative outer ring ── */}
                                <circle cx={cx} cy={cy} r={outerR + 6} fill="none"
                                    stroke={isDark ? '#334155' : '#e2e8f0'} strokeWidth="1"
                                    strokeDasharray="4 4" opacity="0.5" />

                                {/* ── Background track ── */}
                                <circle cx={cx} cy={cy} r={(outerR + innerR) / 2} fill="none"
                                    stroke="url(#ring-bg)" strokeWidth={outerR - innerR} />

                                {/* ── Donut slices with gradient fills ── */}
                                {arcs.map((arc, i) => {
                                    const isHov = hoveredSlice === i;
                                    const isSel = selectedSlice === i;
                                    const scale = isHov ? 1.07 : isSel ? 1.04 : 1;
                                    const isZero = arc.slice.value === 0 && arc.slice.showEvenIfZero;

                                    return (
                                        <motion.path
                                            key={`${activeTab}-${i}`}
                                            d={describeArc(arc.startAngle, arc.endAngle, outerR, innerR)}
                                            fill={`url(#slice-grad-${i})`}
                                            initial={false}
                                            animate={{
                                                scale,
                                                opacity: isZero ? 0.3 : (selectedSlice !== null && !isSel && !isHov ? 0.3 : 1),
                                            }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 25, mass: 0.8 }}
                                            style={{
                                                transformOrigin: `${cx}px ${cy}px`,
                                                cursor: 'pointer',
                                                filter: isHov ? 'url(#slice-hover-shadow)' : 'none',
                                            }}
                                            onMouseEnter={() => setHoveredSlice(i)}
                                            onMouseLeave={() => setHoveredSlice(null)}
                                            onClick={() => handleSliceClick(i)}
                                        />
                                    );
                                })}

                                {/* ── Glossy inner circle ── */}
                                <circle cx={cx} cy={cy} r={innerR - 2} fill="url(#center-glass)"
                                    stroke={isDark ? '#334155' : '#e2e8f0'} strokeWidth="0.5" />

                                {/* Shine highlight on inner circle */}
                                <ellipse cx={cx - 8} cy={cy - 12} rx="28" ry="18"
                                    fill={isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.7)'}
                                    style={{ pointerEvents: 'none' }} />

                                {/* ── Center text ── */}
                                <text x={cx} y={cy - 10} textAnchor="middle"
                                    className="fill-[#111318] dark:fill-white"
                                    style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                                    {isAnimated ? totalValue : Math.round(totalValue * animationProgress)}
                                </text>
                                <text x={cx} y={cy + 14} textAnchor="middle"
                                    className="fill-[#636f88] dark:fill-gray-400"
                                    style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' as const }}>
                                    {centerLabel}
                                </text>
                            </svg>

                            {/* ── Hover Tooltip ── */}
                            <AnimatePresence>
                                {hoveredSlice !== null && slices[hoveredSlice] && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 6, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 6, scale: 0.95 }}
                                        transition={{ duration: 0.18, ease: 'easeOut' }}
                                        className="absolute pointer-events-none z-50 backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-2xl border border-gray-200/60 dark:border-gray-600/40 px-4 py-3"
                                        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -160%)', minWidth: '180px' }}>
                                        <div className="flex items-center gap-2.5 mb-1.5">
                                            <div className="w-3.5 h-3.5 rounded-md shadow-sm" style={{
                                                background: `linear-gradient(135deg, ${lighten(isDark ? slices[hoveredSlice].darkColor : slices[hoveredSlice].color, 0.15)}, ${isDark ? slices[hoveredSlice].darkColor : slices[hoveredSlice].color})`
                                            }} />
                                            <span className="text-sm font-bold text-[#111318] dark:text-white">{slices[hoveredSlice].label}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                            <span className="text-xs text-[#636f88] dark:text-gray-400">{slices[hoveredSlice].value} tapşırıq</span>
                                            <span className="text-sm font-extrabold" style={{ color: isDark ? slices[hoveredSlice].darkColor : slices[hoveredSlice].color }}>
                                                {totalValue > 0 ? Math.round((slices[hoveredSlice].value / totalValue) * 100) : 0}%
                                            </span>
                                        </div>
                                        <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 rotate-45 bg-white/90 dark:bg-gray-800/90 border-r border-b border-gray-200/60 dark:border-gray-600/40" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* ── Legend ── */}
                    {slices.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-x-2 gap-y-1.5 mt-4 px-2 max-h-[80px] overflow-y-auto">
                            {slices.map((sl, i) => {
                                const clr = isDark ? sl.darkColor : sl.color;
                                return (
                                    <button key={i}
                                        className={`flex items-center gap-1.5 text-[11px] transition-all duration-200 rounded-lg px-2 py-1 ${selectedSlice === i
                                            ? 'font-bold ring-1 shadow-sm'
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 font-medium'
                                            } ${selectedSlice !== null && selectedSlice !== i ? 'opacity-35' : 'opacity-100'}`}
                                        style={selectedSlice === i ? { backgroundColor: `${clr}10`, '--tw-ring-color': `${clr}40` } as React.CSSProperties : {}}
                                        onClick={() => handleSliceClick(i)}
                                        onMouseEnter={() => setHoveredSlice(i)}
                                        onMouseLeave={() => setHoveredSlice(null)}
                                    >
                                        <div className="w-2.5 h-2.5 rounded-sm shrink-0 shadow-sm" style={{ background: `linear-gradient(135deg, ${lighten(clr, 0.12)}, ${clr})` }} />
                                        <span className="text-[#636f88] dark:text-gray-400 truncate max-w-[80px]">{sl.label}</span>
                                        <span className="text-[#111318] dark:text-white font-bold">{sl.value}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── Right / Bottom: Mini Modal ── */}
                <AnimatePresence>
                    {showModal && selectedSlice !== null && slices[selectedSlice] && (
                        <motion.div
                            initial={{ opacity: 0, x: 30, width: 0 }}
                            animate={{ opacity: 1, x: 0, width: 'auto', flex: '0 0 45%' }}
                            exit={{ opacity: 0, x: 30, width: 0, flex: '0 0 0%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                            className="overflow-hidden"
                        >
                            <div className="h-full flex flex-col rounded-xl border border-gray-100/80 dark:border-gray-700/60 bg-gradient-to-b from-gray-50/90 to-white dark:from-gray-800/60 dark:to-[#1a202c] p-4 shadow-inner backdrop-blur-sm">
                                {/* Modal Header */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-3.5 h-3.5 rounded-md shrink-0 shadow-sm" style={{
                                            background: `linear-gradient(135deg, ${lighten(isDark ? slices[selectedSlice].darkColor : slices[selectedSlice].color, 0.15)}, ${isDark ? slices[selectedSlice].darkColor : slices[selectedSlice].color})`
                                        }} />
                                        <h4 className="text-sm font-bold text-[#111318] dark:text-white truncate">
                                            {slices[selectedSlice].label}
                                            <span className="ml-1.5 text-[#636f88] dark:text-gray-400 font-medium">({slices[selectedSlice].value})</span>
                                        </h4>
                                    </div>
                                    <button onClick={() => { setSelectedSlice(null); setShowModal(false); }}
                                        className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shrink-0">
                                        <span className="material-symbols-outlined text-[16px] text-[#636f88]">close</span>
                                    </button>
                                </div>

                                {/* Task List */}
                                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                                    {selectedTasks.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full gap-2 py-6">
                                            <span className="text-3xl">🎉</span>
                                            <p className="text-sm text-[#636f88] dark:text-gray-400 text-center">Tapşırıq yoxdur</p>
                                        </div>
                                    ) : (
                                        selectedTasks.map((task, idx) => (
                                            <motion.button
                                                key={task.id}
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.06, duration: 0.25 }}
                                                onClick={() => navigate(`/tasks/${task.id}`)}
                                                className="w-full flex items-start gap-2.5 p-2.5 rounded-lg bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50 hover:border-primary/30 dark:hover:border-primary/30 hover:shadow-md transition-all duration-200 text-left group"
                                            >
                                                <span className={`material-symbols-outlined text-[16px] mt-0.5 ${getStatusColor(task.status)} shrink-0`}>
                                                    {getStatusIcon(task.status)}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-[#111318] dark:text-white truncate group-hover:text-primary transition-colors">
                                                        {task.title}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                        <span className="text-[10px] text-[#636f88] dark:text-gray-500 flex items-center gap-0.5">
                                                            <span className="material-symbols-outlined text-[10px]">schedule</span>
                                                            {formatRemaining(task.deadline)}
                                                        </span>
                                                        {(userRole === 'manager' || userRole === 'admin') && task.assignedToUserId && (
                                                            <span className="text-[10px] text-blue-500 dark:text-blue-400 flex items-center gap-0.5">
                                                                <span className="material-symbols-outlined text-[10px]">person</span>
                                                                {getUserName(task.assignedToUserId)}
                                                            </span>
                                                        )}
                                                        {userRole === 'admin' && (
                                                            <span className="text-[10px] text-purple-500 dark:text-purple-400 flex items-center gap-0.5">
                                                                <span className="material-symbols-outlined text-[10px]">apartment</span>
                                                                {getGroupNameForTask(task)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="material-symbols-outlined text-[14px] text-gray-300 dark:text-gray-600 group-hover:text-primary transition-colors shrink-0 mt-0.5">
                                                    chevron_right
                                                </span>
                                            </motion.button>
                                        ))
                                    )}
                                </div>

                                {slices[selectedSlice].value > 0 && (
                                    <button onClick={handleViewAll}
                                        className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors border border-transparent hover:border-primary/20">
                                        Hamısına bax
                                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Tabs ── */}
            <div className="mt-5 relative z-10">
                <div className="flex items-center rounded-xl bg-[#f0f2f4]/80 dark:bg-gray-800/80 p-1 gap-0.5 backdrop-blur-sm">
                    {tabConfig.map((tab) => (
                        <button key={tab.key} onClick={() => handleTabClick(tab.key)}
                            className={`relative flex-1 flex items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-[11px] font-medium transition-all duration-300 ${activeTab === tab.key
                                ? 'bg-white dark:bg-gray-700 text-primary shadow-md'
                                : 'text-[#636f88] dark:text-gray-400 hover:text-[#111318] dark:hover:text-white hover:bg-white/40 dark:hover:bg-gray-700/40'
                                }`}>
                            <span className="material-symbols-outlined text-[15px]">{tab.icon}</span>
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WorkloadChart;
