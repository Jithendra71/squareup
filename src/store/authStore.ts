import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  verificationId: string | null; // For OTP verification

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setVerificationId: (id: string | null) => void;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      verificationId: null,

      setUser: (user) => set({
        user,
        isAuthenticated: !!user,
        isLoading: false,
        error: null,
      }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({
        error,
        isLoading: false,
      }),

      setVerificationId: (id) => set({ verificationId: id }),

      logout: () => set({
        user: null,
        isAuthenticated: false,
        error: null,
        verificationId: null,
      }),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user }),
    }
  )
);
