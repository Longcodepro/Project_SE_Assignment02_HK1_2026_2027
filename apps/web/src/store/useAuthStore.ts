import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
    token: string | null;
    user: User | null;
    isAuthModalOpen: boolean;
    authModalTab: 'login' | 'register';
    setAuth: (token: string, user?: User) => void;
    logout: () => void;
    openAuthModal: (tab?: 'login' | 'register') => void;
    closeAuthModal: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            user: null,
            isAuthModalOpen: false,
            authModalTab: 'login',

            setAuth: (token: string, user?: User) => {
                if (typeof window !== 'undefined') {
                    localStorage.setItem('brewlite_token', token);
                }

                let parsedUser = user;
                if (!parsedUser && token) {
                    try {
                        const payloadPart = token.split('.')[1];
                        if (payloadPart) {
                            const decoded = JSON.parse(atob(payloadPart));
                            parsedUser = {
                                id: decoded.sub,
                                email: decoded.email,
                                name: decoded.name || decoded.email?.split('@')[0],
                            };
                        }
                    } catch {
                        // Bỏ qua nếu token không giải mã được
                    }
                }

                set({
                    token,
                    user: parsedUser || null,
                    isAuthModalOpen: false,
                });
            },

            logout: () => {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('brewlite_token');
                }
                set({ token: null, user: null });
            },

            openAuthModal: (tab = 'login') => {
                set({ isAuthModalOpen: true, authModalTab: tab });
            },

            closeAuthModal: () => {
                set({ isAuthModalOpen: false });
            },
        }),
        {
            name: 'brewlite_auth',
            partialize: (state) => ({ token: state.token, user: state.user }),
        }
    )
);
