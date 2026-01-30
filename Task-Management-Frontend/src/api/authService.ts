import httpClient from './httpClient';
import type {
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    SendOtpResponse,
} from '../dto';

export const authService = {
    async login(data: LoginRequest): Promise<LoginResponse> {
        const response = await httpClient.post<LoginResponse>('/authorize/login', {
            Email: data.email,
            Password: data.password,
        });
        return response.data;
    },

    async register(data: RegisterRequest): Promise<RegisterResponse> {
        const response = await httpClient.post<RegisterResponse>('/authorize/register', {
            Email: data.email,
            Password: data.password,
            PhoneNumber: data.phoneNumber || null,
        });
        return response.data;
    },

    async sendResetOtp(email: string): Promise<SendOtpResponse> {
        const response = await httpClient.post<SendOtpResponse>('/authorize/SendResetOtp', email, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    },

    async resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
        const response = await httpClient.post<ResetPasswordResponse>('/authorize/ResetPassword', {
            Email: data.email,
            Token: data.token,
            NewPassword: data.newPassword,
        });
        return response.data;
    },

    async logout(): Promise<void> {
        await httpClient.post('/authorize/LogOut');
        localStorage.removeItem('authToken');
    },

    setToken(token: string): void {
        localStorage.setItem('authToken', token);
    },

    getToken(): string | null {
        return localStorage.getItem('authToken');
    },

    isAuthenticated(): boolean {
        return !!this.getToken();
    },

    clearToken(): void {
        localStorage.removeItem('authToken');
    },
};

export default authService;
