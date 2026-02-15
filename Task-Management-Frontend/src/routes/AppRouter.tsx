import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
    Login,
    Register,
    ForgotPassword,
    OtpVerification,
    ResetPassword,
    ResetSuccess,
    DashboardOverview,
    MyTasks,
    TaskDetail,
    TaskEdit,
    TaskAssignmentDetail,
    Notifications,
    Performance,
    Leaderboard,
    WorkGroups,
    WorkGroupRanking,
    EmployeePerformance,
} from '../pages';

const AppRouter: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/otp-verification" element={<OtpVerification />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/reset-success" element={<ResetSuccess />} />
            <Route path="/dashboard" element={<DashboardOverview />} />
            <Route path="/tasks" element={<MyTasks />} />
            <Route path="/tasks/assignment/:id" element={<TaskAssignmentDetail />} />
            <Route path="/tasks/:id" element={<TaskDetail />} />
            <Route path="/tasks/edit/:id" element={<TaskEdit />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/performance" element={<Performance />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/work-groups" element={<WorkGroups />} />
            <Route path="/work-groups/:workGroupId" element={<WorkGroupRanking />} />
            <Route path="/employee/:userId" element={<EmployeePerformance />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
};

export default AppRouter;
