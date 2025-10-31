# Phase 3: Navigation & Dashboard - Comprehensive Plan

**Duration**: Week 3 (5-7 days)
**Goal**: Build the main app navigation structure and create the dashboard with balance overview

---

## Overview

This phase establishes the core navigation structure of the app with bottom tabs and creates the main dashboard that displays the user's overall balance, recent activities, and quick access to groups. This sets up the foundation for all future features.

---

## Prerequisites

**Must be completed from Phase 2:**
- ✅ Authentication system working
- ✅ User can login and signup
- ✅ Auth state management with Zustand
- ✅ Basic navigation structure in place

---

## Architecture Overview

### Navigation Structure
```
Root
└── Main (after auth)
    ├── Dashboard Tab (Home icon)
    ├── Groups Tab (Group icon)
    └── Profile Tab (Account icon)
```

### Dashboard Components Hierarchy
```
Dashboard Screen
├── Header (User greeting, balance summary)
├── Balance Card (Total balance across all groups)
├── Recent Activity List
└── Quick Actions (Add expense, Create group)
```

---

## Step-by-Step Tasks

### Task 3.1: Set Up Bottom Tab Navigation

**Duration**: 1-2 hours

#### Subtasks:

1. **Install Additional Dependencies (if not already installed)**
   ```bash
   npm install @react-navigation/bottom-tabs
   npm install react-native-vector-icons
   ```

2. **Update Navigation Types**

   **src/navigation/types.ts**:
   ```typescript
   export type AuthStackParamList = {
     Login: undefined;
     Signup: undefined;
     ForgotPassword: undefined;
   };

   export type MainTabParamList = {
     Dashboard: undefined;
     Groups: undefined;
     Profile: undefined;
   };

   export type GroupsStackParamList = {
     GroupsList: undefined;
     GroupDetails: { groupId: string };
     CreateGroup: undefined;
   };

   export type RootStackParamList = {
     Auth: undefined;
     Main: undefined;
   };
   ```

3. **Create Main Tab Navigator**

   **src/navigation/MainNavigator.tsx**:
   ```typescript
   import React from 'react';
   import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
   import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
   import { MainTabParamList } from './types';
   import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
   import { GroupsNavigator } from './GroupsNavigator';
   import { ProfileScreen } from '../screens/profile/ProfileScreen';
   import { COLORS } from '../constants';

   const Tab = createBottomTabNavigator<MainTabParamList>();

   export const MainNavigator: React.FC = () => {
     return (
       <Tab.Navigator
         screenOptions={{
           headerShown: false,
           tabBarActiveTintColor: COLORS.primary,
           tabBarInactiveTintColor: COLORS.dark,
           tabBarStyle: {
             paddingBottom: 8,
             paddingTop: 8,
             height: 60,
           },
         }}
       >
         <Tab.Screen
           name="Dashboard"
           component={DashboardScreen}
           options={{
             tabBarLabel: 'Home',
             tabBarIcon: ({ color, size }) => (
               <Icon name="home" size={size} color={color} />
             ),
           }}
         />
         <Tab.Screen
           name="Groups"
           component={GroupsNavigator}
           options={{
             tabBarLabel: 'Groups',
             tabBarIcon: ({ color, size }) => (
               <Icon name="account-group" size={size} color={color} />
             ),
           }}
         />
         <Tab.Screen
           name="Profile"
           component={ProfileScreen}
           options={{
             tabBarLabel: 'Profile',
             tabBarIcon: ({ color, size }) => (
               <Icon name="account" size={size} color={color} />
             ),
           }}
         />
       </Tab.Navigator>
     );
   };
   ```

4. **Create Groups Navigator (Placeholder)**

   **src/navigation/GroupsNavigator.tsx**:
   ```typescript
   import React from 'react';
   import { createStackNavigator } from '@react-navigation/stack';
   import { GroupsStackParamList } from './types';
   import { GroupsListScreen } from '../screens/groups/GroupsListScreen';
   import { COLORS } from '../constants';

   const Stack = createStackNavigator<GroupsStackParamList>();

   export const GroupsNavigator: React.FC = () => {
     return (
       <Stack.Navigator
         screenOptions={{
           headerStyle: {
             backgroundColor: COLORS.primary,
           },
           headerTintColor: COLORS.white,
           headerTitleStyle: {
             fontWeight: 'bold',
           },
         }}
       >
         <Stack.Screen
           name="GroupsList"
           component={GroupsListScreen}
           options={{ title: 'My Groups' }}
         />
       </Stack.Navigator>
     );
   };
   ```

