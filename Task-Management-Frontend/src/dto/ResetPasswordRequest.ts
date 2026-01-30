export interface SendOtpRequest {
    email: string;
}

export interface SendOtpResponse {
    message: string;
}

export interface ResetPasswordRequest {
    email: string;
    token: string;
    newPassword: string;
}

export interface ResetPasswordResponse {
    message: string;
}
