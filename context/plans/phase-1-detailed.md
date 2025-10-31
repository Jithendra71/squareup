# Phase 1: Project Setup - Comprehensive Plan

**Duration**: Week 1 (5-7 days)
**Goal**: Establish a solid development environment and project foundation

---

## Overview

This phase focuses on setting up the development environment, initializing the React Native project, configuring Firebase services, and establishing the project architecture. A well-structured setup will prevent technical debt and enable smooth feature development in later phases.

---

## Prerequisites

### Required Tools
- **Node.js**: v16+ (LTS recommended)
- **npm** or **yarn**: Latest stable version
- **Git**: For version control
- **Code Editor**: VS Code (recommended) with React Native extensions
- **Xcode**: v13+ (for iOS development, macOS only)
- **Android Studio**: Latest version (for Android development)
- **Java Development Kit (JDK)**: v11 or v17

### Required Accounts
- **Firebase Account**: console.firebase.google.com
- **Google Cloud Account**: For Firebase services
- **GitHub/GitLab Account**: For code repository (optional but recommended)

---

## Step-by-Step Tasks

### Task 1.1: Development Environment Setup

**Duration**: 1-2 hours

#### Subtasks:
1. **Install Node.js and npm**
   ```bash
   # Verify installation
   node --version  # Should be v16+
   npm --version   # Should be 8+
   ```

2. **Install React Native CLI**
   ```bash
   npm install -g react-native-cli
   ```

3. **Set up Android Studio**
   - Download and install Android Studio
   - Install Android SDK (API Level 33 or latest)
   - Set up Android emulator (Pixel 5 or similar)
   - Configure environment variables:
     ```bash
     export ANDROID_HOME=$HOME/Library/Android/sdk
     export PATH=$PATH:$ANDROID_HOME/emulator
     export PATH=$PATH:$ANDROID_HOME/tools
     export PATH=$PATH:$ANDROID_HOME/tools/bin
     export PATH=$PATH:$ANDROID_HOME/platform-tools
     ```

4. **Set up Xcode (macOS only)**
   - Install Xcode from App Store
   - Install Command Line Tools:
     ```bash
     xcode-select --install
     ```
   - Install CocoaPods:
     ```bash
     sudo gem install cocoapods
     ```

5. **Install VS Code Extensions**
   - ES7+ React/Redux/React-Native snippets
   - Prettier - Code formatter
   - ESLint
   - React Native Tools
   - GitLens

#### Verification:
```bash
npx react-native doctor
```
All checks should pass ✓

#### Acceptance Criteria:
- [ ] Node.js v16+ installed and verified
- [ ] Android emulator launches successfully
- [ ] iOS simulator launches successfully (macOS)
- [ ] `react-native doctor` shows all green checks

---

### Task 1.2: Initialize React Native Project

**Duration**: 30 minutes

#### Subtasks:
1. **Create new React Native project**
   ```bash
   npx react-native init SplitwiseClone --template react-native-template-typescript
   cd SplitwiseClone
   ```

2. **Test the default app**
   ```bash
   # For iOS (macOS only)
   npx react-native run-ios

   # For Android
   npx react-native run-android
   ```

