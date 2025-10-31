# Phase 2: Phone Authentication - Comprehensive Plan

**Duration**: Week 2 (5-7 days)
**Goal**: Implement complete user authentication system with Firebase Phone Authentication and OTP verification

---

## Overview

This phase focuses on building a robust phone number authentication system using Firebase Phone Authentication. Users will be able to sign in using their phone number, verify with an OTP code, and set up their profile on first login.

---

## Prerequisites

**Must be completed from Phase 1:**
- ✅ Firebase Authentication enabled (Phone Authentication)
- ✅ Firebase SDK installed and configured
- ✅ Zustand installed for state management
- ✅ React Hook Form installed
- ✅ Type definitions created

---

## Architecture Overview

### Authentication Flow
```
App Launch → Check Auth State → Authenticated?
  ├─ Yes → Main App (Dashboard)
  └─ No → Phone Input → Enter OTP → First Time? → Profile Setup → Main App
```

### State Management Strategy
- **Zustand Store**: Manages auth state (user, loading, error)
- **Firebase Auth Observer**: Listens for auth state changes
- **Async Storage**: Persists auth token for offline scenarios

---

## Step-by-Step Tasks

### Task 2.1: Update Authentication Store

**Duration**: 1 hour

#### Subtasks:

1. **Create Zustand Auth Store**

   **src/store/authStore.ts**:
   ```typescript
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
   ```

2. **Create User Store for Profile Management**

   **src/store/userStore.ts**:
   ```typescript
   import { create } from 'zustand';
   import { User } from '../types';

   interface UserState {
     users: Map<string, User>;
     addUser: (user: User) => void;
     addUsers: (users: User[]) => void;
     getUser: (userId: string) => User | undefined;
   }

   export const useUserStore = create<UserState>((set, get) => ({
     users: new Map(),

     addUser: (user) => set((state) => {
       const newUsers = new Map(state.users);
       newUsers.set(user.id, user);
       return { users: newUsers };
     }),

     addUsers: (users) => set((state) => {
       const newUsers = new Map(state.users);
       users.forEach(user => newUsers.set(user.id, user));
       return { users: newUsers };
     }),

     getUser: (userId) => get().users.get(userId),
   }));
   ```

#### Acceptance Criteria:
- [ ] Auth store created with Zustand
- [ ] State persisted with AsyncStorage
- [ ] Verification ID state for OTP flow
- [ ] User store created for caching user data
- [ ] Type-safe actions and state

---

### Task 2.2: Create Firebase Phone Auth Service

**Duration**: 2-3 hours

#### Subtasks:

1. **Create Auth Service Functions**

   **src/services/firebase/auth.ts**:
   ```typescript
   import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
   import { firestore } from '../../config/firebase';
   import { User } from '../../types';
   import { handleFirebaseError } from '../../utils/errorHandler';

   export const authService = {
     /**
      * Send OTP to phone number
      */
     async sendOTP(phoneNumber: string): Promise<string> {
       try {
         // Format phone number with country code if not present
         const formattedPhone = phoneNumber.startsWith('+')
           ? phoneNumber
           : `+91${phoneNumber}`; // Default to India, adjust as needed

         const confirmation = await auth().signInWithPhoneNumber(formattedPhone);
         return confirmation.verificationId;
       } catch (error: any) {
         throw new Error(handleFirebaseError(error));
       }
     },

     /**
      * Verify OTP code
      */
     async verifyOTP(verificationId: string, code: string): Promise<FirebaseAuthTypes.UserCredential> {
       try {
         const credential = auth.PhoneAuthProvider.credential(verificationId, code);
         const userCredential = await auth().signInWithCredential(credential);
         return userCredential;
       } catch (error: any) {
         throw new Error(handleFirebaseError(error));
       }
     },

     /**
      * Check if user profile exists and is complete
      */
     async checkUserProfile(userId: string): Promise<User | null> {
       try {
         const userDoc = await firestore().collection('users').doc(userId).get();

         if (!userDoc.exists) {
           return null;
         }

         const userData = userDoc.data()!;

         // Check if profile is complete
         if (!userData.displayName) {
           return null;
         }

         return {
           id: userDoc.id,
           phoneNumber: userData.phoneNumber,
           displayName: userData.displayName,
           photoURL: userData.photoURL,
           createdAt: userData.createdAt?.toDate() || new Date(),
         };
       } catch (error: any) {
         console.error('Error checking user profile:', error);
         return null;
       }
     },

     /**
      * Create or update user profile
      */
     async updateUserProfile(userId: string, data: {
       phoneNumber: string;
       displayName?: string;
       photoURL?: string;
     }): Promise<User> {
       try {
         const userRef = firestore().collection('users').doc(userId);
         const userDoc = await userRef.get();

         if (!userDoc.exists) {
           // Create new user
           await userRef.set({
             phoneNumber: data.phoneNumber,
             displayName: data.displayName || '',
             photoURL: data.photoURL || '',
             createdAt: firestore.FieldValue.serverTimestamp(),
           });
         } else {
           // Update existing user
           await userRef.update({
             displayName: data.displayName,
             photoURL: data.photoURL,
             updatedAt: firestore.FieldValue.serverTimestamp(),
           });
         }

         return {
           id: userId,
           phoneNumber: data.phoneNumber,
           displayName: data.displayName || '',
           photoURL: data.photoURL,
           createdAt: new Date(),
         };
       } catch (error: any) {
         throw new Error(handleFirebaseError(error));
       }
     },

     /**
      * Sign out
      */
     async signOut(): Promise<void> {
       try {
         await auth().signOut();
       } catch (error: any) {
         throw new Error(handleFirebaseError(error));
       }
     },

     /**
      * Get current user data from Firestore
      */
     async getCurrentUserData(): Promise<User | null> {
       try {
         const currentUser = auth().currentUser;
         if (!currentUser) return null;

         const userDoc = await firestore().collection('users').doc(currentUser.uid).get();

         if (!userDoc.exists) return null;

         const userData = userDoc.data()!;
         return {
           id: currentUser.uid,
           phoneNumber: userData.phoneNumber || currentUser.phoneNumber || '',
           displayName: userData.displayName || '',
           photoURL: userData.photoURL,
           createdAt: userData.createdAt?.toDate() || new Date(),
         };
       } catch (error: any) {
         console.error('Error fetching user data:', error);
         return null;
       }
     },

     /**
      * Auth state observer
      */
     onAuthStateChanged(callback: (user: User | null) => void) {
       return auth().onAuthStateChanged(async (firebaseUser) => {
         if (firebaseUser) {
           const userData = await this.getCurrentUserData();
           callback(userData);
         } else {
           callback(null);
         }
       });
     },
   };
   ```