#### Acceptance Criteria:
- [ ] Bottom tab navigation with 3 tabs
- [ ] Icons displayed for each tab
- [ ] Active/inactive states styled correctly
- [ ] Navigation between tabs works smoothly
- [ ] Groups tab has nested stack navigator

---

### Task 3.2: Create Dashboard Store

**Duration**: 1 hour

#### Subtasks:

1. **Create Dashboard Store for Balance Data**

   **src/store/dashboardStore.ts**:
   ```typescript
   import { create } from 'zustand';
   import { Balance } from '../types';

   interface DashboardState {
     totalBalance: number;
     balances: Balance[];
     recentActivity: any[];
     isLoading: boolean;
     error: string | null;

     // Actions
     setTotalBalance: (balance: number) => void;
     setBalances: (balances: Balance[]) => void;
     setRecentActivity: (activities: any[]) => void;
     setLoading: (loading: boolean) => void;
     setError: (error: string | null) => void;
   }

   export const useDashboardStore = create<DashboardState>((set) => ({
     totalBalance: 0,
     balances: [],
     recentActivity: [],
     isLoading: false,
     error: null,

     setTotalBalance: (balance) => set({ totalBalance: balance }),
     setBalances: (balances) => set({ balances }),
     setRecentActivity: (activities) => set({ recentActivity: activities }),
     setLoading: (loading) => set({ isLoading: loading }),
     setError: (error) => set({ error }),
   }));
   ```

2. **Create Groups Store**

   **src/store/groupsStore.ts**:
   ```typescript
   import { create } from 'zustand';
   import { Group } from '../types';

   interface GroupsState {
     groups: Group[];
     selectedGroup: Group | null;
     isLoading: boolean;
     error: string | null;

     // Actions
     setGroups: (groups: Group[]) => void;
     addGroup: (group: Group) => void;
     updateGroup: (groupId: string, updates: Partial<Group>) => void;
     removeGroup: (groupId: string) => void;
     setSelectedGroup: (group: Group | null) => void;
     setLoading: (loading: boolean) => void;
     setError: (error: string | null) => void;
   }

   export const useGroupsStore = create<GroupsState>((set) => ({
     groups: [],
     selectedGroup: null,
     isLoading: false,
     error: null,

     setGroups: (groups) => set({ groups }),

     addGroup: (group) => set((state) => ({
       groups: [group, ...state.groups],
     })),

     updateGroup: (groupId, updates) => set((state) => ({
       groups: state.groups.map((g) =>
         g.id === groupId ? { ...g, ...updates } : g
       ),
     })),

     removeGroup: (groupId) => set((state) => ({
       groups: state.groups.filter((g) => g.id !== groupId),
     })),

     setSelectedGroup: (group) => set({ selectedGroup: group }),
     setLoading: (loading) => set({ isLoading: loading }),
     setError: (error) => set({ error }),
   }));
   ```

#### Acceptance Criteria:
- [ ] Dashboard store manages balance and activity data
- [ ] Groups store manages groups list
- [ ] Type-safe store actions
- [ ] State updates immutably

---

### Task 3.3: Create Dashboard Screen

**Duration**: 3-4 hours

#### Subtasks:

1. **Create Balance Card Component**

   **src/components/dashboard/BalanceCard.tsx**:
   ```typescript
   import React from 'react';
   import { View, StyleSheet } from 'react-native';
   import { Card, Text } from 'react-native-paper';
   import { COLORS } from '../../constants';

   interface BalanceCardProps {
     totalBalance: number;
   }

   export const BalanceCard: React.FC<BalanceCardProps> = ({ totalBalance }) => {
     const isPositive = totalBalance >= 0;
     const balanceColor = isPositive ? COLORS.primary : COLORS.danger;

     return (
       <Card style={styles.card}>
         <Card.Content>
           <Text variant="titleMedium" style={styles.label}>
             Total Balance
           </Text>
           <Text
             variant="displayMedium"
             style={[styles.balance, { color: balanceColor }]}
           >
             {isPositive ? '+' : ''}${Math.abs(totalBalance).toFixed(2)}
           </Text>
           <Text variant="bodySmall" style={styles.subtitle}>
             {isPositive
               ? 'You are owed overall'
               : 'You owe overall'}
           </Text>
         </Card.Content>
       </Card>
     );
   };

   const styles = StyleSheet.create({
     card: {
       margin: 16,
       backgroundColor: COLORS.white,
       elevation: 4,
     },
     label: {
       color: COLORS.dark,
       opacity: 0.6,
       marginBottom: 8,
     },
     balance: {
       fontWeight: 'bold',
       marginBottom: 4,
     },
     subtitle: {
       color: COLORS.dark,
       opacity: 0.5,
     },
   });
   ```

