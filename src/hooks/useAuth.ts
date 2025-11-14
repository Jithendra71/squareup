import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/firebase/auth';

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    verificationId,
    setUser,
    setLoading,
    setError,
    setVerificationId,
    logout,
    clearError,
  } = useAuthStore();

  useEffect(() => {
    // Set up auth state listener
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setUser(user);
    });

    return unsubscribe;
  }, [setUser]);

  const sendOTP = async (phoneNumber: string) => {
    try {
      setLoading(true);
      clearError();
      const verificationId = await authService.sendOTP(phoneNumber);
      setVerificationId(verificationId);
      setLoading(false);
      return verificationId;
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
      throw error;
    }
  };

  const verifyOTP = async (code: string) => {
    try {
      if (!verificationId) {
        throw new Error('No verification ID found');
      }

      setLoading(true);
      clearError();

      const userCredential = await authService.verifyOTP(verificationId, code);
      const phoneNumber = userCredential.user.phoneNumber || '';

      // Check if profile exists
      const userData = await authService.checkUserProfile(userCredential.user.uid);

      if (userData) {
        // Profile exists and is complete
        setUser(userData);
        return { needsProfileSetup: false, userId: userCredential.user.uid, phoneNumber };
      } else {
        // New user or incomplete profile
        return { needsProfileSetup: true, userId: userCredential.user.uid, phoneNumber };
      }
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
      throw error;
    }
  };

  const completeProfile = async (userId: string, phoneNumber: string, displayName: string, photoURL?: string) => {
    try {
      setLoading(true);
      clearError();
      const userData = await authService.updateUserProfile(userId, {
        phoneNumber,
        displayName,
        photoURL,
      });
      setUser(userData);
      setLoading(false);
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      clearError();
      await authService.signOut();
      logout();
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    verificationId,
    sendOTP,
    verifyOTP,
    completeProfile,
    signOut,
    clearError,
  };
};
