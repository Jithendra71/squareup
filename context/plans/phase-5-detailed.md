# Phase 5: Expense Management - Comprehensive Plan

**Duration**: Week 5-6 (10-12 days)
**Goal**: Implement complete expense tracking with splitting, balance calculation, and expense history

---

## Overview

This is the core feature of the app - allowing users to add expenses, split them among group members (equally or custom amounts), view expense history, edit/delete expenses, and calculate balances to show who owes whom.

---

## Prerequisites

**Must be completed from Phase 4:**
- ✅ Groups system fully functional
- ✅ Group details screen ready
- ✅ Members can be added to groups

---

## Architecture Overview

### Expense Flow
```
Add Expense → Select Payers → Choose Split Type → Split Among Members → Save
                                      ↓
                              [Equal] or [Custom Amounts]
```

### Balance Calculation
```
For each member in group:
  Total Paid - Total Share = Net Balance
  Positive = They are owed
  Negative = They owe
```

---

## Step-by-Step Tasks

### Task 5.1: Create Expense Types & Store

**Duration**: 1 hour

#### Subtasks:

1. **Update Types**

   **src/types/index.ts** (add to existing):
   ```typescript
   export interface Expense {
     id: string;
     groupId: string;
     description: string;
     amount: number;
     category: string;
     paidBy: string; // userId who paid
     paidByName: string; // For display
     createdBy: string;
     createdAt: Date;
     updatedAt: Date;
     splits: ExpenseSplit[];
     imageUrl?: string; // Optional receipt
   }

   export interface ExpenseSplit {
     userId: string;
     displayName: string;
     amount: number;
     settled: boolean;
   }

   export interface GroupBalance {
     groupId: string;
     userId: string;
     displayName: string;
     totalPaid: number;
     totalOwed: number;
     balance: number; // net balance
   }
   ```

2. **Create Expenses Store**

   **src/store/expensesStore.ts**:
   ```typescript
   import { create } from 'zustand';
   import { Expense } from '../types';

   interface ExpensesState {
     expenses: Map<string, Expense[]>; // groupId -> expenses[]
     isLoading: boolean;
     error: string | null;

     setExpenses: (groupId: string, expenses: Expense[]) => void;
     addExpense: (groupId: string, expense: Expense) => void;
     updateExpense: (groupId: string, expenseId: string, updates: Partial<Expense>) => void;
     removeExpense: (groupId: string, expenseId: string) => void;
     getGroupExpenses: (groupId: string) => Expense[];
     setLoading: (loading: boolean) => void;
     setError: (error: string | null) => void;
   }

   export const useExpensesStore = create<ExpensesState>((set, get) => ({
     expenses: new Map(),
     isLoading: false,
     error: null,

     setExpenses: (groupId, expenses) =>
       set((state) => {
         const newExpenses = new Map(state.expenses);
         newExpenses.set(groupId, expenses);
         return { expenses: newExpenses };
       }),

     addExpense: (groupId, expense) =>
       set((state) => {
         const newExpenses = new Map(state.expenses);
         const groupExpenses = newExpenses.get(groupId) || [];
         newExpenses.set(groupId, [expense, ...groupExpenses]);
         return { expenses: newExpenses };
       }),

     updateExpense: (groupId, expenseId, updates) =>
       set((state) => {
         const newExpenses = new Map(state.expenses);
         const groupExpenses = newExpenses.get(groupId) || [];
         const updatedExpenses = groupExpenses.map((exp) =>
           exp.id === expenseId ? { ...exp, ...updates } : exp
         );
         newExpenses.set(groupId, updatedExpenses);
         return { expenses: newExpenses };
       }),

     removeExpense: (groupId, expenseId) =>
       set((state) => {
         const newExpenses = new Map(state.expenses);
         const groupExpenses = newExpenses.get(groupId) || [];
         newExpenses.set(
           groupId,
           groupExpenses.filter((exp) => exp.id !== expenseId)
         );
         return { expenses: newExpenses };
       }),

     getGroupExpenses: (groupId) => {
       const state = get();
       return state.expenses.get(groupId) || [];
     },

     setLoading: (loading) => set({ isLoading: loading }),
     setError: (error) => set({ error }),
   }));
   ```

---

### Task 5.2: Create Expenses Firebase Service

**Duration**: 2-3 hours

#### Subtasks:

1. **Create Expenses Service**

   **src/services/firebase/expenses.ts**:
   ```typescript
   import { firestore } from '../../config/firebase';
   import { Expense, ExpenseSplit } from '../../types';

   export const expensesService = {
     /**
      * Create a new expense
      */
     async createExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
       try {
         const docRef = await firestore().collection('expenses').add({
           ...expense,
           createdAt: firestore.FieldValue.serverTimestamp(),
           updatedAt: firestore.FieldValue.serverTimestamp(),
         });

         return {
           ...expense,
           id: docRef.id,
         };
       } catch (error: any) {
         console.error('Error creating expense:', error);
         throw new Error('Failed to create expense');
       }
     },

     /**
      * Get expenses for a group
      */
     async getGroupExpenses(groupId: string): Promise<Expense[]> {
       try {
         const snapshot = await firestore()
           .collection('expenses')
           .where('groupId', '==', groupId)
           .orderBy('createdAt', 'desc')
           .get();

         return snapshot.docs.map((doc) => {
           const data = doc.data();
           return {
             id: doc.id,
             groupId: data.groupId,
             description: data.description,
             amount: data.amount,
             category: data.category,
             paidBy: data.paidBy,
             paidByName: data.paidByName,
             createdBy: data.createdBy,
             createdAt: data.createdAt?.toDate() || new Date(),
             updatedAt: data.updatedAt?.toDate() || new Date(),
             splits: data.splits || [],
             imageUrl: data.imageUrl,
           };
         });
       } catch (error: any) {
         console.error('Error fetching expenses:', error);
         throw new Error('Failed to fetch expenses');
       }
     },

     /**
      * Update expense
      */
     async updateExpense(
       expenseId: string,
       updates: Partial<Omit<Expense, 'id' | 'createdAt'>>
     ): Promise<void> {
       try {
         await firestore()
           .collection('expenses')
           .doc(expenseId)
           .update({
             ...updates,
             updatedAt: firestore.FieldValue.serverTimestamp(),
           });
       } catch (error: any) {
         console.error('Error updating expense:', error);
         throw new Error('Failed to update expense');
       }
     },

     /**
      * Delete expense
      */
     async deleteExpense(expenseId: string): Promise<void> {
       try {
         await firestore().collection('expenses').doc(expenseId).delete();
       } catch (error: any) {
         console.error('Error deleting expense:', error);
         throw new Error('Failed to delete expense');
       }
     },

     /**
      * Listen to group expenses (real-time)
      */
     subscribeToGroupExpenses(groupId: string, callback: (expenses: Expense[]) => void) {
       return firestore()
         .collection('expenses')
         .where('groupId', '==', groupId)
         .orderBy('createdAt', 'desc')
         .onSnapshot(
           (snapshot) => {
             const expenses = snapshot.docs.map((doc) => {
               const data = doc.data();
               return {
                 id: doc.id,
                 groupId: data.groupId,
                 description: data.description,
                 amount: data.amount,
                 category: data.category,
                 paidBy: data.paidBy,
                 paidByName: data.paidByName,
                 createdBy: data.createdBy,
                 createdAt: data.createdAt?.toDate() || new Date(),
                 updatedAt: data.updatedAt?.toDate() || new Date(),
                 splits: data.splits || [],
                 imageUrl: data.imageUrl,
               };
             });
             callback(expenses);
           },
           (error) => {
             console.error('Error listening to expenses:', error);
             callback([]);
           }
         );
     },
   };
   ```

---

### Task 5.3: Create Balance Calculator Utility

**Duration**: 2 hours

#### Subtasks:

1. **Create Balance Calculator**

   **src/utils/balanceCalculator.ts**:
   ```typescript
   import { Expense, GroupBalance, Balance } from '../types';

   export class BalanceCalculator {
     /**
      * Calculate balances for all members in a group
      */
     static calculateGroupBalances(
       expenses: Expense[],
       memberIds: string[],
       memberNames: Map<string, string>
     ): GroupBalance[] {
       const balances = new Map<string, GroupBalance>();

       // Initialize balances for all members
       memberIds.forEach((userId) => {
         balances.set(userId, {
           groupId: expenses[0]?.groupId || '',
           userId,
           displayName: memberNames.get(userId) || 'Unknown',
           totalPaid: 0,
           totalOwed: 0,
           balance: 0,
         });
       });

       // Calculate total paid and total owed for each member
       expenses.forEach((expense) => {
         // Add to payer's total paid
         const payer = balances.get(expense.paidBy);
         if (payer) {
           payer.totalPaid += expense.amount;
         }

         // Add to each split member's total owed
         expense.splits.forEach((split) => {
           if (!split.settled) {
             const member = balances.get(split.userId);
             if (member) {
               member.totalOwed += split.amount;
             }
           }
         });
       });

       // Calculate net balance (positive = owed to them, negative = they owe)
       balances.forEach((balance) => {
         balance.balance = balance.totalPaid - balance.totalOwed;
       });

       return Array.from(balances.values());
     },

     /**
      * Calculate who owes whom
      * Returns list of balances showing payer and payee
      */
     static simplifyDebts(groupBalances: GroupBalance[]): Balance[] {
       // Separate creditors (owed) and debtors (owe)
       const creditors = groupBalances
         .filter((b) => b.balance > 0.01)
         .sort((a, b) => b.balance - a.balance);

       const debtors = groupBalances
         .filter((b) => b.balance < -0.01)
         .map((b) => ({ ...b, balance: -b.balance }))
         .sort((a, b) => b.balance - a.balance);

       const transactions: Balance[] = [];

       let i = 0;
       let j = 0;

       while (i < creditors.length && j < debtors.length) {
         const creditor = creditors[i];
         const debtor = debtors[j];

         const amount = Math.min(creditor.balance, debtor.balance);

         transactions.push({
           userId: debtor.userId,
           displayName: `${debtor.displayName} owes ${creditor.displayName}`,
           amount: amount,
         });

         creditor.balance -= amount;
         debtor.balance -= amount;

         if (creditor.balance < 0.01) i++;
         if (debtor.balance < 0.01) j++;
       }

       return transactions;
     },

     /**
      * Split expense equally among members
      */
     static splitEqually(
       amount: number,
       memberIds: string[],
       memberNames: Map<string, string>
     ): ExpenseSplit[] {
       const splitAmount = amount / memberIds.length;

       return memberIds.map((userId) => ({
         userId,
         displayName: memberNames.get(userId) || 'Unknown',
         amount: Number(splitAmount.toFixed(2)),
         settled: false,
       }));
     },

     /**
      * Validate custom split amounts
      */
     static validateCustomSplits(amount: number, splits: ExpenseSplit[]): boolean {
       const total = splits.reduce((sum, split) => sum + split.amount, 0);
       return Math.abs(total - amount) < 0.01; // Allow for rounding errors
     }
   }
   ```

---

### Task 5.4: Create Add Expense Screen

**Duration**: 4-5 hours

#### Subtasks:

1. **Create Category Picker Component**

   **src/components/expenses/CategoryPicker.tsx**:
   ```typescript
   import React from 'react';
   import { View, StyleSheet, ScrollView } from 'react-native';
   import { Chip, Text } from 'react-native-paper';
   import { EXPENSE_CATEGORIES, COLORS } from '../../constants';

   interface CategoryPickerProps {
     selectedCategory: string;
     onSelectCategory: (category: string) => void;
   }

   export const CategoryPicker: React.FC<CategoryPickerProps> = ({
     selectedCategory,
     onSelectCategory,
   }) => {
     return (
       <View style={styles.container}>
         <Text variant="bodyMedium" style={styles.label}>
           Category
         </Text>
         <ScrollView horizontal showsHorizontalScrollIndicator={false}>
           <View style={styles.chipsContainer}>
             {EXPENSE_CATEGORIES.map((cat) => (
               <Chip
                 key={cat.value}
                 selected={selectedCategory === cat.value}
                 onPress={() => onSelectCategory(cat.value)}
                 style={styles.chip}
                 icon={cat.icon}
               >
                 {cat.label}
               </Chip>
             ))}
           </View>
         </ScrollView>
       </View>
     );
   };

   const styles = StyleSheet.create({
     container: {
       marginVertical: 8,
     },
     label: {
       marginBottom: 8,
       color: COLORS.dark,
       opacity: 0.7,
     },
     chipsContainer: {
       flexDirection: 'row',
       gap: 8,
     },
     chip: {
       marginBottom: 4,
     },
   });
   ```