2. **Create Recent Activity Item Component**

   **src/components/dashboard/ActivityItem.tsx**:
   ```typescript
   import React from 'react';
   import { View, StyleSheet } from 'react-native';
   import { List, Text } from 'react-native-paper';
   import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
   import { COLORS } from '../../constants';
   import { format } from 'date-fns';

   interface ActivityItemProps {
     title: string;
     subtitle: string;
     amount?: number;
     date: Date;
     type: 'expense' | 'settlement' | 'group';
   }

   export const ActivityItem: React.FC<ActivityItemProps> = ({
     title,
     subtitle,
     amount,
     date,
     type,
   }) => {
     const getIcon = () => {
       switch (type) {
         case 'expense':
           return 'cash-minus';
         case 'settlement':
           return 'cash-check';
         case 'group':
           return 'account-group';
         default:
           return 'information';
       }
     };

     return (
       <List.Item
         title={title}
         description={subtitle}
         left={(props) => (
           <Icon name={getIcon()} size={24} color={COLORS.primary} style={styles.icon} />
         )}
         right={() => (
           <View style={styles.rightContent}>
             {amount !== undefined && (
               <Text
                 variant="bodyMedium"
                 style={[
                   styles.amount,
                   { color: amount >= 0 ? COLORS.primary : COLORS.danger },
                 ]}
               >
                 {amount >= 0 ? '+' : ''}${Math.abs(amount).toFixed(2)}
               </Text>
             )}
             <Text variant="bodySmall" style={styles.date}>
               {format(date, 'MMM d')}
             </Text>
           </View>
         )}
         style={styles.item}
       />
     );
   };

   const styles = StyleSheet.create({
     item: {
       backgroundColor: COLORS.white,
       marginBottom: 1,
     },
     icon: {
       marginLeft: 8,
       marginTop: 8,
     },
     rightContent: {
       alignItems: 'flex-end',
       justifyContent: 'center',
       marginRight: 8,
     },
     amount: {
       fontWeight: 'bold',
     },
     date: {
       color: COLORS.dark,
       opacity: 0.5,
       marginTop: 2,
     },
   });
   ```

3. **Create Quick Actions Component**

   **src/components/dashboard/QuickActions.tsx**:
   ```typescript
   import React from 'react';
   import { View, StyleSheet } from 'react-native';
   import { Button } from 'react-native-paper';
   import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
   import { COLORS } from '../../constants';

   interface QuickActionsProps {
     onAddExpense: () => void;
     onCreateGroup: () => void;
   }

   export const QuickActions: React.FC<QuickActionsProps> = ({
     onAddExpense,
     onCreateGroup,
   }) => {
     return (
       <View style={styles.container}>
         <Button
           mode="contained"
           onPress={onAddExpense}
           icon={() => <Icon name="plus" size={20} color={COLORS.white} />}
           style={styles.button}
           contentStyle={styles.buttonContent}
         >
           Add Expense
         </Button>
         <Button
           mode="outlined"
           onPress={onCreateGroup}
           icon={() => <Icon name="account-group" size={20} color={COLORS.primary} />}
           style={styles.button}
           contentStyle={styles.buttonContent}
         >
           Create Group
         </Button>
       </View>
     );
   };

   const styles = StyleSheet.create({
     container: {
       flexDirection: 'row',
       paddingHorizontal: 16,
       paddingVertical: 8,
       gap: 12,
     },
     button: {
       flex: 1,
     },
     buttonContent: {
       paddingVertical: 8,
     },
   });
   ```

