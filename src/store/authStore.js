import { create } from 'zustand';

export const useAuthStore = create((set, get) => {
  // Load from localStorage on init
  const stored = localStorage.getItem('auth-storage');
  const initialState = stored ? JSON.parse(stored) : { user: null, token: null, isAuthenticated: false };

  return {
    user: initialState.user,
    token: initialState.token,
    isAuthenticated: !!initialState.token,
    
    login: (user, token) => {
      const state = { user, token, isAuthenticated: true };
      localStorage.setItem('auth-storage', JSON.stringify(state));
      set(state);
    },
    
    logout: () => {
      localStorage.removeItem('auth-storage');
      set({ user: null, token: null, isAuthenticated: false });
    },
    
    updateUser: (user) => {
      const current = get();
      const state = { ...current, user };
      localStorage.setItem('auth-storage', JSON.stringify(state));
      set(state);
    },
  };
});