2. **Create Payer Selector Component**

   **src/components/expenses/PayerSelector.tsx**:
   ```typescript
   import React, { useState } from 'react';
   import { View, StyleSheet } from 'react-native';
   import { List, RadioButton, Text, Menu, Button } from 'react-native-paper';
   import { MemberDetail } from '../../types';
   import { COLORS } from '../../constants';

   interface PayerSelectorProps {
     members: MemberDetail[];
     selectedPayerId: string;
     onSelectPayer: (userId: string) => void;
   }

   export const PayerSelector: React.FC<PayerSelectorProps> = ({
     members,
     selectedPayerId,
     onSelectPayer,
   }) => {
     const [visible, setVisible] = useState(false);
     const selectedPayer = members.find((m) => m.userId === selectedPayerId);

     return (
       <View style={styles.container}>
         <Text variant="bodyMedium" style={styles.label}>
           Paid by
         </Text>
         <Menu
           visible={visible}
           onDismiss={() => setVisible(false)}
           anchor={
             <Button
               mode="outlined"
               onPress={() => setVisible(true)}
               icon="account"
               contentStyle={styles.buttonContent}
             >
               {selectedPayer?.displayName || 'Select payer'}
             </Button>
           }
         >
           {members.map((member) => (
             <Menu.Item
               key={member.userId}
               onPress={() => {
                 onSelectPayer(member.userId);
                 setVisible(false);
               }}
               title={member.displayName}
               leadingIcon={selectedPayerId === member.userId ? 'check' : undefined}
             />
           ))}
         </Menu>
       </View>
     );
   };

   const styles = StyleSheet.create({
     container: {
       marginVertical: 8,
     },
     label: {
       marginBottom: 8,
       color: COLORS.dark,
       opacity: 0.7,
     },
     buttonContent: {
       justifyContent: 'flex-start',
     },
   });
   ```

3. **Create Split Type Selector**

   **src/components/expenses/SplitTypeSelector.tsx**:
   ```typescript
   import React from 'react';
   import { View, StyleSheet } from 'react-native';
   import { SegmentedButtons, Text } from 'react-native-paper';
   import { SPLIT_TYPES, COLORS } from '../../constants';

   interface SplitTypeSelectorProps {
     selectedType: string;
     onSelectType: (type: string) => void;
   }

   export const SplitTypeSelector: React.FC<SplitTypeSelectorProps> = ({
     selectedType,
     onSelectType,
   }) => {
     return (
       <View style={styles.container}>
         <Text variant="bodyMedium" style={styles.label}>
           Split type
         </Text>
         <SegmentedButtons
           value={selectedType}
           onValueChange={onSelectType}
           buttons={[
             {
               value: SPLIT_TYPES.EQUAL,
               label: 'Split Equally',
               icon: 'equal',
             },
             {
               value: SPLIT_TYPES.CUSTOM,
               label: 'Custom Amounts',
               icon: 'pencil',
             },
           ]}
         />
       </View>
     );
   };

   const styles = StyleSheet.create({
     container: {
       marginVertical: 8,
     },
     label: {
       marginBottom: 8,
       color: COLORS.dark,
       opacity: 0.7,
     },
   });
   ```

4. **Create Split Members Selector**

   **src/components/expenses/SplitMembersSelector.tsx**:
   ```typescript
   import React from 'react';
   import { View, StyleSheet } from 'react-native';
   import { Checkbox, List, Text } from 'react-native-paper';
   import { MemberDetail } from '../../types';
   import { COLORS } from '../../constants';

   interface SplitMembersSelectorProps {
     members: MemberDetail[];
     selectedMemberIds: string[];
     onToggleMember: (userId: string) => void;
   }

   export const SplitMembersSelector: React.FC<SplitMembersSelectorProps> = ({
     members,
     selectedMemberIds,
     onToggleMember,
   }) => {
     return (
       <View style={styles.container}>
         <Text variant="bodyMedium" style={styles.label}>
           Split between
         </Text>
         <View style={styles.list}>
           {members.map((member) => (
             <List.Item
               key={member.userId}
               title={member.displayName}
               left={() => (
                 <Checkbox
                   status={selectedMemberIds.includes(member.userId) ? 'checked' : 'unchecked'}
                   onPress={() => onToggleMember(member.userId)}
                 />
               )}
               onPress={() => onToggleMember(member.userId)}
             />
           ))}
         </View>
       </View>
     );
   };

   const styles = StyleSheet.create({
     container: {
       marginVertical: 8,
     },
     label: {
       marginBottom: 8,
       color: COLORS.dark,
       opacity: 0.7,
     },
     list: {
       backgroundColor: COLORS.white,
       borderRadius: 8,
     },
   });
   ```