4. **Create Dashboard Screen**

   **src/screens/dashboard/DashboardScreen.tsx**:
   ```typescript
   import React, { useEffect } from 'react';
   import {
     View,
     StyleSheet,
     ScrollView,
     RefreshControl,
     Alert,
   } from 'react-native';
   import { Text, FAB, Divider } from 'react-native-paper';
   import { useAuth } from '../../hooks/useAuth';
   import { useDashboardStore } from '../../store/dashboardStore';
   import { BalanceCard } from '../../components/dashboard/BalanceCard';
   import { ActivityItem } from '../../components/dashboard/ActivityItem';
   import { QuickActions } from '../../components/dashboard/QuickActions';
   import { Loading } from '../../components/common/Loading';
   import { COLORS } from '../../constants';

   export const DashboardScreen: React.FC = () => {
     const { user } = useAuth();
     const {
       totalBalance,
       recentActivity,
       isLoading,
       setTotalBalance,
       setRecentActivity,
       setLoading,
     } = useDashboardStore();

     const [refreshing, setRefreshing] = React.useState(false);

     useEffect(() => {
       loadDashboardData();
     }, []);

     const loadDashboardData = async () => {
       try {
         setLoading(true);
         // TODO: Fetch real data from Firestore in later phases
         // For now, using mock data
         setTotalBalance(0);
         setRecentActivity([]);
         setLoading(false);
       } catch (error: any) {
         setLoading(false);
         Alert.alert('Error', 'Failed to load dashboard data');
       }
     };

     const onRefresh = async () => {
       setRefreshing(true);
       await loadDashboardData();
       setRefreshing(false);
     };

     const handleAddExpense = () => {
       Alert.alert('Coming Soon', 'Add expense feature will be available in Phase 5');
     };

     const handleCreateGroup = () => {
       Alert.alert('Coming Soon', 'Create group feature will be available in Phase 4');
     };

     if (isLoading && !refreshing) {
       return <Loading />;
     }

     return (
       <View style={styles.container}>
         <View style={styles.header}>
           <Text variant="headlineMedium" style={styles.greeting}>
             Hello, {user?.displayName?.split(' ')[0] || 'there'}! 👋
           </Text>
           <Text variant="bodyMedium" style={styles.subtitle}>
             Here's your expense summary
           </Text>
         </View>

         <ScrollView
           style={styles.content}
           refreshControl={
             <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
           }
         >
           <BalanceCard totalBalance={totalBalance} />

           <QuickActions
             onAddExpense={handleAddExpense}
             onCreateGroup={handleCreateGroup}
           />

           <View style={styles.section}>
             <Text variant="titleMedium" style={styles.sectionTitle}>
               Recent Activity
             </Text>
             {recentActivity.length === 0 ? (
               <View style={styles.emptyState}>
                 <Text variant="bodyLarge" style={styles.emptyText}>
                   No recent activity
                 </Text>
                 <Text variant="bodyMedium" style={styles.emptySubtext}>
                   Create a group and add expenses to get started
                 </Text>
               </View>
             ) : (
               recentActivity.map((activity, index) => (
                 <ActivityItem key={index} {...activity} />
               ))
             )}
           </View>
         </ScrollView>
       </View>
     );
   };

   const styles = StyleSheet.create({
     container: {
       flex: 1,
       backgroundColor: COLORS.background,
     },
     header: {
       backgroundColor: COLORS.primary,
       paddingTop: 60,
       paddingBottom: 24,
       paddingHorizontal: 20,
     },
     greeting: {
       color: COLORS.white,
       fontWeight: 'bold',
       marginBottom: 4,
     },
     subtitle: {
       color: COLORS.white,
       opacity: 0.9,
     },
     content: {
       flex: 1,
     },
     section: {
       marginTop: 16,
       paddingBottom: 24,
     },
     sectionTitle: {
       paddingHorizontal: 16,
       marginBottom: 12,
       fontWeight: 'bold',
     },
     emptyState: {
       alignItems: 'center',
       paddingVertical: 48,
       paddingHorizontal: 32,
     },
     emptyText: {
       color: COLORS.dark,
       marginBottom: 8,
       textAlign: 'center',
     },
     emptySubtext: {
       color: COLORS.dark,
       opacity: 0.6,
       textAlign: 'center',
     },
   });
   ```

#### Acceptance Criteria:
- [ ] Dashboard screen displays user greeting
- [ ] Balance card shows total balance (mock data for now)
- [ ] Quick action buttons for add expense and create group
- [ ] Recent activity section (empty state for now)
- [ ] Pull-to-refresh functionality
- [ ] Loading state while fetching data
- [ ] Clean, professional UI design

---

### Task 3.4: Create Groups List Screen

**Duration**: 2 hours

#### Subtasks:

1. **Create Group Card Component**

   **src/components/groups/GroupCard.tsx**:
   ```typescript
   import React from 'react';
   import { StyleSheet, TouchableOpacity, View } from 'react-native';
   import { Card, Text, Avatar } from 'react-native-paper';
   import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
   import { COLORS } from '../../constants';
   import { Group } from '../../types';

   interface GroupCardProps {
     group: Group;
     balance?: number;
     onPress: () => void;
   }

   export const GroupCard: React.FC<GroupCardProps> = ({
     group,
     balance = 0,
     onPress,
   }) => {
     const isPositive = balance >= 0;
     const balanceColor = balance === 0 ? COLORS.dark : isPositive ? COLORS.primary : COLORS.danger;

     return (
       <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
         <Card style={styles.card}>
           <Card.Content style={styles.content}>
             <View style={styles.leftContent}>
               <Avatar.Icon
                 size={48}
                 icon="account-group"
                 style={styles.avatar}
               />
               <View style={styles.info}>
                 <Text variant="titleMedium" style={styles.name}>
                   {group.name}
                 </Text>
                 <Text variant="bodySmall" style={styles.members}>
                   {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                 </Text>
               </View>
             </View>

             <View style={styles.rightContent}>
               {balance !== 0 && (
                 <Text
                   variant="titleMedium"
                   style={[styles.balance, { color: balanceColor }]}
                 >
                   {isPositive ? '+' : ''}${Math.abs(balance).toFixed(2)}
                 </Text>
               )}
               {balance === 0 && (
                 <Text variant="bodyMedium" style={styles.settled}>
                   Settled up
                 </Text>
               )}
               <Icon name="chevron-right" size={24} color={COLORS.dark} style={styles.chevron} />
             </View>
           </Card.Content>
         </Card>
       </TouchableOpacity>
     );
   };

   const styles = StyleSheet.create({
     card: {
       marginHorizontal: 16,
       marginBottom: 12,
       backgroundColor: COLORS.white,
       elevation: 2,
     },
     content: {
       flexDirection: 'row',
       justifyContent: 'space-between',
       alignItems: 'center',
       paddingVertical: 8,
     },
     leftContent: {
       flexDirection: 'row',
       alignItems: 'center',
       flex: 1,
     },
     avatar: {
       backgroundColor: COLORS.primary,
     },
     info: {
       marginLeft: 12,
       flex: 1,
     },
     name: {
       fontWeight: 'bold',
       marginBottom: 4,
     },
     members: {
       color: COLORS.dark,
       opacity: 0.6,
     },
     rightContent: {
       flexDirection: 'row',
       alignItems: 'center',
       gap: 4,
     },
     balance: {
       fontWeight: 'bold',
     },
     settled: {
       color: COLORS.dark,
       opacity: 0.6,
     },
     chevron: {
       opacity: 0.4,
     },
   });
   ```

2. **Create Groups List Screen**

   **src/screens/groups/GroupsListScreen.tsx**:
   ```typescript
   import React, { useEffect } from 'react';
   import {
     View,
     StyleSheet,
     FlatList,
     RefreshControl,
     Alert,
   } from 'react-native';
   import { Text, FAB } from 'react-native-paper';
   import { useNavigation } from '@react-navigation/native';
   import { NativeStackNavigationProp } from '@react-navigation/native-stack';
   import { GroupsStackParamList } from '../../navigation/types';
   import { useGroupsStore } from '../../store/groupsStore';
   import { GroupCard } from '../../components/groups/GroupCard';
   import { Loading } from '../../components/common/Loading';
   import { COLORS } from '../../constants';

   type GroupsListNavigationProp = NativeStackNavigationProp<
     GroupsStackParamList,
     'GroupsList'
   >;

   export const GroupsListScreen: React.FC = () => {
     const navigation = useNavigation<GroupsListNavigationProp>();
     const { groups, isLoading, setGroups, setLoading } = useGroupsStore();
     const [refreshing, setRefreshing] = React.useState(false);

     useEffect(() => {
       loadGroups();
     }, []);

     const loadGroups = async () => {
       try {
         setLoading(true);
         // TODO: Fetch real groups from Firestore in Phase 4
         // For now, using empty array
         setGroups([]);
         setLoading(false);
       } catch (error: any) {
         setLoading(false);
         Alert.alert('Error', 'Failed to load groups');
       }
     };

     const onRefresh = async () => {
       setRefreshing(true);
       await loadGroups();
       setRefreshing(false);
     };

     const handleGroupPress = (groupId: string) => {
       Alert.alert('Coming Soon', 'Group details will be available in Phase 4');
     };

     const handleCreateGroup = () => {
       Alert.alert('Coming Soon', 'Create group feature will be available in Phase 4');
     };

     if (isLoading && !refreshing) {
       return <Loading />;
     }

     return (
       <View style={styles.container}>
         <FlatList
           data={groups}
           keyExtractor={(item) => item.id}
           renderItem={({ item }) => (
             <GroupCard
               group={item}
               onPress={() => handleGroupPress(item.id)}
             />
           )}
           contentContainerStyle={
             groups.length === 0 ? styles.emptyContainer : styles.listContent
           }
           ListEmptyComponent={
             <View style={styles.emptyState}>
               <Text variant="headlineSmall" style={styles.emptyTitle}>
                 No Groups Yet
               </Text>
               <Text variant="bodyLarge" style={styles.emptyText}>
                 Create your first group to start splitting expenses with friends
               </Text>
             </View>
           }
           refreshControl={
             <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
           }
         />

         <FAB
           icon="plus"
           style={styles.fab}
           onPress={handleCreateGroup}
         />
       </View>
     );
   };

   const styles = StyleSheet.create({
     container: {
       flex: 1,
       backgroundColor: COLORS.background,
     },
     listContent: {
       paddingTop: 16,
       paddingBottom: 80,
     },
     emptyContainer: {
       flex: 1,
       justifyContent: 'center',
       alignItems: 'center',
     },
     emptyState: {
       alignItems: 'center',
       paddingHorizontal: 32,
     },
     emptyTitle: {
       fontWeight: 'bold',
       marginBottom: 12,
       color: COLORS.dark,
     },
     emptyText: {
       textAlign: 'center',
       color: COLORS.dark,
       opacity: 0.6,
       lineHeight: 24,
     },
     fab: {
       position: 'absolute',
       margin: 16,
       right: 0,
       bottom: 0,
       backgroundColor: COLORS.primary,
     },
   });
   ```