3. **Initialize Git repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: React Native project setup"
   ```

4. **Create .gitignore entries** (should already exist, verify)
   ```
   # Node
   node_modules/
   npm-debug.log

   # React Native
   .expo/
   .expo-shared/

   # Firebase
   google-services.json
   GoogleService-Info.plist

   # Environment
   .env
   .env.local

   # IDE
   .vscode/
   .idea/
   ```

#### Acceptance Criteria:
- [ ] Project created with TypeScript template
- [ ] App runs successfully on iOS simulator
- [ ] App runs successfully on Android emulator
- [ ] Git repository initialized with proper .gitignore

---

### Task 1.3: Install Core Dependencies

**Duration**: 1 hour

#### Subtasks:

1. **Navigation Libraries**
   ```bash
   npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
   npm install react-native-screens react-native-safe-area-context react-native-gesture-handler
   ```

2. **Firebase SDK**
   ```bash
   npm install @react-native-firebase/app
   npm install @react-native-firebase/auth
   npm install @react-native-firebase/firestore
   npm install @react-native-firebase/storage
   ```

3. **State Management**
   ```bash
   npm install zustand
   npm install immer  # For immutable state updates
   ```

4. **UI Component Library**
   ```bash
   npm install react-native-paper
   npm install react-native-vector-icons
   ```

5. **Form Handling**
   ```bash
   npm install react-hook-form
   npm install zod  # For validation schemas
   ```

6. **Utilities**
   ```bash
   npm install date-fns
   npm install react-native-image-picker
   npm install @react-native-async-storage/async-storage
   ```

7. **Development Dependencies**
   ```bash
   npm install --save-dev @types/react-native-vector-icons
   npm install --save-dev eslint-plugin-react-hooks
   npm install --save-dev prettier
   ```

8. **Link Native Dependencies**
   ```bash
   # iOS only
   cd ios && pod install && cd ..
   ```

#### Verification:
```bash
npm list --depth=0
```
Check that all packages are installed without errors.

#### Acceptance Criteria:
- [ ] All navigation packages installed
- [ ] Firebase packages installed
- [ ] Zustand installed for state management
- [ ] React Native Paper and vector icons installed
- [ ] Form handling libraries installed
- [ ] No peer dependency warnings
- [ ] App still builds successfully after installations

---

### Task 1.4: Firebase Project Configuration

**Duration**: 1-2 hours

#### Subtasks:

1. **Create Firebase Project**
   - Go to console.firebase.google.com
   - Click "Add Project"
   - Name: "splitwise-clone" (or your preferred name)
   - Disable Google Analytics (can enable later)
   - Wait for project creation

2. **Add iOS App to Firebase**
   - Click iOS icon in Firebase console
   - Bundle ID: `com.splitwiseclone` (match from Xcode)
   - Register app
   - Download `GoogleService-Info.plist`
   - Add to `ios/SplitwiseClone/` directory in Xcode
   - Skip SDK steps (already handled by react-native-firebase)

3. **Add Android App to Firebase**
   - Click Android icon in Firebase console
   - Package name: `com.splitwiseclone` (match from build.gradle)
   - Register app
   - Download `google-services.json`
   - Place in `android/app/` directory

4. **Enable Firebase Authentication**
   - Go to Authentication section
   - Click "Get Started"
   - Enable "Email/Password" provider
   - Enable "Google" provider (optional):
     - Add support email
     - Generate OAuth client ID

5. **Set Up Firestore Database**
   - Go to Firestore Database
   - Click "Create Database"
   - Start in **Test Mode** (we'll add security rules later)
   - Choose region closest to your users (e.g., us-central1)
   - Wait for provisioning

6. **Enable Cloud Storage**
   - Go to Storage section
   - Click "Get Started"
   - Start in **Test Mode**
   - Use default bucket location

7. **Configure Firebase in React Native**

   **iOS Configuration** (`ios/Podfile`):
   ```ruby
   # Add inside target 'SplitwiseClone' do block
   use_frameworks! :linkage => :static
   ```

   **Android Configuration** (`android/build.gradle`):
   ```gradle
   buildscript {
     dependencies {
       classpath 'com.google.gms:google-services:4.3.15'
     }
   }
   ```

   **Android App Configuration** (`android/app/build.gradle`):
   ```gradle
   apply plugin: 'com.google.gms.google-services'
   ```

8. **Initialize Firebase in App**

   Create `src/config/firebase.ts`:
   ```typescript
   import { FirebaseApp } from '@react-native-firebase/app';
   import auth from '@react-native-firebase/auth';
   import firestore from '@react-native-firebase/firestore';
   import storage from '@react-native-firebase/storage';

   export { auth, firestore, storage };
   ```

9. **Test Firebase Connection**
   Create a simple test in `App.tsx`:
   ```typescript
   import { useEffect } from 'react';
   import { firestore } from './src/config/firebase';

   useEffect(() => {
     firestore().collection('test').add({
       test: 'Firebase connected successfully',
       timestamp: new Date(),
     }).then(() => {
       console.log('Firebase connected!');
     });
   }, []);
   ```

#### Verification:
- Check Firebase console for the test document in Firestore
- Check Firebase Authentication console (should show enabled providers)
- Check Storage console (bucket should be created)

#### Acceptance Criteria:
- [ ] Firebase project created
- [ ] iOS app registered with Firebase
- [ ] Android app registered with Firebase
- [ ] Authentication enabled (Email/Password, optionally Google)
- [ ] Firestore database created in test mode
- [ ] Cloud Storage enabled
- [ ] Firebase config files added to project
- [ ] Test document successfully written to Firestore
- [ ] No Firebase initialization errors in app logs

---

### Task 1.5: Project Structure Setup

**Duration**: 1-2 hours

#### Subtasks:

1. **Create Directory Structure**
   ```bash
   mkdir -p src/{components,screens,navigation,store,services,utils,constants,types,hooks}
   mkdir -p src/components/{common,expenses,groups,settlements}
   mkdir -p src/screens/{auth,dashboard,groups,expenses,profile,settlements}
   mkdir -p src/services/firebase
   ```

2. **Create Core Type Definitions**

   **src/types/index.ts**:
   ```typescript
   export interface User {
     id: string;
     email: string;
     displayName: string;
     photoURL?: string;
     createdAt: Date;
   }

   export interface Group {
     id: string;
     name: string;
     description?: string;
     createdBy: string;
     createdAt: Date;
     members: string[];
     memberDetails: MemberDetail[];
   }

   export interface MemberDetail {
     userId: string;
     displayName: string;
     photoURL?: string;
     email: string;
   }

   export interface Expense {
     id: string;
     groupId: string;
     description: string;
     amount: number;
     category: string;
     paidBy: string;
     createdBy: string;
     createdAt: Date;
     updatedAt: Date;
     splits: ExpenseSplit[];
   }

   export interface ExpenseSplit {
     userId: string;
     amount: number;
     settled: boolean;
   }

   export interface Settlement {
     id: string;
     groupId: string;
     fromUserId: string;
     toUserId: string;
     amount: number;
     note?: string;
     createdAt: Date;
   }

   export interface Balance {
     userId: string;
     displayName: string;
     amount: number; // positive = owes you, negative = you owe
   }
   ```

3. **Create Constants File**

   **src/constants/index.ts**:
   ```typescript
   export const COLORS = {
     primary: '#5CB85C',
     secondary: '#0275D8',
     danger: '#D9534F',
     warning: '#F0AD4E',
     info: '#5BC0DE',
     light: '#F8F9FA',
     dark: '#343A40',
     white: '#FFFFFF',
     background: '#F5F5F5',
   };

   export const EXPENSE_CATEGORIES = [
     { label: 'Food & Drink', value: 'food', icon: 'food' },
     { label: 'Shopping', value: 'shopping', icon: 'shopping' },
     { label: 'Entertainment', value: 'entertainment', icon: 'movie' },
     { label: 'Transport', value: 'transport', icon: 'car' },
     { label: 'Home', value: 'home', icon: 'home' },
     { label: 'Utilities', value: 'utilities', icon: 'flash' },
     { label: 'Other', value: 'other', icon: 'dots-horizontal' },
   ];

   export const SPLIT_TYPES = {
     EQUAL: 'equal',
     CUSTOM: 'custom',
   };
   ```

4. **Create Firebase Service Structure**

   **src/services/firebase/index.ts**:
   ```typescript
   export * from './auth';
   export * from './users';
   export * from './groups';
   export * from './expenses';
   export * from './settlements';
   ```

5. **Create Environment Configuration**

   **src/config/environment.ts**:
   ```typescript
   export const ENV = {
     isDevelopment: __DEV__,
     firebaseConfig: {
       // Will be auto-loaded by react-native-firebase
     },
   };
   ```

6. **Create Basic Error Handling Utility**

   **src/utils/errorHandler.ts**:
   ```typescript
   export const handleFirebaseError = (error: any): string => {
     switch (error.code) {
       case 'auth/user-not-found':
         return 'No user found with this email';
       case 'auth/wrong-password':
         return 'Incorrect password';
       case 'auth/email-already-in-use':
         return 'Email already in use';
       case 'auth/weak-password':
         return 'Password should be at least 6 characters';
       case 'auth/invalid-email':
         return 'Invalid email address';
       case 'auth/network-request-failed':
         return 'Network error. Please check your connection';
       default:
         return error.message || 'An error occurred';
     }
   };
   ```

7. **Create Loading Component**

   **src/components/common/Loading.tsx**:
   ```typescript
   import React from 'react';
   import { View, ActivityIndicator, StyleSheet } from 'react-native';
   import { COLORS } from '../../constants';

   export const Loading: React.FC = () => {
     return (
       <View style={styles.container}>
         <ActivityIndicator size="large" color={COLORS.primary} />
       </View>
     );
   };

   const styles = StyleSheet.create({
     container: {
       flex: 1,
       justifyContent: 'center',
       alignItems: 'center',
       backgroundColor: COLORS.background,
     },
   });
   ```

8. **Update package.json with Scripts**
   ```json
   {
     "scripts": {
       "android": "react-native run-android",
       "ios": "react-native run-ios",
       "start": "react-native start",
       "test": "jest",
       "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
       "format": "prettier --write \"src/**/*.{ts,tsx}\"",
       "type-check": "tsc --noEmit"
     }
   }
   ```

#### Acceptance Criteria:
- [ ] All directories created following the planned structure
- [ ] Type definitions created for all core entities
- [ ] Constants file with colors and categories
- [ ] Firebase service structure in place
- [ ] Error handling utility created
- [ ] Basic reusable components (Loading) created
- [ ] Package.json scripts configured

---

### Task 1.6: Configure TypeScript & ESLint

**Duration**: 30 minutes

#### Subtasks:

1. **Update tsconfig.json**
   ```json
   {
     "extends": "@tsconfig/react-native/tsconfig.json",
     "compilerOptions": {
       "strict": true,
       "esModuleInterop": true,
       "skipLibCheck": true,
       "resolveJsonModule": true,
       "baseUrl": ".",
       "paths": {
         "@components/*": ["src/components/*"],
         "@screens/*": ["src/screens/*"],
         "@services/*": ["src/services/*"],
         "@utils/*": ["src/utils/*"],
         "@constants/*": ["src/constants/*"],
         "@types/*": ["src/types/*"],
         "@hooks/*": ["src/hooks/*"],
         "@store/*": ["src/store/*"],
         "@navigation/*": ["src/navigation/*"]
       }
     }
   }
   ```

2. **Update .eslintrc.js**
   ```javascript
   module.exports = {
     root: true,
     extends: '@react-native-community',
     parser: '@typescript-eslint/parser',
     plugins: ['@typescript-eslint', 'react-hooks'],
     rules: {
       'react-hooks/rules-of-hooks': 'error',
       'react-hooks/exhaustive-deps': 'warn',
       '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
     },
   };
   ```

3. **Create .prettierrc**
   ```json
   {
     "semi": true,
     "singleQuote": true,
     "tabWidth": 2,
     "trailingComma": "all",
     "printWidth": 100,
     "arrowParens": "always"
   }
   ```

#### Acceptance Criteria:
- [ ] TypeScript strict mode enabled
- [ ] Path aliases configured
- [ ] ESLint rules for React Hooks enabled
- [ ] Prettier configured
- [ ] No linting errors in existing code

---

### Task 1.7: Version Control & Documentation

**Duration**: 30 minutes

#### Subtasks:

1. **Create README.md**
   ```markdown
   # Splitwise Clone

   A mobile expense splitting app built with React Native and Firebase.

   ## Setup Instructions

   1. Clone the repository
   2. Install dependencies: `npm install`
   3. Install iOS dependencies: `cd ios && pod install && cd ..`
   4. Add Firebase configuration files (see Firebase Setup section)
   5. Run on iOS: `npm run ios`
   6. Run on Android: `npm run android`

   ## Tech Stack

   - React Native with TypeScript
   - Firebase (Auth, Firestore, Storage)
   - Zustand (State Management)
   - React Navigation
   - React Native Paper

   ## Project Structure

   See [Project Structure Documentation](./docs/PROJECT_STRUCTURE.md)

   ## Firebase Setup

   1. Create Firebase project
   2. Add iOS and Android apps
   3. Download configuration files
   4. Place files in appropriate directories
   5. Enable Authentication, Firestore, and Storage

   ## Development

   - `npm run android` - Run on Android
   - `npm run ios` - Run on iOS
   - `npm run lint` - Run ESLint
   - `npm run format` - Format code with Prettier
   - `npm run type-check` - Run TypeScript compiler
   ```

2. **Create PROJECT_STRUCTURE.md**
   ```markdown
   # Project Structure

   ## Directory Layout

   ```
   src/
   ├── components/          # Reusable components
   │   ├── common/         # Generic UI components
   │   ├── expenses/       # Expense-related components
   │   ├── groups/         # Group-related components
   │   └── settlements/    # Settlement-related components
   ├── screens/            # Screen components
   │   ├── auth/          # Authentication screens
   │   ├── dashboard/     # Dashboard screen
   │   ├── groups/        # Group management screens
   │   ├── expenses/      # Expense management screens
   │   ├── profile/       # User profile screens
   │   └── settlements/   # Settlement screens
   ├── navigation/         # Navigation configuration
   ├── store/             # Zustand stores
   ├── services/          # External services (Firebase)
   │   └── firebase/      # Firebase operations
   ├── utils/             # Helper functions
   ├── constants/         # App constants
   ├── types/             # TypeScript type definitions
   ├── hooks/             # Custom React hooks
   └── config/            # App configuration
   ```
   ```

3. **Create Git Commit**
   ```bash
   git add .
   git commit -m "Phase 1 complete: Project setup with Firebase configuration"
   git tag v0.1.0
   ```

4. **Create .env.example** (for future environment variables)
   ```
   # Firebase (Optional - using firebase config files)
   # API_URL=
   # ENVIRONMENT=development
   ```

#### Acceptance Criteria:
- [ ] README.md created with setup instructions
- [ ] PROJECT_STRUCTURE.md documents folder organization
- [ ] Git commit with all changes
- [ ] Version tag created (v0.1.0)
- [ ] .env.example created

---

## Testing & Verification

### Manual Testing Checklist

- [ ] App builds successfully on iOS
- [ ] App builds successfully on Android
- [ ] App launches without crashes on iOS
- [ ] App launches without crashes on Android
- [ ] Firebase test document appears in Firestore console
- [ ] No errors in Metro bundler logs
- [ ] No errors in Xcode console
- [ ] No errors in Android Studio logcat

### Build Verification Commands

```bash
# Clean and rebuild iOS
cd ios && pod install && cd ..
npx react-native run-ios