5. **Create Add Expense Screen**

   **src/screens/expenses/AddExpenseScreen.tsx**:
   ```typescript
   import React, { useState } from 'react';
   import {
     View,
     StyleSheet,
     ScrollView,
     KeyboardAvoidingView,
     Platform,
     Alert,
   } from 'react-native';
   import { TextInput, Button, HelperText } from 'react-native-paper';
   import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
   import { useGroup } from '../../hooks/useGroup';
   import { useAuthStore } from '../../store/authStore';
   import { expensesService } from '../../services/firebase/expenses';
   import { useExpensesStore } from '../../store/expensesStore';
   import { CategoryPicker } from '../../components/expenses/CategoryPicker';
   import { PayerSelector } from '../../components/expenses/PayerSelector';
   import { SplitTypeSelector } from '../../components/expenses/SplitTypeSelector';
   import { SplitMembersSelector } from '../../components/expenses/SplitMembersSelector';
   import { BalanceCalculator } from '../../utils/balanceCalculator';
   import { SPLIT_TYPES, COLORS } from '../../constants';

   export const AddExpenseScreen: React.FC = () => {
     const route = useRoute();
     const navigation = useNavigation();
     const { groupId } = route.params as { groupId: string };
     const { group } = useGroup(groupId);
     const { user } = useAuthStore();
     const { addExpense } = useExpensesStore();

     const [description, setDescription] = useState('');
     const [amount, setAmount] = useState('');
     const [category, setCategory] = useState('food');
     const [paidBy, setPaidBy] = useState(user?.id || '');
     const [splitType, setSplitType] = useState(SPLIT_TYPES.EQUAL);
     const [selectedMembers, setSelectedMembers] = useState<string[]>(
       group?.members || []
     );
     const [isLoading, setIsLoading] = useState(false);

     const handleToggleMember = (userId: string) => {
       if (selectedMembers.includes(userId)) {
         setSelectedMembers(selectedMembers.filter((id) => id !== userId));
       } else {
         setSelectedMembers([...selectedMembers, userId]);
       }
     };

     const handleSubmit = async () => {
       // Validation
       if (!description.trim()) {
         Alert.alert('Error', 'Please enter a description');
         return;
       }

       const numAmount = parseFloat(amount);
       if (isNaN(numAmount) || numAmount <= 0) {
         Alert.alert('Error', 'Please enter a valid amount');
         return;
       }

       if (selectedMembers.length === 0) {
         Alert.alert('Error', 'Please select at least one member');
         return;
       }

       try {
         setIsLoading(true);

         // Create member names map
         const memberNames = new Map(
           group?.memberDetails.map((m) => [m.userId, m.displayName]) || []
         );

         // Calculate splits
         const splits = BalanceCalculator.splitEqually(
           numAmount,
           selectedMembers,
           memberNames
         );

         const paidByName = group?.memberDetails.find((m) => m.userId === paidBy)?.displayName || '';

         const expense = {
           groupId,
           description: description.trim(),
           amount: numAmount,
           category,
           paidBy,
           paidByName,
           createdBy: user!.id,
           createdAt: new Date(),
           updatedAt: new Date(),
           splits,
         };

         const created = await expensesService.createExpense(expense);
         addExpense(groupId, created);

         Alert.alert('Success', 'Expense added successfully!', [
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

     if (!group) return null;

     return (
       <KeyboardAvoidingView
         style={styles.container}
         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
       >
         <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
           <TextInput
             label="Description *"
             value={description}
             onChangeText={setDescription}
             mode="outlined"
             placeholder="e.g., Dinner at restaurant"
           />

           <TextInput
             label="Amount *"
             value={amount}
             onChangeText={setAmount}
             mode="outlined"
             keyboardType="numeric"
             left={<TextInput.Icon icon="currency-usd" />}
             placeholder="0.00"
           />

           <CategoryPicker selectedCategory={category} onSelectCategory={setCategory} />

           <PayerSelector
             members={group.memberDetails}
             selectedPayerId={paidBy}
             onSelectPayer={setPaidBy}
           />

           <SplitTypeSelector selectedType={splitType} onSelectType={setSplitType} />

           <SplitMembersSelector
             members={group.memberDetails}
             selectedMemberIds={selectedMembers}
             onToggleMember={handleToggleMember}
           />

           <Button
             mode="contained"
             onPress={handleSubmit}
             loading={isLoading}
             disabled={isLoading}
             style={styles.button}
           >
             Add Expense
           </Button>
         </ScrollView>
       </KeyboardAvoidingView>
     );
   };

   const styles = StyleSheet.create({
     container: {
       flex: 1,
       backgroundColor: COLORS.background,
     },
     scrollView: {
       flex: 1,
     },
     content: {
       padding: 20,
       gap: 16,
     },
     button: {
       marginTop: 16,
       paddingVertical: 6,
     },
   });
   ```

