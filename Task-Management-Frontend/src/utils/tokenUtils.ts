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

/**
 * Get the primary role from a list of roles.
 * Priority: admin > manager > employee > others
 * If multiple roles exist and one is 'employee', prefer the other role.
 */
export const getPrimaryRole = (roles: string[]): string => {
    if (!roles || roles.length === 0) return 'Employee';

    // Define role priority (higher number = higher priority)
    const rolePriority: Record<string, number> = {
        'admin': 100,
        'manager': 50,
        'employee': 10,
    };

    // Sort roles by priority (descending) and return the highest one
    const sortedRoles = [...roles].sort((a, b) => {
        const priorityA = rolePriority[a.toLowerCase()] || 1;
        const priorityB = rolePriority[b.toLowerCase()] || 1;
        return priorityB - priorityA;
    });

    const primaryRole = sortedRoles[0];

    // Capitalize first letter
    return primaryRole.charAt(0).toUpperCase() + primaryRole.slice(1).toLowerCase();
};
