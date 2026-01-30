export interface RegisterRequest {
    email: string;
    password: string;
    phoneNumber?: string;
}

export interface RegisterResponse {
    message: string;
}
