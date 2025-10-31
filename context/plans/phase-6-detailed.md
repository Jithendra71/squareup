# Phase 6: Settlement System - Comprehensive Plan

**Duration**: Week 7 (5-7 days)
**Goal**: Implement settlement tracking to record when members pay each other back

---

## Overview

The settlement system allows users to record when debts are paid off. It shows simplified "who owes whom" calculations and lets users mark payments as settled, which updates balances accordingly.

---

## Prerequisites

**Must be completed from Phase 5:**
- ✅ Expenses system working
- ✅ Balance calculation implemented
- ✅ Group balances displaying correctly

---

## Architecture Overview

### Settlement Flow
```
View Balances → See Who Owes Whom → Record Settlement → Update Balances
```

### Settlement Impact
```
Before: User A owes User B $50
Record Settlement: A paid B $50
After: Balance cleared for this payment
```

---

## Step-by-Step Tasks

### Task 6.1: Create Settlement Types & Store

**Duration**: 1 hour

#### Subtasks:

1. **Add Settlement Types**

   **src/types/index.ts** (add):
   ```typescript
   export interface Settlement {
     id: string;
     groupId: string;
     fromUserId: string;
     fromUserName: string;
     toUserId: string;
     toUserName: string;
     amount: number;
     note?: string;
     createdBy: string;
     createdAt: Date;
   }
   ```

2. **Create Settlements Store**

   **src/store/settlementsStore.ts**:
   ```typescript
   import { create } from 'zustand';
   import { Settlement } from '../types';

   interface SettlementsState {
     settlements: Map<string, Settlement[]>; // groupId -> settlements[]
     isLoading: boolean;
     error: string | null;

     setSettlements: (groupId: string, settlements: Settlement[]) => void;
     addSettlement: (groupId: string, settlement: Settlement) => void;
     getGroupSettlements: (groupId: string) => Settlement[];
     setLoading: (loading: boolean) => void;
     setError: (error: string | null) => void;
   }

   export const useSettlementsStore = create<SettlementsState>((set, get) => ({
     settlements: new Map(),
     isLoading: false,
     error: null,

     setSettlements: (groupId, settlements) =>
       set((state) => {
         const newSettlements = new Map(state.settlements);
         newSettlements.set(groupId, settlements);
         return { settlements: newSettlements };
       }),

     addSettlement: (groupId, settlement) =>
       set((state) => {
         const newSettlements = new Map(state.settlements);
         const groupSettlements = newSettlements.get(groupId) || [];
         newSettlements.set(groupId, [settlement, ...groupSettlements]);
         return { settlements: newSettlements };
       }),

     getGroupSettlements: (groupId) => {
       const state = get();
       return state.settlements.get(groupId) || [];
     },

     setLoading: (loading) => set({ isLoading: loading }),
     setError: (error) => set({ error }),
   }));
   ```

---

### Task 6.2: Create Settlements Firebase Service

**Duration**: 1-2 hours

#### Subtasks:

1. **Create Settlements Service**

   **src/services/firebase/settlements.ts**:
   ```typescript
   import { firestore } from '../../config/firebase';
   import { Settlement } from '../../types';

   export const settlementsService = {
     /**
      * Create a settlement record
      */
     async createSettlement(settlement: Omit<Settlement, 'id'>): Promise<Settlement> {
       try {
         const docRef = await firestore().collection('settlements').add({
           ...settlement,
           createdAt: firestore.FieldValue.serverTimestamp(),
         });

         return {
           ...settlement,
           id: docRef.id,
         };
       } catch (error: any) {
         console.error('Error creating settlement:', error);
         throw new Error('Failed to record settlement');
       }
     },

     /**
      * Get settlements for a group
      */
     async getGroupSettlements(groupId: string): Promise<Settlement[]> {
       try {
         const snapshot = await firestore()
           .collection('settlements')
           .where('groupId', '==', groupId)
           .orderBy('createdAt', 'desc')
           .get();

         return snapshot.docs.map((doc) => {
           const data = doc.data();
           return {
             id: doc.id,
             groupId: data.groupId,
             fromUserId: data.fromUserId,
             fromUserName: data.fromUserName,
             toUserId: data.toUserId,
             toUserName: data.toUserName,
             amount: data.amount,
             note: data.note,
             createdBy: data.createdBy,
             createdAt: data.createdAt?.toDate() || new Date(),
           };
         });
       } catch (error: any) {
         console.error('Error fetching settlements:', error);
         throw new Error('Failed to fetch settlements');
       }
     },

     /**
      * Listen to group settlements (real-time)
      */
     subscribeToGroupSettlements(groupId: string, callback: (settlements: Settlement[]) => void) {
       return firestore()
         .collection('settlements')
         .where('groupId', '==', groupId)
         .orderBy('createdAt', 'desc')
         .onSnapshot(
           (snapshot) => {
             const settlements = snapshot.docs.map((doc) => {
               const data = doc.data();
               return {
                 id: doc.id,
                 groupId: data.groupId,
                 fromUserId: data.fromUserId,
                 fromUserName: data.fromUserName,
                 toUserId: data.toUserId,
                 toUserName: data.toUserName,
                 amount: data.amount,
                 note: data.note,
                 createdBy: data.createdBy,
                 createdAt: data.createdAt?.toDate() || new Date(),
               };
             });
             callback(settlements);
           },
           (error) => {
             console.error('Error listening to settlements:', error);
             callback([]);
           }
         );
     },
   };
   ```

