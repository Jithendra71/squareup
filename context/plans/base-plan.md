# Splitwise Clone - Simplified Project Plan

## Project Overview
A simple expense splitting app for personal use with friends. Built using React Native and Firebase.

## Tech Stack

### Frontend
- **React Native** - Cross-platform mobile development
- **React Navigation** - Navigation and routing
- **Zustand** - Simple state management (lighter than Redux)
- **React Native Paper** - UI component library
- **React Hook Form** - Form handling

### Backend (Firebase)
- **Firebase Authentication** - User authentication (Phone number with OTP)
- **Cloud Firestore** - Real-time NoSQL database
- **Cloud Storage** - Profile pictures storage
- **Firebase Cloud Messaging (FCM)** - Push notifications (optional)

---

## Core Features (MVP)

### 1. User Authentication
- Phone number authentication with OTP verification
- Automatic account creation on first login
- Profile management (name, phone number, profile picture)

### 2. Group Management
- Create groups
- Add members by phone number
- Group details (name, description)
- Leave/delete group

### 3. Expense Management
- Add expenses
- Split equally
- Split by exact amounts
- Select who paid
- Add description and category
- Edit/delete expenses

### 4. Settlement & Balances
- View who owes whom
- Simplified settlement (direct payments)
- Record settlements
- Balance summary per group

### 5. Dashboard
- Total balance overview
- Recent activities
- Groups list

---

## Database Schema (Firestore)

### Collections Structure

```
users/
  {userId}/
    - phoneNumber
    - displayName
    - photoURL
    - createdAt

groups/
  {groupId}/
    - name
    - description
    - createdBy
    - createdAt
    - members[] (userId references)
    - memberDetails[] {userId, displayName, phoneNumber, photoURL}

expenses/
  {expenseId}/
    - groupId
    - description
    - amount
    - category
    - paidBy (userId)
    - createdBy (userId)
    - createdAt
    - updatedAt
    - splits[] {userId, amount, settled}

settlements/
  {settlementId}/
    - groupId
    - fromUserId
    - toUserId
    - amount
    - note
    - createdAt
```

---

## Step-by-Step Implementation Plan

### Phase 1: Project Setup (Week 1)

#### Step 1: Environment Setup
```bash
# Install Node.js and npm (if not installed)

# Create new React Native project
npx react-native init SplitwiseClone
cd SplitwiseClone
```

#### Step 2: Install Dependencies
```bash
# Navigation
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context

# Firebase
npm install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore @react-native-firebase/storage

# State Management (simple & lightweight)
npm install zustand

# UI Components
npm install react-native-paper react-native-vector-icons

# Forms
npm install react-hook-form

# Date handling
npm install date-fns

# Image handling
npm install react-native-image-picker
```

#### Step 3: Firebase Project Setup
1. Create Firebase project at console.firebase.google.com
2. Enable Authentication (Phone number)
3. Create Firestore database (start in test mode)
4. Enable Storage
5. Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
6. Configure Firebase in the app

#### Step 4: Project Structure
```
src/
  components/
    common/        # Buttons, inputs, cards
    expenses/      # Expense-related components
    groups/        # Group-related components
  screens/
    auth/          # Login, Signup
    dashboard/     # Home screen
    groups/        # Group screens
    expenses/      # Expense screens
    profile/       # User profile
  navigation/      # Navigation setup
  store/           # Zustand state
  services/
    firebase/      # Firebase functions
  utils/           # Helper functions
  constants/       # Colors, categories
```

---

### Phase 2: Authentication (Week 2)

#### Tasks:
1. Create Phone Number Input screen
2. Create OTP Verification screen
3. Implement Firebase Phone Authentication
4. Set up auth state with Zustand
5. Profile setup for new users (name, photo)
6. Basic error handling

#### Key Files:
- `src/screens/auth/PhoneInputScreen.tsx`
- `src/screens/auth/OtpVerificationScreen.tsx`
- `src/screens/auth/ProfileSetupScreen.tsx`
- `src/services/firebase/auth.ts`
- `src/store/authStore.ts`

