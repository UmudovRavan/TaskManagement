export interface UserInfo {
    userId: string;
    userName: string;
    email: string;
    roles: string[];
}

export const parseJwtToken = (token: string): UserInfo | null => {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const payload = JSON.parse(atob(parts[1]));

        const userId =
            payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
            payload.sub ||
            payload.nameid ||
            '';

        const userName =
            payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
            payload.unique_name ||
            payload.name ||
            '';

        const email =
            payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
            payload.email ||
            '';

        const rolesClaim =
            payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
            payload.role ||
            [];

        const roles = Array.isArray(rolesClaim) ? rolesClaim : [rolesClaim].filter(Boolean);

        return {
            userId,
            userName,
            email,
            roles,
        };
    } catch {
        return null;
    }
};

export const isTokenExpired = (token: string): boolean => {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return true;

        const payload = JSON.parse(atob(parts[1]));
        const exp = payload.exp;

        if (!exp) return true;

        return Date.now() >= exp * 1000;
    } catch {
        return true;
    }
};