#### Acceptance Criteria:
- [ ] Groups list screen displays empty state
- [ ] FAB button for creating new group
- [ ] Pull-to-refresh functionality
- [ ] Loading state
- [ ] Group card component reusable
- [ ] Navigation ready for group details

---

### Task 3.5: Create Profile Screen

**Duration**: 2 hours

#### Subtasks:

1. **Create Profile Screen**

   **src/screens/profile/ProfileScreen.tsx**:
   ```typescript
   import React, { useState } from 'react';
   import {
     View,
     StyleSheet,
     ScrollView,
     Image,
     Alert,
     TouchableOpacity,
   } from 'react-native';
   import { Text, Button, List, Divider, Avatar } from 'react-native-paper';
   import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
   import { useAuth } from '../../hooks/useAuth';
   import { COLORS } from '../../constants';
   import { launchImageLibrary } from 'react-native-image-picker';

   export const ProfileScreen: React.FC = () => {
     const { user, signOut } = useAuth();
     const [isLoading, setIsLoading] = useState(false);

     const handleSignOut = async () => {
       Alert.alert(
         'Sign Out',
         'Are you sure you want to sign out?',
         [
           { text: 'Cancel', style: 'cancel' },
           {
             text: 'Sign Out',
             style: 'destructive',
             onPress: async () => {
               try {
                 setIsLoading(true);
                 await signOut();
               } catch (error: any) {
                 Alert.alert('Error', error.message);
               } finally {
                 setIsLoading(false);
               }
             },
           },
         ]
       );
     };

     const handleEditProfile = () => {
       Alert.alert('Coming Soon', 'Edit profile feature will be available soon');
     };

     const handleChangePhoto = async () => {
       // TODO: Implement photo upload in later phases
       Alert.alert('Coming Soon', 'Photo upload will be available soon');
     };

     return (
       <ScrollView style={styles.container}>
         <View style={styles.header}>
           <TouchableOpacity onPress={handleChangePhoto}>
             {user?.photoURL ? (
               <Image source={{ uri: user.photoURL }} style={styles.avatar} />
             ) : (
               <Avatar.Text
                 size={80}
                 label={user?.displayName?.charAt(0).toUpperCase() || 'U'}
                 style={styles.avatarPlaceholder}
               />
             )}
             <View style={styles.cameraIcon}>
               <Icon name="camera" size={20} color={COLORS.white} />
             </View>
           </TouchableOpacity>

           <Text variant="headlineSmall" style={styles.name}>
             {user?.displayName}
           </Text>
           <Text variant="bodyMedium" style={styles.email}>
             {user?.email}
           </Text>

           <Button
             mode="outlined"
             onPress={handleEditProfile}
             style={styles.editButton}
             icon="pencil"
           >
             Edit Profile
           </Button>
         </View>

         <View style={styles.section}>
           <Text variant="titleMedium" style={styles.sectionTitle}>
             Settings
           </Text>

           <List.Item
             title="Notifications"
             description="Manage notification preferences"
             left={(props) => <List.Icon {...props} icon="bell" />}
             right={(props) => <List.Icon {...props} icon="chevron-right" />}
             onPress={() => Alert.alert('Coming Soon', 'Notifications settings')}
           />

           <Divider />

           <List.Item
             title="Currency"
             description="USD ($)"
             left={(props) => <List.Icon {...props} icon="currency-usd" />}
             right={(props) => <List.Icon {...props} icon="chevron-right" />}
             onPress={() => Alert.alert('Coming Soon', 'Currency settings')}
           />

           <Divider />

           <List.Item
             title="Privacy"
             description="Privacy and security settings"
             left={(props) => <List.Icon {...props} icon="shield-account" />}
             right={(props) => <List.Icon {...props} icon="chevron-right" />}
             onPress={() => Alert.alert('Coming Soon', 'Privacy settings')}
           />
         </View>

         <View style={styles.section}>
           <Text variant="titleMedium" style={styles.sectionTitle}>
             About
           </Text>

           <List.Item
             title="Help & Support"
             left={(props) => <List.Icon {...props} icon="help-circle" />}
             right={(props) => <List.Icon {...props} icon="chevron-right" />}
             onPress={() => Alert.alert('Coming Soon', 'Help & Support')}
           />

           <Divider />

           <List.Item
             title="Terms of Service"
             left={(props) => <List.Icon {...props} icon="file-document" />}
             right={(props) => <List.Icon {...props} icon="chevron-right" />}
             onPress={() => Alert.alert('Coming Soon', 'Terms of Service')}
           />

           <Divider />

           <List.Item
             title="Privacy Policy"
             left={(props) => <List.Icon {...props} icon="shield-check" />}
             right={(props) => <List.Icon {...props} icon="chevron-right" />}
             onPress={() => Alert.alert('Coming Soon', 'Privacy Policy')}
           />

           <Divider />

           <List.Item
             title="App Version"
             description="1.0.0"
             left={(props) => <List.Icon {...props} icon="information" />}
           />
         </View>

         <Button
           mode="contained"
           onPress={handleSignOut}
           loading={isLoading}
           disabled={isLoading}
           style={styles.signOutButton}
           buttonColor={COLORS.danger}
           icon="logout"
         >
           Sign Out
         </Button>

         <View style={styles.footer} />
       </ScrollView>
     );
   };

   const styles = StyleSheet.create({
     container: {
       flex: 1,
       backgroundColor: COLORS.background,
     },
     header: {
       alignItems: 'center',
       paddingTop: 40,
       paddingBottom: 24,
       backgroundColor: COLORS.white,
       marginBottom: 16,
     },
     avatar: {
       width: 80,
       height: 80,
       borderRadius: 40,
     },
     avatarPlaceholder: {
       backgroundColor: COLORS.primary,
     },
     cameraIcon: {
       position: 'absolute',
       bottom: 0,
       right: 0,
       backgroundColor: COLORS.primary,
       borderRadius: 15,
       width: 30,
       height: 30,
       justifyContent: 'center',
       alignItems: 'center',
     },
     name: {
       marginTop: 16,
       fontWeight: 'bold',
     },
     email: {
       color: COLORS.dark,
       opacity: 0.6,
       marginTop: 4,
     },
     editButton: {
       marginTop: 16,
     },
     section: {
       backgroundColor: COLORS.white,
       marginBottom: 16,
       paddingVertical: 8,
     },
     sectionTitle: {
       paddingHorizontal: 16,
       paddingVertical: 12,
       fontWeight: 'bold',
       color: COLORS.dark,
       opacity: 0.7,
     },
     signOutButton: {
       marginHorizontal: 16,
       marginVertical: 24,
       paddingVertical: 6,
     },
     footer: {
       height: 40,
     },
   });
   ```

