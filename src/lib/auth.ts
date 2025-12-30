import type { User } from '@/types';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export const auth = {
    setToken(token: string) {
        localStorage.setItem(TOKEN_KEY, token);
    },
    getToken() {
        return localStorage.getItem(TOKEN_KEY);
    },
    setUser(user: User) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    },
    getUser(): User | null {
        const u = localStorage.getItem(USER_KEY);
        return u ? JSON.parse(u) : null;
    },
    logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        window.location.href = '/login';
    },
    isAuthenticated() {
        return !!localStorage.getItem(TOKEN_KEY);
    }
};