#### Acceptance Criteria:
- [ ] Form with description, amount, category inputs
- [ ] Payer selection from group members
- [ ] Split type selector (equal/custom)
- [ ] Member selection for split
- [ ] Validation for all fields
- [ ] Create expense and save to Firestore
- [ ] Navigate back after success

---

### Task 5.5: Display Expenses in Group Details

**Duration**: 2 hours

#### Subtasks:

1. **Create Expense List Item**

   **src/components/expenses/ExpenseListItem.tsx**:
   ```typescript
   import React from 'react';
   import { StyleSheet, TouchableOpacity } from 'react-native';
   import { List, Text } from 'react-native-paper';
   import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
   import { format } from 'date-fns';
   import { Expense } from '../../types';
   import { COLORS, EXPENSE_CATEGORIES } from '../../constants';

   interface ExpenseListItemProps {
     expense: Expense;
     onPress: () => void;
   }

   export const ExpenseListItem: React.FC<ExpenseListItemProps> = ({ expense, onPress }) => {
     const category = EXPENSE_CATEGORIES.find((c) => c.value === expense.category);

     return (
       <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
         <List.Item
           title={expense.description}
           description={`Paid by ${expense.paidByName} • ${format(expense.createdAt, 'MMM d')}`}
           left={() => (
             <Icon
               name={category?.icon || 'cash'}
               size={24}
               color={COLORS.primary}
               style={styles.icon}
             />
           )}
           right={() => (
             <Text variant="titleMedium" style={styles.amount}>
               ${expense.amount.toFixed(2)}
             </Text>
           )}
           style={styles.item}
         />
       </List.Item>
     </TouchableOpacity>
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
     },
   });
   ```

2. **Update Group Details Screen**

   Update `GroupDetailsScreen.tsx` to load and display expenses:
   ```typescript
   // Add at top
   import { useEffect } from 'react';
   import { useExpensesStore } from '../../store/expensesStore';
   import { expensesService } from '../../services/firebase/expenses';
   import { ExpenseListItem } from '../../components/expenses/ExpenseListItem';
   import { BalanceCalculator } from '../../utils/balanceCalculator';

   // Inside component
   const { getGroupExpenses, setExpenses } = useExpensesStore();
   const expenses = getGroupExpenses(groupId);
   const [balances, setBalances] = useState<GroupBalance[]>([]);

   useEffect(() => {
     if (!groupId) return;

     const unsubscribe = expensesService.subscribeToGroupExpenses(groupId, (expenses) => {
       setExpenses(groupId, expenses);

       // Calculate balances
       if (group) {
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
     });

     return unsubscribe;
   }, [groupId, group]);

   // Update balances section to show real data
   // Update expenses section to show list
   ```

#### Acceptance Criteria:
- [ ] Expenses displayed in group details
- [ ] Real-time updates when expenses added/changed
- [ ] Balances calculated and displayed
- [ ] Click expense to view details

---

### Task 5.6: Update Navigation & Security Rules

**Duration**: 1 hour

#### Subtasks:

1. **Add Expense Screens to Navigator**

   Update navigation types and add AddExpense screen to stack.

2. **Update Firebase Security Rules**
   ```javascript
   // Expenses collection
   match /expenses/{expenseId} {
     allow read: if request.auth != null;
     allow create: if request.auth != null;
     allow update, delete: if request.auth != null &&
                              request.auth.uid == resource.data.createdBy;
   }
   ```

---

## Testing & Verification

### Manual Testing Checklist
- [ ] Add expense with all fields
- [ ] Split equally among all members
- [ ] Split among selected members
- [ ] View expenses in group
- [ ] Balances calculate correctly
- [ ] Edit/delete expense
- [ ] Real-time updates work

---

## Success Criteria

Phase 5 is complete when:
1. ✅ Users can add expenses with description, amount, category
2. ✅ Select who paid and split between members
3. ✅ Equal split calculation works correctly
4. ✅ Expenses display in group details
5. ✅ Balances calculate correctly
6. ✅ Real-time updates for expenses
7. ✅ Edit/delete expenses
8. ✅ Dashboard shows updated balance
9. ✅ Security rules protect expense data

---

## Estimated Time: 16-18 hours (2 weeks part-time)