#### Acceptance Criteria:
- [ ] Profile screen displays user information
- [ ] Avatar with placeholder if no photo
- [ ] Edit profile button (placeholder)
- [ ] Settings section with menu items
- [ ] About section with app info
- [ ] Sign out button with confirmation
- [ ] Loading state during sign out

---

### Task 3.6: Update Theme & Styling

**Duration**: 1 hour

#### Subtasks:

1. **Create Theme Configuration**

   **src/config/theme.ts**:
   ```typescript
   import { MD3LightTheme } from 'react-native-paper';
   import { COLORS } from '../constants';

   export const theme = {
     ...MD3LightTheme,
     colors: {
       ...MD3LightTheme.colors,
       primary: COLORS.primary,
       secondary: COLORS.secondary,
       error: COLORS.danger,
       background: COLORS.background,
       surface: COLORS.white,
     },
     roundness: 8,
   };
   ```

2. **Update App.tsx with Theme**

   **App.tsx**:
   ```typescript
   import React from 'react';
   import { StatusBar } from 'react-native';
   import { Provider as PaperProvider } from 'react-native-paper';
   import { RootNavigator } from './src/navigation/RootNavigator';
   import { theme } from './src/config/theme';
   import { COLORS } from './src/constants';

   const App: React.FC = () => {
     return (
       <PaperProvider theme={theme}>
         <StatusBar
           barStyle="light-content"
           backgroundColor={COLORS.primary}
         />
         <RootNavigator />
       </PaperProvider>
     );
   };

   export default App;
   ```

