# Phase 2: Authentication - Comprehensive Plan

**Duration**: Week 2 (5-7 days)
**Goal**: Implement complete user authentication system with Firebase Auth

---

## Overview

This phase focuses on building a robust authentication system using Firebase Authentication. Users will be able to sign up, log in, manage their profiles, and maintain persistent authentication state across app sessions.

---

## Prerequisites

**Must be completed from Phase 1:**
- ✅ Firebase Authentication enabled (Email/Password)
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
  └─ No → Auth Screens (Login/Signup)
```

### State Management Strategy
- **Zustand Store**: Manages auth state (user, loading, error)
- **Firebase Auth Observer**: Listens for auth state changes
- **Async Storage**: Persists auth token for offline scenarios

---

## Step-by-Step Tasks

### Task 2.1: Create Authentication Store

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

     // Actions
     setUser: (user: User | null) => void;
     setLoading: (loading: boolean) => void;
     setError: (error: string | null) => void;
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

         logout: () => set({
           user: null,
           isAuthenticated: false,
           error: null,
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
- [ ] User store created for caching user data
- [ ] Type-safe actions and state

---

### Task 2.2: Create Firebase Auth Service

**Duration**: 2 hours

#### Subtasks:

1. **Create Auth Service Functions**

   **src/services/firebase/auth.ts**:
   ```typescript
   import auth from '@react-native-firebase/auth';
   import { firestore } from '../../config/firebase';
   import { User } from '../../types';
   import { handleFirebaseError } from '../../utils/errorHandler';

   export const authService = {
     /**
      * Sign up with email and password
      */
     async signUp(email: string, password: string, displayName: string): Promise<User> {
       try {
         // Create auth user
         const userCredential = await auth().createUserWithEmailAndPassword(email, password);
         const firebaseUser = userCredential.user;

         // Update profile
         await firebaseUser.updateProfile({ displayName });

         // Create user document in Firestore
         const user: User = {
           id: firebaseUser.uid,
           email: firebaseUser.email!,
           displayName,
           photoURL: firebaseUser.photoURL || undefined,
           createdAt: new Date(),
         };

         await firestore().collection('users').doc(user.id).set({
           ...user,
           createdAt: firestore.FieldValue.serverTimestamp(),
         });

         return user;
       } catch (error: any) {
         throw new Error(handleFirebaseError(error));
       }
     },

     /**
      * Sign in with email and password
      */
     async signIn(email: string, password: string): Promise<User> {
       try {
         const userCredential = await auth().signInWithEmailAndPassword(email, password);
         const firebaseUser = userCredential.user;

         // Fetch user document from Firestore
         const userDoc = await firestore().collection('users').doc(firebaseUser.uid).get();

         if (!userDoc.exists) {
           throw new Error('User data not found');
         }

         const userData = userDoc.data()!;
         return {
           id: firebaseUser.uid,
           email: firebaseUser.email!,
           displayName: firebaseUser.displayName || userData.displayName,
           photoURL: firebaseUser.photoURL || userData.photoURL,
           createdAt: userData.createdAt?.toDate() || new Date(),
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
      * Send password reset email
      */
     async resetPassword(email: string): Promise<void> {
       try {
         await auth().sendPasswordResetEmail(email);
       } catch (error: any) {
         throw new Error(handleFirebaseError(error));
       }
     },

     /**
      * Update user profile
      */
     async updateProfile(updates: { displayName?: string; photoURL?: string }): Promise<void> {
       try {
         const currentUser = auth().currentUser;
         if (!currentUser) throw new Error('No user logged in');

         await currentUser.updateProfile(updates);

         // Update Firestore
         await firestore().collection('users').doc(currentUser.uid).update(updates);
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
           email: currentUser.email!,
           displayName: currentUser.displayName || userData.displayName,
           photoURL: currentUser.photoURL || userData.photoURL,
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
           email: data.email,
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
      * Search users by email
      */
     async searchUsersByEmail(email: string): Promise<User[]> {
       try {
         const snapshot = await firestore()
           .collection('users')
           .where('email', '==', email.toLowerCase())
           .limit(10)
           .get();

         return snapshot.docs.map(doc => {
           const data = doc.data();
           return {
             id: doc.id,
             email: data.email,
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

         // Firestore 'in' queries limited to 10 items
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
               email: data.email,
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
- [ ] Auth service with signup, signin, signout functions
- [ ] Password reset functionality
- [ ] Profile update functionality
- [ ] Auth state observer implemented
- [ ] Users service for fetching user data
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
     const { user, isAuthenticated, isLoading, error, setUser, setLoading, setError, logout, clearError } = useAuthStore();

     useEffect(() => {
       // Set up auth state listener
       const unsubscribe = authService.onAuthStateChanged((user) => {
         setUser(user);
       });

       return unsubscribe;
     }, [setUser]);

     const signUp = async (email: string, password: string, displayName: string) => {
       try {
         setLoading(true);
         clearError();
         const user = await authService.signUp(email, password, displayName);
         setUser(user);
       } catch (error: any) {
         setError(error.message);
         throw error;
       }
     };

     const signIn = async (email: string, password: string) => {
       try {
         setLoading(true);
         clearError();
         const user = await authService.signIn(email, password);
         setUser(user);
       } catch (error: any) {
         setError(error.message);
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
       }
     };

     const resetPassword = async (email: string) => {
       try {
         setLoading(true);
         clearError();
         await authService.resetPassword(email);
         setLoading(false);
       } catch (error: any) {
         setError(error.message);
         throw error;
       }
     };

     return {
       user,
       isAuthenticated,
       isLoading,
       error,
       signUp,
       signIn,
       signOut,
       resetPassword,
       clearError,
     };
   };
   ```

#### Acceptance Criteria:
- [ ] useAuth hook created
- [ ] Auth state listener set up on mount
- [ ] All auth operations wrapped with error handling
- [ ] Hook provides easy-to-use API for components

---

### Task 2.4: Create Login Screen

**Duration**: 2 hours

#### Subtasks:

1. **Create Login Screen Component**

   **src/screens/auth/LoginScreen.tsx**:
   ```typescript
   import React, { useState } from 'react';
   import {
     View,
     StyleSheet,
     KeyboardAvoidingView,
     Platform,
     ScrollView,
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

   type LoginScreenProps = {
     navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
   };

   const loginSchema = z.object({
     email: z.string().email('Invalid email address'),
     password: z.string().min(6, 'Password must be at least 6 characters'),
   });

   type LoginFormData = z.infer<typeof loginSchema>;

   export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
     const { signIn, isLoading } = useAuth();
     const [showPassword, setShowPassword] = useState(false);

     const {
       control,
       handleSubmit,
       formState: { errors },
     } = useForm<LoginFormData>({
       resolver: zodResolver(loginSchema),
       defaultValues: {
         email: '',
         password: '',
       },
     });

     const onSubmit = async (data: LoginFormData) => {
       try {
         await signIn(data.email, data.password);
       } catch (error: any) {
         Alert.alert('Login Failed', error.message);
       }
     };

     return (
       <KeyboardAvoidingView
         style={styles.container}
         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
       >
         <ScrollView contentContainerStyle={styles.scrollContent}>
           <View style={styles.header}>
             <Text variant="displaySmall" style={styles.title}>
               Welcome Back
             </Text>
             <Text variant="bodyLarge" style={styles.subtitle}>
               Sign in to continue
             </Text>
           </View>

           <View style={styles.form}>
             <Controller
               control={control}
               name="email"
               render={({ field: { onChange, onBlur, value } }) => (
                 <>
                   <TextInput
                     label="Email"
                     mode="outlined"
                     value={value}
                     onChangeText={onChange}
                     onBlur={onBlur}
                     keyboardType="email-address"
                     autoCapitalize="none"
                     error={!!errors.email}
                     left={<TextInput.Icon icon="email" />}
                   />
                   {errors.email && (
                     <HelperText type="error">{errors.email.message}</HelperText>
                   )}
                 </>
               )}
             />

             <Controller
               control={control}
               name="password"
               render={({ field: { onChange, onBlur, value } }) => (
                 <>
                   <TextInput
                     label="Password"
                     mode="outlined"
                     value={value}
                     onChangeText={onChange}
                     onBlur={onBlur}
                     secureTextEntry={!showPassword}
                     error={!!errors.password}
                     left={<TextInput.Icon icon="lock" />}
                     right={
                       <TextInput.Icon
                         icon={showPassword ? 'eye-off' : 'eye'}
                         onPress={() => setShowPassword(!showPassword)}
                       />
                     }
                   />
                   {errors.password && (
                     <HelperText type="error">{errors.password.message}</HelperText>
                   )}
                 </>
               )}
             />

             <Button
               mode="text"
               onPress={() => navigation.navigate('ForgotPassword')}
               style={styles.forgotPassword}
             >
               Forgot Password?
             </Button>

             <Button
               mode="contained"
               onPress={handleSubmit(onSubmit)}
               loading={isLoading}
               disabled={isLoading}
               style={styles.button}
             >
               Sign In
             </Button>

             <View style={styles.footer}>
               <Text variant="bodyMedium">Don't have an account? </Text>
               <Button
                 mode="text"
                 onPress={() => navigation.navigate('Signup')}
                 compact
               >
                 Sign Up
               </Button>
             </View>
           </View>
         </ScrollView>
       </KeyboardAvoidingView>
     );
   };

   const styles = StyleSheet.create({
     container: {
       flex: 1,
       backgroundColor: COLORS.background,
     },
     scrollContent: {
       flexGrow: 1,
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
     },
     form: {
       gap: 16,
     },
     forgotPassword: {
       alignSelf: 'flex-end',
     },
     button: {
       marginTop: 8,
       paddingVertical: 6,
     },
     footer: {
       flexDirection: 'row',
       justifyContent: 'center',
       alignItems: 'center',
       marginTop: 16,
     },
   });
   ```

#### Acceptance Criteria:
- [ ] Login screen with email and password fields
- [ ] Form validation with Zod schema
- [ ] Password visibility toggle
- [ ] Forgot password link
- [ ] Navigation to signup screen
- [ ] Loading state during authentication
- [ ] Error handling with alerts
- [ ] Responsive design with keyboard avoidance

---

### Task 2.5: Create Signup Screen

**Duration**: 2 hours

#### Subtasks:

1. **Create Signup Screen Component**

   **src/screens/auth/SignupScreen.tsx**:
   ```typescript
   import React, { useState } from 'react';
   import {
     View,
     StyleSheet,
     KeyboardAvoidingView,
     Platform,
     ScrollView,
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

   type SignupScreenProps = {
     navigation: NativeStackNavigationProp<AuthStackParamList, 'Signup'>;
   };

   const signupSchema = z.object({
     displayName: z.string().min(2, 'Name must be at least 2 characters'),
     email: z.string().email('Invalid email address'),
     password: z.string().min(6, 'Password must be at least 6 characters'),
     confirmPassword: z.string(),
   }).refine((data) => data.password === data.confirmPassword, {
     message: "Passwords don't match",
     path: ['confirmPassword'],
   });

   type SignupFormData = z.infer<typeof signupSchema>;

   export const SignupScreen: React.FC<SignupScreenProps> = ({ navigation }) => {
     const { signUp, isLoading } = useAuth();
     const [showPassword, setShowPassword] = useState(false);
     const [showConfirmPassword, setShowConfirmPassword] = useState(false);

     const {
       control,
       handleSubmit,
       formState: { errors },
     } = useForm<SignupFormData>({
       resolver: zodResolver(signupSchema),
       defaultValues: {
         displayName: '',
         email: '',
         password: '',
         confirmPassword: '',
       },
     });

     const onSubmit = async (data: SignupFormData) => {
       try {
         await signUp(data.email, data.password, data.displayName);
         Alert.alert('Success', 'Account created successfully!');
       } catch (error: any) {
         Alert.alert('Signup Failed', error.message);
       }
     };

     return (
       <KeyboardAvoidingView
         style={styles.container}
         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
       >
         <ScrollView contentContainerStyle={styles.scrollContent}>
           <View style={styles.header}>
             <Text variant="displaySmall" style={styles.title}>
               Create Account
             </Text>
             <Text variant="bodyLarge" style={styles.subtitle}>
               Sign up to get started
             </Text>
           </View>

           <View style={styles.form}>
             <Controller
               control={control}
               name="displayName"
               render={({ field: { onChange, onBlur, value } }) => (
                 <>
                   <TextInput
                     label="Full Name"
                     mode="outlined"
                     value={value}
                     onChangeText={onChange}
                     onBlur={onBlur}
                     error={!!errors.displayName}
                     left={<TextInput.Icon icon="account" />}
                   />
                   {errors.displayName && (
                     <HelperText type="error">{errors.displayName.message}</HelperText>
                   )}
                 </>
               )}
             />

             <Controller
               control={control}
               name="email"
               render={({ field: { onChange, onBlur, value } }) => (
                 <>
                   <TextInput
                     label="Email"
                     mode="outlined"
                     value={value}
                     onChangeText={onChange}
                     onBlur={onBlur}
                     keyboardType="email-address"
                     autoCapitalize="none"
                     error={!!errors.email}
                     left={<TextInput.Icon icon="email" />}
                   />
                   {errors.email && (
                     <HelperText type="error">{errors.email.message}</HelperText>
                   )}
                 </>
               )}
             />

             <Controller
               control={control}
               name="password"
               render={({ field: { onChange, onBlur, value } }) => (
                 <>
                   <TextInput
                     label="Password"
                     mode="outlined"
                     value={value}
                     onChangeText={onChange}
                     onBlur={onBlur}
                     secureTextEntry={!showPassword}
                     error={!!errors.password}
                     left={<TextInput.Icon icon="lock" />}
                     right={
                       <TextInput.Icon
                         icon={showPassword ? 'eye-off' : 'eye'}
                         onPress={() => setShowPassword(!showPassword)}
                       />
                     }
                   />
                   {errors.password && (
                     <HelperText type="error">{errors.password.message}</HelperText>
                   )}
                 </>
               )}
             />

             <Controller
               control={control}
               name="confirmPassword"
               render={({ field: { onChange, onBlur, value } }) => (
                 <>
                   <TextInput
                     label="Confirm Password"
                     mode="outlined"
                     value={value}
                     onChangeText={onChange}
                     onBlur={onBlur}
                     secureTextEntry={!showConfirmPassword}
                     error={!!errors.confirmPassword}
                     left={<TextInput.Icon icon="lock-check" />}
                     right={
                       <TextInput.Icon
                         icon={showConfirmPassword ? 'eye-off' : 'eye'}
                         onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                       />
                     }
                   />
                   {errors.confirmPassword && (
                     <HelperText type="error">{errors.confirmPassword.message}</HelperText>
                   )}
                 </>
               )}
             />

             <Button
               mode="contained"
               onPress={handleSubmit(onSubmit)}
               loading={isLoading}
               disabled={isLoading}
               style={styles.button}
             >
               Sign Up
             </Button>

             <View style={styles.footer}>
               <Text variant="bodyMedium">Already have an account? </Text>
               <Button
                 mode="text"
                 onPress={() => navigation.navigate('Login')}
                 compact
               >
                 Sign In
               </Button>
             </View>
           </View>
         </ScrollView>
       </KeyboardAvoidingView>
     );
   };

   const styles = StyleSheet.create({
     container: {
       flex: 1,
       backgroundColor: COLORS.background,
     },
     scrollContent: {
       flexGrow: 1,
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
     },
     form: {
       gap: 16,
     },
     button: {
       marginTop: 8,
       paddingVertical: 6,
     },
     footer: {
       flexDirection: 'row',
       justifyContent: 'center',
       alignItems: 'center',
       marginTop: 16,
     },
   });
   ```

#### Acceptance Criteria:
- [ ] Signup screen with name, email, password fields
- [ ] Password confirmation with validation
- [ ] Form validation with Zod schema
- [ ] Password visibility toggles
- [ ] Navigation to login screen
- [ ] Loading state during registration
- [ ] Success and error handling
- [ ] Responsive design

---

### Task 2.6: Create Forgot Password Screen

**Duration**: 1 hour

#### Subtasks:

1. **Create Forgot Password Screen**

   **src/screens/auth/ForgotPasswordScreen.tsx**:
   ```typescript
   import React, { useState } from 'react';
   import { View, StyleSheet, Alert } from 'react-native';
   import { TextInput, Button, Text, HelperText } from 'react-native-paper';
   import { useForm, Controller } from 'react-hook-form';
   import { zodResolver } from '@hookform/resolvers/zod';
   import { z } from 'zod';
   import { useAuth } from '../../hooks/useAuth';
   import { COLORS } from '../../constants';
   import { NativeStackNavigationProp } from '@react-navigation/native-stack';
   import { AuthStackParamList } from '../../navigation/types';

   type ForgotPasswordScreenProps = {
     navigation: NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;
   };

   const forgotPasswordSchema = z.object({
     email: z.string().email('Invalid email address'),
   });

   type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

   export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
     const { resetPassword, isLoading } = useAuth();
     const [emailSent, setEmailSent] = useState(false);

     const {
       control,
       handleSubmit,
       formState: { errors },
     } = useForm<ForgotPasswordFormData>({
       resolver: zodResolver(forgotPasswordSchema),
       defaultValues: {
         email: '',
       },
     });

     const onSubmit = async (data: ForgotPasswordFormData) => {
       try {
         await resetPassword(data.email);
         setEmailSent(true);
         Alert.alert(
           'Email Sent',
           'Check your email for password reset instructions.',
           [
             {
               text: 'OK',
               onPress: () => navigation.navigate('Login'),
             },
           ]
         );
       } catch (error: any) {
         Alert.alert('Error', error.message);
       }
     };

     return (
       <View style={styles.container}>
         <View style={styles.content}>
           <View style={styles.header}>
             <Text variant="headlineMedium" style={styles.title}>
               Forgot Password?
             </Text>
             <Text variant="bodyLarge" style={styles.subtitle}>
               Enter your email and we'll send you a link to reset your password
             </Text>
           </View>

           <View style={styles.form}>
             <Controller
               control={control}
               name="email"
               render={({ field: { onChange, onBlur, value } }) => (
                 <>
                   <TextInput
                     label="Email"
                     mode="outlined"
                     value={value}
                     onChangeText={onChange}
                     onBlur={onBlur}
                     keyboardType="email-address"
                     autoCapitalize="none"
                     error={!!errors.email}
                     left={<TextInput.Icon icon="email" />}
                   />
                   {errors.email && (
                     <HelperText type="error">{errors.email.message}</HelperText>
                   )}
                 </>
               )}
             />

             <Button
               mode="contained"
               onPress={handleSubmit(onSubmit)}
               loading={isLoading}
               disabled={isLoading || emailSent}
               style={styles.button}
             >
               Send Reset Link
             </Button>

             <Button
               mode="text"
               onPress={() => navigation.navigate('Login')}
               style={styles.backButton}
             >
               Back to Login
             </Button>
           </View>
         </View>
       </View>
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
       marginBottom: 16,
     },
     subtitle: {
       color: COLORS.dark,
       opacity: 0.6,
       textAlign: 'center',
     },
     form: {
       gap: 16,
     },
     button: {
       marginTop: 8,
       paddingVertical: 6,
     },
     backButton: {
       marginTop: 8,
     },
   });
   ```

#### Acceptance Criteria:
- [ ] Forgot password screen with email input
- [ ] Email validation
- [ ] Send reset link functionality
- [ ] Success feedback to user
- [ ] Back to login navigation
- [ ] Loading state

---

### Task 2.7: Create Navigation Types

**Duration**: 30 minutes

#### Subtasks:

1. **Create Navigation Type Definitions**

   **src/navigation/types.ts**:
   ```typescript
   export type AuthStackParamList = {
     Login: undefined;
     Signup: undefined;
     ForgotPassword: undefined;
   };

   export type MainStackParamList = {
     Dashboard: undefined;
     Groups: undefined;
     Profile: undefined;
     // More screens will be added in later phases
   };

   export type RootStackParamList = {
     Auth: undefined;
     Main: undefined;
   };
   ```

#### Acceptance Criteria:
- [ ] Type definitions for all navigation stacks
- [ ] Type-safe navigation params

---

### Task 2.8: Set Up Basic Navigation

**Duration**: 1 hour

#### Subtasks:

1. **Create Auth Navigator**

   **src/navigation/AuthNavigator.tsx**:
   ```typescript
   import React from 'react';
   import { createStackNavigator } from '@react-navigation/stack';
   import { LoginScreen } from '../screens/auth/LoginScreen';
   import { SignupScreen } from '../screens/auth/SignupScreen';
   import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
   import { AuthStackParamList } from './types';

   const Stack = createStackNavigator<AuthStackParamList>();

   export const AuthNavigator: React.FC = () => {
     return (
       <Stack.Navigator
         screenOptions={{
           headerShown: false,
         }}
       >
         <Stack.Screen name="Login" component={LoginScreen} />
         <Stack.Screen name="Signup" component={SignupScreen} />
         <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
       </Stack.Navigator>
     );
   };
   ```

2. **Create Temporary Main Navigator (Placeholder)**

   **src/navigation/MainNavigator.tsx**:
   ```typescript
   import React from 'react';
   import { View, StyleSheet } from 'react-native';
   import { Text, Button } from 'react-native-paper';
   import { useAuth } from '../hooks/useAuth';
   import { COLORS } from '../constants';

   export const MainNavigator: React.FC = () => {
     const { user, signOut } = useAuth();

     return (
       <View style={styles.container}>
         <Text variant="headlineMedium">Welcome, {user?.displayName}!</Text>
         <Text variant="bodyMedium" style={styles.email}>
           {user?.email}
         </Text>
         <Button mode="contained" onPress={signOut} style={styles.button}>
           Sign Out
         </Button>
       </View>
     );
   };

   const styles = StyleSheet.create({
     container: {
       flex: 1,
       justifyContent: 'center',
       alignItems: 'center',
       backgroundColor: COLORS.background,
       padding: 20,
     },
     email: {
       marginTop: 8,
       marginBottom: 24,
       color: COLORS.dark,
       opacity: 0.6,
     },
     button: {
       paddingHorizontal: 24,
     },
   });
   ```

3. **Create Root Navigator**

   **src/navigation/RootNavigator.tsx**:
   ```typescript
   import React from 'react';
   import { NavigationContainer } from '@react-navigation/native';
   import { useAuth } from '../hooks/useAuth';
   import { AuthNavigator } from './AuthNavigator';
   import { MainNavigator } from './MainNavigator';
   import { Loading } from '../components/common/Loading';

   export const RootNavigator: React.FC = () => {
     const { isAuthenticated, isLoading } = useAuth();

     if (isLoading) {
       return <Loading />;
     }

     return (
       <NavigationContainer>
         {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
       </NavigationContainer>
     );
   };
   ```

4. **Update App.tsx**

   **App.tsx**:
   ```typescript
   import React from 'react';
   import { Provider as PaperProvider } from 'react-native-paper';
   import { RootNavigator } from './src/navigation/RootNavigator';
   import { COLORS } from './src/constants';

   const theme = {
     colors: {
       primary: COLORS.primary,
       secondary: COLORS.secondary,
       background: COLORS.background,
     },
   };

   const App: React.FC = () => {
     return (
       <PaperProvider theme={theme}>
         <RootNavigator />
       </PaperProvider>
     );
   };

   export default App;
   ```

#### Acceptance Criteria:
- [ ] Auth navigator with login, signup, forgot password screens
- [ ] Temporary main navigator (placeholder)
- [ ] Root navigator switches based on auth state
- [ ] Loading screen shown during auth check
- [ ] App.tsx updated with navigation setup
- [ ] Theme configured with React Native Paper

---

## Testing & Verification

### Manual Testing Checklist

**Signup Flow:**
- [ ] Open app → See login screen
- [ ] Tap "Sign Up" → Navigate to signup screen
- [ ] Enter invalid email → See validation error
- [ ] Enter short password → See validation error
- [ ] Enter mismatched passwords → See validation error
- [ ] Enter valid data → Account created successfully
- [ ] Navigate to main screen after signup

**Login Flow:**
- [ ] Enter wrong email → See error message
- [ ] Enter wrong password → See error message
- [ ] Enter valid credentials → Login successful
- [ ] Navigate to main screen after login

**Forgot Password:**
- [ ] Tap "Forgot Password" → Navigate to forgot password screen
- [ ] Enter email → Reset email sent
- [ ] Check email inbox → Reset link received

**Persistence:**
- [ ] Login → Close app → Reopen app
- [ ] Should remain logged in (see main screen)
- [ ] Logout → Close app → Reopen app
- [ ] Should see login screen

**Firestore Verification:**
- [ ] Open Firebase Console → Firestore
- [ ] Check users collection
- [ ] Verify user document created with correct fields
- [ ] Verify createdAt timestamp

### Integration Tests

```typescript
// Example test structure (to be implemented in Phase 7)

describe('Authentication', () => {
  it('should create user account', async () => {
    // Test signup
  });

  it('should login with valid credentials', async () => {
    // Test login
  });

  it('should handle login errors', async () => {
    // Test error handling
  });

  it('should persist auth state', async () => {
    // Test persistence
  });
});
```

---

## Common Issues & Troubleshooting

### Issue 1: Firebase Auth Not Working
**Symptoms:** Login/signup fails silently
**Solution:**
- Check Firebase console Authentication is enabled
- Verify google-services.json / GoogleService-Info.plist files
- Check Bundle ID / Package name matches Firebase

### Issue 2: Navigation Not Switching
**Symptoms:** Stuck on login screen after successful auth
**Solution:**
- Check auth state observer is set up in useAuth hook
- Verify Zustand store is updating correctly
- Check RootNavigator conditional rendering logic

### Issue 3: Form Validation Not Working
**Symptoms:** Can submit form with invalid data
**Solution:**
- Verify Zod schema is correct
- Check zodResolver is passed to useForm
- Ensure form is using handleSubmit wrapper

### Issue 4: Keyboard Covering Inputs
**Symptoms:** Inputs hidden by keyboard on mobile
**Solution:**
- Verify KeyboardAvoidingView is used
- Check Platform.OS === 'ios' condition for behavior prop
- Consider using ScrollView inside KeyboardAvoidingView

---

## Security Considerations

### Password Storage
- ✅ Passwords handled by Firebase Auth (never stored directly)
- ✅ Passwords hashed with bcrypt on Firebase servers

### Email Validation
- ✅ Server-side validation by Firebase
- ✅ Client-side validation with Zod

### Auth Token Management
- ✅ Tokens managed by Firebase SDK
- ✅ Automatic token refresh
- ✅ Secure storage via AsyncStorage

### Best Practices Implemented
- [ ] Minimum password length (6 characters)
- [ ] Email validation before signup
- [ ] Password confirmation on signup
- [ ] Error messages don't expose sensitive info
- [ ] Logout clears all user data from store

---

## Success Criteria

Phase 2 is complete when:

1. ✅ Users can create accounts with email/password
2. ✅ Users can login with existing credentials
3. ✅ Users can reset forgotten passwords
4. ✅ Auth state persists across app restarts
5. ✅ Navigation switches between auth and main screens
6. ✅ User data saved to Firestore on signup
7. ✅ All forms have proper validation
8. ✅ Loading states shown during auth operations
9. ✅ Errors handled with user-friendly messages
10. ✅ Auth state managed with Zustand
11. ✅ Type-safe navigation
12. ✅ Clean UI with React Native Paper

---

## Handoff to Phase 3

**What's Ready:**
- Complete authentication system
- User management in Firestore
- Auth state management with Zustand
- Basic navigation structure
- Type-safe codebase

**Next Phase:** Phase 3 will focus on building the main navigation structure with bottom tabs, creating the Dashboard screen, Groups list screen, and Profile management screen.

---

## Estimated Time Breakdown

| Task | Estimated Time |
|------|---------------|
| 2.1 Auth Store | 1 hour |
| 2.2 Firebase Auth Service | 2 hours |
| 2.3 useAuth Hook | 30 minutes |
| 2.4 Login Screen | 2 hours |
| 2.5 Signup Screen | 2 hours |
| 2.6 Forgot Password Screen | 1 hour |
| 2.7 Navigation Types | 30 minutes |
| 2.8 Basic Navigation | 1 hour |
| Testing & Bug Fixes | 2 hours |
| **Total** | **12 hours** |

Can be completed in 1.5-2 working days (8 hours/day) or spread across a week working part-time.
