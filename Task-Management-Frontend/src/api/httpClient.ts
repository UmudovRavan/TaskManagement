import axios from 'axios';
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const BASE_URL = 'https://localhost:7288/api';

/**
 * Enterprise-grade Axios HTTP Client
 * 
 * Features:
 * - Automatic token injection
 * - Timeout handling (15s for regular, 30s for uploads)
 * - Proper error handling
 * - Request/Response logging
 * - SignalR-independent error handling
 */

const httpClient: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000, // 15 seconds default
});

/**
 * Request interceptor - Add auth token
 */
httpClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('authToken');

        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Extend timeout for file uploads
        const contentType = config.headers?.['Content-Type'];
        if (typeof contentType === 'string' && contentType.includes('multipart/form-data')) {
            config.timeout = 30000; // 30 seconds for uploads
        }

        // Log request in development
        if (import.meta.env.DEV) {
            console.log(`[HTTP] → ${config.method?.toUpperCase()} ${config.url}`);
        }

        return config;
    },
    (error: AxiosError) => {
        console.error('[HTTP] Request error:', error);
        return Promise.reject(error);
    }
);

/**
 * Response interceptor - Handle errors
 */
httpClient.interceptors.response.use(
    (response: AxiosResponse) => {
        // Log response in development
        if (import.meta.env.DEV) {
            console.log(`[HTTP] ← ${response.status} ${response.config.url}`);
        }
        return response;
    },
    (error: AxiosError) => {
        // Handle different error types
        if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
            // Timeout or network error - DO NOT affect SignalR
            console.error('[HTTP] Network/Timeout error:', error.message);
        } else if (error.response) {
            // Server responded with error status
            const status = error.response.status;
            const requestUrl = error.config?.url || '';

            // Password reset endpoints should NOT redirect to login on 401
            // These endpoints require [AllowAnonymous] on backend but currently have [Authorize]
            const isPasswordResetFlow = requestUrl.toLowerCase().includes('sendresetotp') ||
                requestUrl.toLowerCase().includes('resetpassword');

            if (status === 401 && !isPasswordResetFlow) {
                // Unauthorized - clear token and redirect (except for password reset flow)
                console.log('[HTTP] 401 Unauthorized - clearing session');
                localStorage.removeItem('authToken');
                window.location.href = '/login';
            } else if (status === 401 && isPasswordResetFlow) {
                // Password reset flow - let the error propagate without redirect
                console.log('[HTTP] 401 on password reset endpoint - not redirecting');
            } else if (status === 403) {
                console.error('[HTTP] 403 Forbidden');
            } else if (status >= 500) {
                console.error('[HTTP] Server error:', status);
            }
        } else if (error.request) {
            // Request was made but no response received
            console.error('[HTTP] No response from server');
        } else {
            // Something else happened
            console.error('[HTTP] Request setup error:', error.message);
        }

        // Always reject to allow component-level error handling
        return Promise.reject(error);
    }
);

export default httpClient;