2. **Create Users Service for Fetching User Data**

   **src/services/firebase/users.ts**:
   ```typescript
   import { firestore } from '../../config/firebase';
   import { User } from '../../types';

   export const usersService = {
     /**
      * Get user by ID
      */
     async getUserById(userId: string): Promise<User | null> {
       try {
         const userDoc = await firestore().collection('users').doc(userId).get();

         if (!userDoc.exists) return null;

         const data = userDoc.data()!;
         return {
           id: userDoc.id,
           phoneNumber: data.phoneNumber,
           displayName: data.displayName,
           photoURL: data.photoURL,
           createdAt: data.createdAt?.toDate() || new Date(),
         };
       } catch (error) {
         console.error('Error fetching user:', error);
         return null;
       }
     },

     /**
      * Search users by phone number
      */
     async searchUsersByPhone(phoneNumber: string): Promise<User[]> {
       try {
         // Format phone number
         const formattedPhone = phoneNumber.startsWith('+')
           ? phoneNumber
           : `+91${phoneNumber}`;

         const snapshot = await firestore()
           .collection('users')
           .where('phoneNumber', '==', formattedPhone)
           .limit(10)
           .get();

         return snapshot.docs.map(doc => {
           const data = doc.data();
           return {
             id: doc.id,
             phoneNumber: data.phoneNumber,
             displayName: data.displayName,
             photoURL: data.photoURL,
             createdAt: data.createdAt?.toDate() || new Date(),
           };
         });
       } catch (error) {
         console.error('Error searching users:', error);
         return [];
       }
     },

     /**
      * Get multiple users by IDs
      */
     async getUsersByIds(userIds: string[]): Promise<User[]> {
       try {
         if (userIds.length === 0) return [];

         const chunks = this.chunkArray(userIds, 10);
         const allUsers: User[] = [];

         for (const chunk of chunks) {
           const snapshot = await firestore()
             .collection('users')
             .where(firestore.FieldPath.documentId(), 'in', chunk)
             .get();

           const users = snapshot.docs.map(doc => {
             const data = doc.data();
             return {
               id: doc.id,
               phoneNumber: data.phoneNumber,
               displayName: data.displayName,
               photoURL: data.photoURL,
               createdAt: data.createdAt?.toDate() || new Date(),
             };
           });

           allUsers.push(...users);
         }

         return allUsers;
       } catch (error) {
         console.error('Error fetching users:', error);
         return [];
       }
     },

     chunkArray<T>(array: T[], size: number): T[][] {
       const chunks: T[][] = [];
       for (let i = 0; i < array.length; i += size) {
         chunks.push(array.slice(i, i + size));
       }
       return chunks;
     },
   };
   ```

#### Acceptance Criteria:
- [ ] Phone auth service with OTP send/verify functions
- [ ] User profile creation and update
- [ ] Profile completeness check
- [ ] Sign out functionality
- [ ] Auth state observer implemented
- [ ] Users service for phone-based search
- [ ] Error handling with user-friendly messages
- [ ] All functions are type-safe

---

### Task 2.3: Create Auth Hook

**Duration**: 30 minutes

#### Subtasks:

1. **Create useAuth Hook**

   **src/hooks/useAuth.ts**:
   ```typescript
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
   ```

#### Acceptance Criteria:
- [ ] useAuth hook created
- [ ] Auth state listener set up on mount
- [ ] OTP send and verify operations
- [ ] Profile completion handling
- [ ] All auth operations wrapped with error handling
- [ ] Hook provides easy-to-use API for components

---

### Task 2.4: Create Phone Input Screen

**Duration**: 2 hours

#### Subtasks:

1. **Create Phone Input Screen Component**

   **src/screens/auth/PhoneInputScreen.tsx**:
   ```typescript
   import React, { useState } from 'react';
   import {
     View,
     StyleSheet,
     KeyboardAvoidingView,
     Platform,
     Alert,
   } from 'react-native';
   import { TextInput, Button, Text, HelperText } from 'react-native-paper';
   import { useForm, Controller } from 'react-hook-form';
   import { zodResolver } from '@hookform/resolvers/zod';
   import { z } from 'zod';
   import { useAuth } from '../../hooks/useAuth';
   import { COLORS } from '../../constants';
   import { NativeStackNavigationProp } from '@react-navigation/native-stack';
   import { AuthStackParamList } from '../../navigation/types';

   type PhoneInputScreenProps = {
     navigation: NativeStackNavigationProp<AuthStackParamList, 'PhoneInput'>;
   };

   const phoneSchema = z.object({
     phoneNumber: z
       .string()
       .min(10, 'Phone number must be 10 digits')
       .max(10, 'Phone number must be 10 digits')
       .regex(/^[0-9]+$/, 'Phone number must contain only digits'),
   });

   type PhoneFormData = z.infer<typeof phoneSchema>;

   export const PhoneInputScreen: React.FC<PhoneInputScreenProps> = ({ navigation }) => {
     const { sendOTP, isLoading } = useAuth();

     const {
       control,
       handleSubmit,
       formState: { errors },
     } = useForm<PhoneFormData>({
       resolver: zodResolver(phoneSchema),
       defaultValues: {
         phoneNumber: '',
       },
     });

     const onSubmit = async (data: PhoneFormData) => {
       try {
         await sendOTP(data.phoneNumber);
         navigation.navigate('OtpVerification', { phoneNumber: data.phoneNumber });
       } catch (error: any) {
         Alert.alert('Error', error.message);
       }
     };

     return (
       <KeyboardAvoidingView
         style={styles.container}
         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
       >
         <View style={styles.content}>
           <View style={styles.header}>
             <Text variant="displaySmall" style={styles.title}>
               Welcome to SquareUp
             </Text>
             <Text variant="bodyLarge" style={styles.subtitle}>
               Enter your phone number to continue
             </Text>
           </View>

           <View style={styles.form}>
             <View style={styles.phoneInputContainer}>
               <Text style={styles.countryCode}>+91</Text>
               <Controller
                 control={control}
                 name="phoneNumber"
                 render={({ field: { onChange, onBlur, value } }) => (
                   <>
                     <TextInput
                       label="Phone Number"
                       mode="outlined"
                       value={value}
                       onChangeText={onChange}
                       onBlur={onBlur}
                       keyboardType="phone-pad"
                       maxLength={10}
                       error={!!errors.phoneNumber}
                       style={styles.phoneInput}
                       left={<TextInput.Icon icon="phone" />}
                     />
                   </>
                 )}
               />
             </View>
             {errors.phoneNumber && (
               <HelperText type="error">{errors.phoneNumber.message}</HelperText>
             )}

             <Button
               mode="contained"
               onPress={handleSubmit(onSubmit)}
               loading={isLoading}
               disabled={isLoading}
               style={styles.button}
             >
               Send OTP
             </Button>

             <Text variant="bodySmall" style={styles.disclaimer}>
               By continuing, you agree to our Terms of Service and Privacy Policy
             </Text>
           </View>
         </View>
       </KeyboardAvoidingView>
     );
   };

   const styles = StyleSheet.create({
     container: {
       flex: 1,
       backgroundColor: COLORS.background,
     },
     content: {
       flex: 1,
       justifyContent: 'center',
       padding: 20,
     },
     header: {
       alignItems: 'center',
       marginBottom: 40,
     },
     title: {
       fontWeight: 'bold',
       color: COLORS.primary,
       marginBottom: 8,
     },
     subtitle: {
       color: COLORS.dark,
       opacity: 0.6,
       textAlign: 'center',
     },
     form: {
       gap: 16,
     },
     phoneInputContainer: {
       flexDirection: 'row',
       alignItems: 'center',
       gap: 8,
     },
     countryCode: {
       fontSize: 16,
       fontWeight: 'bold',
       color: COLORS.dark,
       marginTop: 10,
     },
     phoneInput: {
       flex: 1,
     },
     button: {
       marginTop: 8,
       paddingVertical: 6,
     },
     disclaimer: {
       textAlign: 'center',
       color: COLORS.dark,
       opacity: 0.5,
       marginTop: 16,
     },
   });
   ```

#### Acceptance Criteria:
- [ ] Phone input screen with country code
- [ ] Form validation with Zod schema
- [ ] 10-digit phone number validation
- [ ] Send OTP button with loading state
- [ ] Navigation to OTP verification screen
- [ ] Error handling with alerts
- [ ] Responsive design with keyboard avoidance

---

*[Continuing in next message due to length...]*

---

## Success Criteria

Phase 2 is complete when:

1. ✅ Users can enter phone number and receive OTP
2. ✅ Users can verify OTP code
3. ✅ First-time users can set up their profile
4. ✅ Auth state persists across app restarts
5. ✅ Navigation switches between auth and main screens
6. ✅ User data saved to Firestore
7. ✅ All forms have proper validation
8. ✅ Loading states shown during auth operations
9. ✅ Errors handled with user-friendly messages
10. ✅ Auth state managed with Zustand
11. ✅ Type-safe navigation
12. ✅ Clean UI with React Native Paper

---

## Estimated Time: 12-14 hours (1.5-2 days or 1 week part-time)