# Clean and rebuild Android
cd android && ./gradlew clean && cd ..
npx react-native run-android

# Run type checking
npm run type-check

# Run linting
npm run lint
```

---

## Common Issues & Troubleshooting

### Issue 1: Pod Install Fails (iOS)
**Solution:**
```bash
cd ios
rm -rf Pods Podfile.lock
pod deintegrate
pod install
cd ..
```

### Issue 2: Metro Bundler Cache Issues
**Solution:**
```bash
npx react-native start --reset-cache
```

### Issue 3: Android Build Fails
**Solution:**
```bash
cd android
./gradlew clean
cd ..
rm -rf node_modules
npm install
```

### Issue 4: Firebase Not Connecting
**Solution:**
- Verify `google-services.json` is in `android/app/`
- Verify `GoogleService-Info.plist` is in `ios/SplitwiseClone/`
- Check Bundle ID/Package name matches Firebase console
- Rebuild the app completely

### Issue 5: React Native Vector Icons Not Showing
**Solution for iOS:**
```bash
cd ios
pod install
cd ..
```

**Solution for Android:** Add to `android/app/build.gradle`:
```gradle
apply from: "../../node_modules/react-native-vector-icons/fonts.gradle"
```

---

## Dependencies Reference

### Production Dependencies
```json
{
  "@react-navigation/native": "^6.x",
  "@react-navigation/stack": "^6.x",
  "@react-navigation/bottom-tabs": "^6.x",
  "@react-native-firebase/app": "^18.x",
  "@react-native-firebase/auth": "^18.x",
  "@react-native-firebase/firestore": "^18.x",
  "@react-native-firebase/storage": "^18.x",
  "zustand": "^4.x",
  "immer": "^10.x",
  "react-native-paper": "^5.x",
  "react-native-vector-icons": "^10.x",
  "react-hook-form": "^7.x",
  "zod": "^3.x",
  "date-fns": "^2.x",
  "react-native-image-picker": "^5.x",
  "@react-native-async-storage/async-storage": "^1.x"
}
```

---

## Success Criteria

Phase 1 is complete when:

1. ✅ React Native project created with TypeScript
2. ✅ All core dependencies installed
3. ✅ Firebase project configured and connected
4. ✅ Project structure established
5. ✅ Type definitions for core entities created
6. ✅ Basic constants and utilities in place
7. ✅ App builds and runs on both iOS and Android
8. ✅ Firebase connection verified
9. ✅ Git repository with proper .gitignore
10. ✅ Documentation (README, PROJECT_STRUCTURE) created
11. ✅ TypeScript, ESLint, Prettier configured
12. ✅ No build errors or warnings

---

## Handoff to Phase 2

Once Phase 1 is complete, you'll have:
- A working React Native development environment
- Firebase project ready for Authentication
- Proper project structure for scalable development
- Type-safe codebase with TypeScript
- All necessary dependencies installed

**Next Phase:** Phase 2 will focus on implementing user authentication using Firebase Auth, creating login/signup screens, and setting up authentication state management with Zustand.

---

## Estimated Time Breakdown

| Task | Estimated Time |
|------|---------------|
| 1.1 Environment Setup | 1-2 hours |
| 1.2 Initialize Project | 30 minutes |
| 1.3 Install Dependencies | 1 hour |
| 1.4 Firebase Configuration | 1-2 hours |
| 1.5 Project Structure | 1-2 hours |
| 1.6 TypeScript/ESLint Config | 30 minutes |
| 1.7 Documentation | 30 minutes |
| **Total** | **5-7 hours** |

With breaks and troubleshooting, this phase should take approximately 1 full working day (8 hours) or can be spread across 2-3 days working part-time.