---

### Task 6.3: Create Balances Screen

**Duration**: 3-4 hours

#### Subtasks:

1. **Create Balance Item Component**

   **src/components/settlements/BalanceItem.tsx**:
   ```typescript
   import React from 'react';
   import { View, StyleSheet } from 'react-native';
   import { List, Text, Button } from 'react-native-paper';
   import { GroupBalance } from '../../types';
   import { COLORS } from '../../constants';

   interface BalanceItemProps {
     balance: GroupBalance;
     currentUserId: string;
     onSettle: () => void;
   }

   export const BalanceItem: React.FC<BalanceItemProps> = ({
     balance,
     currentUserId,
     onSettle,
   }) => {
     const isCurrentUser = balance.userId === currentUserId;
     const isPositive = balance.balance > 0.01;
     const isNegative = balance.balance < -0.01;
     const isSettled = Math.abs(balance.balance) < 0.01;

     if (isSettled) return null;

     let description = '';
     let color = COLORS.dark;

     if (isPositive) {
       description = 'owes you';
       color = COLORS.primary;
     } else if (isNegative) {
       description = 'you owe';
       color = COLORS.danger;
     }

     return (
       <List.Item
         title={balance.displayName}
         description={description}
         right={() => (
           <View style={styles.rightContent}>
             <Text variant="titleMedium" style={[styles.amount, { color }]}>
               ${Math.abs(balance.balance).toFixed(2)}
             </Text>
             {isNegative && (
               <Button mode="contained-tonal" onPress={onSettle} compact>
                 Settle
               </Button>
             )}
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
     rightContent: {
       flexDirection: 'column',
       alignItems: 'flex-end',
       justifyContent: 'center',
       marginRight: 8,
       gap: 8,
     },
     amount: {
       fontWeight: 'bold',
     },
   });
   ```