#### Acceptance Criteria:
- [ ] Consistent theme across app
- [ ] Status bar styled appropriately
- [ ] Color scheme matches design

---

## Testing & Verification

### Manual Testing Checklist

**Navigation:**
- [ ] Bottom tabs switch between screens
- [ ] Tab icons change color when active
- [ ] Navigation state persists when switching tabs
- [ ] Back button works correctly in nested navigators

**Dashboard:**
- [ ] Greeting displays user's first name
- [ ] Balance card shows $0.00 initially
- [ ] Quick actions buttons are tappable
- [ ] Empty state shows for recent activity
- [ ] Pull-to-refresh works

**Groups:**
- [ ] Empty state displays correctly
- [ ] FAB button is visible
- [ ] Pull-to-refresh works

**Profile:**
- [ ] User info displays correctly
- [ ] Avatar shows user's initial
- [ ] Settings menu items are tappable
- [ ] Sign out requires confirmation
- [ ] Sign out redirects to login screen

### Integration Tests

```typescript
// To be implemented in Phase 7

describe('Navigation', () => {
  it('should navigate between tabs', () => {});
  it('should show correct screen content', () => {});
});

describe('Dashboard', () => {
  it('should display user greeting', () => {});
  it('should show balance card', () => {});
});
```

---

## Common Issues & Troubleshooting

### Issue 1: Bottom Tab Icons Not Showing
**Solution:**
- Run `cd ios && pod install && cd ..`
- Rebuild the app
- Verify react-native-vector-icons is linked

### Issue 2: Navigation State Lost
**Solution:**
- Check NavigationContainer is at root level
- Verify auth state observer in useAuth

### Issue 3: Pull-to-Refresh Not Working on iOS
**Solution:**
- Ensure RefreshControl is inside ScrollView/FlatList
- Check onRefresh function is async

---

## Success Criteria

Phase 3 is complete when:

1. ✅ Bottom tab navigation with 3 tabs working
2. ✅ Dashboard screen displays greeting and balance
3. ✅ Dashboard has quick action buttons
4. ✅ Recent activity section (empty state)
5. ✅ Groups list screen with empty state
6. ✅ FAB button for creating groups
7. ✅ Profile screen displays user info
8. ✅ Profile has settings menu items
9. ✅ Sign out functionality working
10. ✅ Pull-to-refresh on all list screens
11. ✅ Consistent theme and styling
12. ✅ Clean, professional UI

---

## Handoff to Phase 4

**What's Ready:**
- Complete navigation structure
- Dashboard with balance display
- Groups list screen ready for data
- Profile screen with user management
- Stores for dashboard and groups data
- UI components for displaying data

**Next Phase:** Phase 4 will implement group management - creating groups, adding members, viewing group details, and managing group memberships.

---

## Estimated Time Breakdown

| Task | Estimated Time |
|------|---------------|
| 3.1 Bottom Tab Navigation | 1-2 hours |
| 3.2 Dashboard Store | 1 hour |
| 3.3 Dashboard Screen | 3-4 hours |
| 3.4 Groups List Screen | 2 hours |
| 3.5 Profile Screen | 2 hours |
| 3.6 Theme & Styling | 1 hour |
| Testing & Bug Fixes | 2 hours |
| **Total** | **12-14 hours** |

Can be completed in 1.5-2 working days or spread across a week working part-time.