---

### Phase 3: Navigation & Dashboard (Week 3)

#### Tasks:
1. Set up bottom tab navigation
2. Create Dashboard screen (shows total balance)
3. Create Groups list screen
4. Create Profile screen
5. Basic styling and theme

#### Screens:
- Dashboard (Home)
- Groups
- Profile

---

### Phase 4: Group Management (Week 4)

#### Tasks:
1. Create group screen with form
2. Add members by phone number lookup
3. Group details screen (members list, expenses)
4. Leave group functionality
5. Firestore integration

#### Key Files:
- `src/screens/groups/CreateGroupScreen.tsx`
- `src/screens/groups/GroupDetailsScreen.tsx`
- `src/services/firebase/groups.ts`

---

### Phase 5: Expense Management (Week 5-6)

#### Tasks:
1. Add expense form (amount, description, category)
2. Split type: Equal or Custom amounts
3. Select who paid
4. Save to Firestore
5. Expense list in group view
6. Edit/delete expense
7. Calculate balances

#### Key Files:
- `src/screens/expenses/AddExpenseScreen.tsx`
- `src/screens/expenses/ExpenseListScreen.tsx`
- `src/services/firebase/expenses.ts`
- `src/utils/balanceCalculator.ts`

#### Balance Calculation Logic:
```javascript
// For each user, calculate:
// Total they paid - Their share of expenses = Net balance
// Positive = they should receive money
// Negative = they owe money
```

---

### Phase 6: Settlement System (Week 7)

#### Tasks:
1. Show "who owes whom" screen
2. Simple settlement recording (A paid B $X)
3. Mark expense splits as settled
4. Settlement history

#### Key Files:
- `src/screens/settlements/BalancesScreen.tsx`
- `src/screens/settlements/RecordSettlementScreen.tsx`
- `src/utils/settlementCalculator.ts`

---

### Phase 7: Polish & Testing (Week 8)

#### Tasks:
1. Improve UI/UX
2. Add loading states
3. Error handling
4. Test with friends
5. Fix bugs
6. Set up Firestore security rules

---

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Group members can read/write group data
    match /groups/{groupId} {
      allow read, write: if request.auth != null &&
                     request.auth.uid in resource.data.members;
    }

    // Expenses - only group members can access
    match /expenses/{expenseId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null &&
                               request.auth.uid == resource.data.createdBy;
    }

    // Settlements - only group members
    match /settlements/{settlementId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## Development Timeline Summary

| Phase | Duration | Focus |
|-------|----------|-------|
| 1 | Week 1 | Setup & Firebase |
| 2 | Week 2 | Authentication |
| 3 | Week 3 | Navigation & Dashboard |
| 4 | Week 4 | Groups |
| 5-6 | Week 5-6 | Expenses & Balances |
| 7 | Week 7 | Settlements |
| 8 | Week 8 | Polish & Testing |

**Total: ~8 weeks (2 months)**

---

## Estimated Costs

Since this is for personal use with friends:
- **Firebase Spark Plan (Free)**: Should be sufficient for 10-20 users
- Includes: 50K reads/day, 20K writes/day, 1GB storage
- Only upgrade to Blaze (pay-as-you-go) if you exceed free tier

---

## Optional Future Features

You can add these later if needed:
- Receipt image attachments
- Push notifications
- Recurring expenses (monthly rent)
- Expense categories with icons
- Dark mode
- Monthly summaries/reports
- QR code for quick group joining

---

## Getting Started

1. Follow Phase 1 to set up React Native project
2. Create Firebase project and configure
3. Build features phase by phase
4. Test with friends after Phase 6
5. Polish and deploy

## Helpful Resources

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Firebase Docs](https://firebase.google.com/docs)
- [React Navigation](https://reactnavigation.org/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [Zustand](https://github.com/pmndrs/zustand)

---

**Tip**: Start simple, get it working, then add features. Good luck!