2. **Create Balances Screen**

   **src/screens/settlements/BalancesScreen.tsx**:
   ```typescript
   import React, { useEffect, useState } from 'react';
   import { View, StyleSheet, ScrollView, Alert } from 'react-native';
   import { Text, Divider } from 'react-native-paper';
   import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
   import { NativeStackNavigationProp } from '@react-navigation/native-stack';
   import { GroupsStackParamList } from '../../navigation/types';
   import { useGroup } from '../../hooks/useGroup';
   import { useExpensesStore } from '../../store/expensesStore';
   import { useAuthStore } from '../../store/authStore';
   import { BalanceCalculator } from '../../utils/balanceCalculator';
   import { BalanceItem } from '../../components/settlements/BalanceItem';
   import { GroupBalance } from '../../types';
   import { COLORS } from '../../constants';
   import { Loading } from '../../components/common/Loading';

   type BalancesRouteProp = RouteProp<GroupsStackParamList, 'Balances'>;
   type BalancesNavigationProp = NativeStackNavigationProp<GroupsStackParamList, 'Balances'>;

   export const BalancesScreen: React.FC = () => {
     const route = useRoute<BalancesRouteProp>();
     const navigation = useNavigation<BalancesNavigationProp>();
     const { groupId } = route.params;
     const { group, isLoading } = useGroup(groupId);
     const { user } = useAuthStore();
     const { getGroupExpenses } = useExpensesStore();
     const [balances, setBalances] = useState<GroupBalance[]>([]);

     const expenses = getGroupExpenses(groupId);

     useEffect(() => {
       if (group && expenses) {
         const memberNames = new Map(
           group.memberDetails.map((m) => [m.userId, m.displayName])
         );
         const calculated = BalanceCalculator.calculateGroupBalances(
           expenses,
           group.members,
           memberNames
         );
         setBalances(calculated);
       }
     }, [group, expenses]);

     const handleSettle = (toUserId: string, amount: number) => {
       const toUser = group?.memberDetails.find((m) => m.userId === toUserId);
       if (!toUser) return;

       navigation.navigate('RecordSettlement', {
         groupId,
         fromUserId: user!.id,
         toUserId,
         toUserName: toUser.displayName,
         suggestedAmount: amount,
       });
     };

     const getTotalBalance = () => {
       const userBalance = balances.find((b) => b.userId === user?.id);
       return userBalance?.balance || 0;
     };

     if (isLoading) return <Loading />;

     const totalBalance = getTotalBalance();
     const youOwe = balances.filter((b) => b.userId !== user?.id && b.balance > 0.01);
     const owesYou = balances.filter((b) => b.userId !== user?.id && b.balance < -0.01);

     return (
       <ScrollView style={styles.container}>
         <View style={styles.header}>
           <Text variant="bodyLarge" style={styles.headerLabel}>
             Your Balance
           </Text>
           <Text
             variant="displaySmall"
             style={[
               styles.totalBalance,
               { color: totalBalance >= 0 ? COLORS.primary : COLORS.danger },
             ]}
           >
             {totalBalance >= 0 ? '+' : ''}${Math.abs(totalBalance).toFixed(2)}
           </Text>
           <Text variant="bodyMedium" style={styles.headerSubtext}>
             {totalBalance >= 0 ? 'You are owed overall' : 'You owe overall'}
           </Text>
         </View>

         {youOwe.length > 0 && (
           <View style={styles.section}>
             <Text variant="titleMedium" style={styles.sectionTitle}>
               You Owe
             </Text>
             {youOwe.map((balance) => (
               <BalanceItem
                 key={balance.userId}
                 balance={balance}
                 currentUserId={user!.id}
                 onSettle={() => handleSettle(balance.userId, Math.abs(balance.balance))}
               />
             ))}
           </View>
         )}

         {owesYou.length > 0 && (
           <View style={styles.section}>
             <Text variant="titleMedium" style={styles.sectionTitle}>
               Owes You
             </Text>
             {owesYou.map((balance) => (
               <BalanceItem
                 key={balance.userId}
                 balance={balance}
                 currentUserId={user!.id}
                 onSettle={() => {}}
               />
             ))}
           </View>
         )}

         {youOwe.length === 0 && owesYou.length === 0 && (
           <View style={styles.emptyState}>
             <Text variant="headlineSmall" style={styles.emptyTitle}>
               All Settled Up! ✨
             </Text>
             <Text variant="bodyLarge" style={styles.emptyText}>
               No outstanding balances in this group
             </Text>
           </View>
         )}
       </ScrollView>
     );
   };

   const styles = StyleSheet.create({
     container: {
       flex: 1,
       backgroundColor: COLORS.background,
     },
     header: {
       backgroundColor: COLORS.white,
       padding: 24,
       alignItems: 'center',
       marginBottom: 16,
     },
     headerLabel: {
       color: COLORS.dark,
       opacity: 0.6,
       marginBottom: 8,
     },
     totalBalance: {
       fontWeight: 'bold',
       marginBottom: 4,
     },
     headerSubtext: {
       color: COLORS.dark,
       opacity: 0.6,
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
     },
     emptyState: {
       alignItems: 'center',
       paddingVertical: 64,
       paddingHorizontal: 32,
     },
     emptyTitle: {
       fontWeight: 'bold',
       marginBottom: 12,
       textAlign: 'center',
     },
     emptyText: {
       color: COLORS.dark,
       opacity: 0.6,
       textAlign: 'center',
     },
   });
   ```

---

### Task 6.4: Create Record Settlement Screen

**Duration**: 2-3 hours

#### Subtasks:

1. **Create Record Settlement Screen**

   **src/screens/settlements/RecordSettlementScreen.tsx**:
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
   import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
   import { useAuthStore } from '../../store/authStore';
   import { useSettlementsStore } from '../../store/settlementsStore';
   import { settlementsService } from '../../services/firebase/settlements';
   import { COLORS } from '../../constants';

   type RecordSettlementRouteProp = RouteProp<any, 'RecordSettlement'>;

   export const RecordSettlementScreen: React.FC = () => {
     const route = useRoute<RecordSettlementRouteProp>();
     const navigation = useNavigation();
     const { groupId, fromUserId, toUserId, toUserName, suggestedAmount } = route.params;
     const { user } = useAuthStore();
     const { addSettlement } = useSettlementsStore();

     const [amount, setAmount] = useState(suggestedAmount?.toFixed(2) || '');
     const [note, setNote] = useState('');
     const [isLoading, setIsLoading] = useState(false);

     const handleSubmit = async () => {
       const numAmount = parseFloat(amount);
       if (isNaN(numAmount) || numAmount <= 0) {
         Alert.alert('Error', 'Please enter a valid amount');
         return;
       }

       try {
         setIsLoading(true);

         const settlement = {
           groupId,
           fromUserId,
           fromUserName: user!.displayName,
           toUserId,
           toUserName,
           amount: numAmount,
           note: note.trim(),
           createdBy: user!.id,
           createdAt: new Date(),
         };

         const created = await settlementsService.createSettlement(settlement);
         addSettlement(groupId, created);

         Alert.alert('Success', `Payment of $${numAmount.toFixed(2)} recorded!`, [
           {
             text: 'OK',
             onPress: () => navigation.goBack(),
           },
         ]);
       } catch (error: any) {
         Alert.alert('Error', error.message);
       } finally {
         setIsLoading(false);
       }
     };

     return (
       <KeyboardAvoidingView
         style={styles.container}
         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
       >
         <View style={styles.content}>
           <View style={styles.header}>
             <Text variant="headlineSmall" style={styles.title}>
               Record Payment
             </Text>
             <Text variant="bodyLarge" style={styles.subtitle}>
               You paid {toUserName}
             </Text>
           </View>

           <TextInput
             label="Amount *"
             value={amount}
             onChangeText={setAmount}
             mode="outlined"
             keyboardType="numeric"
             left={<TextInput.Icon icon="currency-usd" />}
             style={styles.input}
           />

           <TextInput
             label="Note (Optional)"
             value={note}
             onChangeText={setNote}
             mode="outlined"
             multiline
             numberOfLines={3}
             placeholder="e.g., Paid via Venmo"
             style={styles.input}
           />

           <Button
             mode="contained"
             onPress={handleSubmit}
             loading={isLoading}
             disabled={isLoading}
             style={styles.button}
           >
             Record Settlement
           </Button>
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
       padding: 20,
     },
     header: {
       alignItems: 'center',
       marginBottom: 32,
     },
     title: {
       fontWeight: 'bold',
       marginBottom: 8,
     },
     subtitle: {
       color: COLORS.dark,
       opacity: 0.7,
     },
     input: {
       marginBottom: 16,
     },
     button: {
       marginTop: 16,
       paddingVertical: 6,
     },
   });
   ```

---

### Task 6.5: Display Settlement History

**Duration**: 1-2 hours

#### Subtasks:

1. **Create Settlement List Item**

   **src/components/settlements/SettlementListItem.tsx**:
   ```typescript
   import React from 'react';
   import { StyleSheet } from 'react-native';
   import { List, Text } from 'react-native-paper';
   import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
   import { format } from 'date-fns';
   import { Settlement } from '../../types';
   import { COLORS } from '../../constants';

   interface SettlementListItemProps {
     settlement: Settlement;
   }

   export const SettlementListItem: React.FC<SettlementListItemProps> = ({ settlement }) => {
     return (
       <List.Item
         title={`${settlement.fromUserName} paid ${settlement.toUserName}`}
         description={`${settlement.note || 'Payment'} • ${format(settlement.createdAt, 'MMM d, yyyy')}`}
         left={() => (
           <Icon name="cash-check" size={24} color={COLORS.primary} style={styles.icon} />
         )}
         right={() => (
           <Text variant="titleMedium" style={styles.amount}>
             ${settlement.amount.toFixed(2)}
           </Text>
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
     amount: {
       marginRight: 8,
       marginTop: 8,
       fontWeight: 'bold',
       color: COLORS.primary,
     },
   });
   ```

2. **Add Settlement History to Group Details**

   Update `GroupDetailsScreen.tsx` to show settlement history.

---

### Task 6.6: Update Navigation & Security

**Duration**: 30 minutes

#### Subtasks:

1. **Add Settlement Screens to Navigator**

   Update `GroupsStackParamList` and add screens.

2. **Update Firebase Security Rules**
   ```javascript
   match /settlements/{settlementId} {
     allow read: if request.auth != null;
     allow create: if request.auth != null &&
                      request.auth.uid == request.resource.data.fromUserId;
     allow update, delete: if false; // Settlements cannot be edited/deleted
   }
   ```

---

## Testing & Verification

### Manual Testing Checklist
- [ ] View balances in group
- [ ] Balances calculated correctly
- [ ] Record settlement
- [ ] Balances update after settlement
- [ ] Settlement history displays
- [ ] Cannot record negative amounts
- [ ] Real-time updates work

---

## Success Criteria

Phase 6 is complete when:
1. ✅ View who owes whom in group
2. ✅ Simplified debt calculations
3. ✅ Record settlements between members
4. ✅ Settlements update balances
5. ✅ Settlement history visible
6. ✅ Real-time updates for settlements
7. ✅ Security rules protect settlements
8. ✅ Dashboard reflects settlement changes

---

## Estimated Time: 10-12 hours (1 week part-time)
