# Phase 4: Group Management - Comprehensive Plan

**Duration**: Week 4 (5-7 days)
**Goal**: Implement complete group management functionality - create, view, edit, and manage groups with members

---

## Overview

This phase implements the core group management features that allow users to create groups, add members by phone number, view group details, manage members, and leave/delete groups. Groups are the foundation for expense splitting in the app.

---

## Prerequisites

**Must be completed from Phase 3:**
- ✅ Navigation structure with Groups tab
- ✅ Groups list screen with empty state
- ✅ Groups store created
- ✅ Firebase Firestore configured

---

## Architecture Overview

### Group Management Flow
```
Groups List → Create Group → Add Members → Group Created
                ↓
            Group Details → View Members
                         → View Expenses (Phase 5)
                         → Edit Group
                         → Leave Group
```

### Data Flow
```
User Action → Component → Service (Firestore) → Store → UI Update
```

---

## Step-by-Step Tasks

### Task 4.1: Create Groups Firebase Service

**Duration**: 2 hours

#### Subtasks:

1. **Create Groups Service**

   **src/services/firebase/groups.ts**:
   ```typescript
   import { firestore } from '../../config/firebase';
   import { Group, User, MemberDetail } from '../../types';
   import { usersService } from './users';

   export const groupsService = {
     /**
      * Create a new group
      */
     async createGroup(
       name: string,
       description: string | undefined,
       createdBy: string,
       members: string[] // Array of user IDs including creator
     ): Promise<Group> {
       try {
         // Fetch member details
         const memberUsers = await usersService.getUsersByIds(members);
         const memberDetails: MemberDetail[] = memberUsers.map((user) => ({
           userId: user.id,
           displayName: user.displayName,
           photoURL: user.photoURL,
           phoneNumber: user.phoneNumber,
         }));

         const groupData = {
           name,
           description: description || '',
           createdBy,
           createdAt: firestore.FieldValue.serverTimestamp(),
           members,
           memberDetails,
         };

         const docRef = await firestore().collection('groups').add(groupData);

         return {
           id: docRef.id,
           name,
           description,
           createdBy,
           createdAt: new Date(),
           members,
           memberDetails,
         };
       } catch (error: any) {
         console.error('Error creating group:', error);
         throw new Error('Failed to create group');
       }
     },

     /**
      * Get all groups for a user
      */
     async getUserGroups(userId: string): Promise<Group[]> {
       try {
         const snapshot = await firestore()
           .collection('groups')
           .where('members', 'array-contains', userId)
           .orderBy('createdAt', 'desc')
           .get();

         return snapshot.docs.map((doc) => {
           const data = doc.data();
           return {
             id: doc.id,
             name: data.name,
             description: data.description,
             createdBy: data.createdBy,
             createdAt: data.createdAt?.toDate() || new Date(),
             members: data.members || [],
             memberDetails: data.memberDetails || [],
           };
         });
       } catch (error: any) {
         console.error('Error fetching groups:', error);
         throw new Error('Failed to fetch groups');
       }
     },

     /**
      * Get group by ID
      */
     async getGroupById(groupId: string): Promise<Group | null> {
       try {
         const doc = await firestore().collection('groups').doc(groupId).get();

         if (!doc.exists) return null;

         const data = doc.data()!;
         return {
           id: doc.id,
           name: data.name,
           description: data.description,
           createdBy: data.createdBy,
           createdAt: data.createdAt?.toDate() || new Date(),
           members: data.members || [],
           memberDetails: data.memberDetails || [],
         };
       } catch (error: any) {
         console.error('Error fetching group:', error);
         return null;
       }
     },

     /**
      * Update group details
      */
     async updateGroup(
       groupId: string,
       updates: { name?: string; description?: string }
     ): Promise<void> {
       try {
         await firestore()
           .collection('groups')
           .doc(groupId)
           .update({
             ...updates,
             updatedAt: firestore.FieldValue.serverTimestamp(),
           });
       } catch (error: any) {
         console.error('Error updating group:', error);
         throw new Error('Failed to update group');
       }
     },

     /**
      * Add members to group
      */
     async addMembers(groupId: string, newMemberIds: string[]): Promise<void> {
       try {
         // Fetch new member details
         const memberUsers = await usersService.getUsersByIds(newMemberIds);
         const newMemberDetails: MemberDetail[] = memberUsers.map((user) => ({
           userId: user.id,
           displayName: user.displayName,
           photoURL: user.photoURL,
           phoneNumber: user.phoneNumber,
         }));

         await firestore()
           .collection('groups')
           .doc(groupId)
           .update({
             members: firestore.FieldValue.arrayUnion(...newMemberIds),
             memberDetails: firestore.FieldValue.arrayUnion(...newMemberDetails),
             updatedAt: firestore.FieldValue.serverTimestamp(),
           });
       } catch (error: any) {
         console.error('Error adding members:', error);
         throw new Error('Failed to add members');
       }
     },

     /**
      * Remove member from group
      */
     async removeMember(groupId: string, userId: string): Promise<void> {
       try {
         const group = await this.getGroupById(groupId);
         if (!group) throw new Error('Group not found');

         // Find and remove member detail
         const memberDetail = group.memberDetails.find((m) => m.userId === userId);

         await firestore()
           .collection('groups')
           .doc(groupId)
           .update({
             members: firestore.FieldValue.arrayRemove(userId),
             memberDetails: memberDetail
               ? firestore.FieldValue.arrayRemove(memberDetail)
               : group.memberDetails,
             updatedAt: firestore.FieldValue.serverTimestamp(),
           });
       } catch (error: any) {
         console.error('Error removing member:', error);
         throw new Error('Failed to remove member');
       }
     },

     /**
      * Delete group (only creator can delete)
      */
     async deleteGroup(groupId: string, userId: string): Promise<void> {
       try {
         const group = await this.getGroupById(groupId);
         if (!group) throw new Error('Group not found');

         if (group.createdBy !== userId) {
           throw new Error('Only the creator can delete this group');
         }

         // TODO: Also delete all expenses and settlements for this group
         await firestore().collection('groups').doc(groupId).delete();
       } catch (error: any) {
         console.error('Error deleting group:', error);
         throw error;
       }
     },

     /**
      * Leave group (remove self from members)
      */
     async leaveGroup(groupId: string, userId: string): Promise<void> {
       try {
         const group = await this.getGroupById(groupId);
         if (!group) throw new Error('Group not found');

         // Creator cannot leave, must delete instead
         if (group.createdBy === userId) {
           throw new Error('Group creator must delete the group instead of leaving');
         }

         await this.removeMember(groupId, userId);
       } catch (error: any) {
         console.error('Error leaving group:', error);
         throw error;
       }
     },

     /**
      * Listen to group updates (real-time)
      */
     subscribeToGroup(groupId: string, callback: (group: Group | null) => void) {
       return firestore()
         .collection('groups')
         .doc(groupId)
         .onSnapshot(
           (doc) => {
             if (doc.exists) {
               const data = doc.data()!;
               callback({
                 id: doc.id,
                 name: data.name,
                 description: data.description,
                 createdBy: data.createdBy,
                 createdAt: data.createdAt?.toDate() || new Date(),
                 members: data.members || [],
                 memberDetails: data.memberDetails || [],
               });
             } else {
               callback(null);
             }
           },
           (error) => {
             console.error('Error listening to group:', error);
             callback(null);
           }
         );
     },

     /**
      * Listen to user's groups (real-time)
      */
     subscribeToUserGroups(userId: string, callback: (groups: Group[]) => void) {
       return firestore()
         .collection('groups')
         .where('members', 'array-contains', userId)
         .orderBy('createdAt', 'desc')
         .onSnapshot(
           (snapshot) => {
             const groups = snapshot.docs.map((doc) => {
               const data = doc.data();
               return {
                 id: doc.id,
                 name: data.name,
                 description: data.description,
                 createdBy: data.createdBy,
                 createdAt: data.createdAt?.toDate() || new Date(),
                 members: data.members || [],
                 memberDetails: data.memberDetails || [],
               };
             });
             callback(groups);
           },
           (error) => {
             console.error('Error listening to groups:', error);
             callback([]);
           }
         );
     },
   };
   ```

#### Acceptance Criteria:
- [ ] Create group function with member details
- [ ] Fetch user groups from Firestore
- [ ] Update group information
- [ ] Add/remove members
- [ ] Delete group (creator only)
- [ ] Leave group (non-creators)
- [ ] Real-time listeners for groups
- [ ] Error handling for all operations

---

### Task 4.2: Create Group Hooks

**Duration**: 1 hour

#### Subtasks:

1. **Create useGroups Hook**

   **src/hooks/useGroups.ts**:
   ```typescript
   import { useEffect } from 'react';
   import { useGroupsStore } from '../store/groupsStore';
   import { useAuthStore } from '../store/authStore';
   import { groupsService } from '../services/firebase/groups';

   export const useGroups = () => {
     const { user } = useAuthStore();
     const { groups, setGroups, addGroup, updateGroup, removeGroup, setLoading, setError } =
       useGroupsStore();

     useEffect(() => {
       if (!user) return;

       setLoading(true);
       const unsubscribe = groupsService.subscribeToUserGroups(user.id, (groups) => {
         setGroups(groups);
         setLoading(false);
       });

       return unsubscribe;
     }, [user?.id]);

     const createGroup = async (name: string, description: string, memberPhoneNumbers: string[]) => {
       try {
         if (!user) throw new Error('User not authenticated');

         setLoading(true);
         setError(null);

         // Search for users by phone number
         const memberUsers = await Promise.all(
           memberPhoneNumbers.map((phoneNumber) => usersService.searchUsersByPhoneNumber(phoneNumber))
         );

         // Flatten and get user IDs
         const memberIds = memberUsers
           .flat()
           .map((u) => u.id)
           .filter((id, index, self) => self.indexOf(id) === index); // Remove duplicates

         // Add current user if not already in list
         if (!memberIds.includes(user.id)) {
           memberIds.push(user.id);
         }

         const group = await groupsService.createGroup(name, description, user.id, memberIds);
         addGroup(group);
         setLoading(false);
         return group;
       } catch (error: any) {
         setError(error.message);
         setLoading(false);
         throw error;
       }
     };

     return {
       groups,
       createGroup,
     };
   };
   ```

2. **Create useGroup Hook (for single group)**

   **src/hooks/useGroup.ts**:
   ```typescript
   import { useEffect, useState } from 'react';
   import { Group } from '../types';
   import { groupsService } from '../services/firebase/groups';
   import { useAuthStore } from '../store/authStore';

   export const useGroup = (groupId: string) => {
     const { user } = useAuthStore();
     const [group, setGroup] = useState<Group | null>(null);
     const [isLoading, setIsLoading] = useState(true);
     const [error, setError] = useState<string | null>(null);

     useEffect(() => {
       if (!groupId) return;

       setIsLoading(true);
       const unsubscribe = groupsService.subscribeToGroup(groupId, (group) => {
         setGroup(group);
         setIsLoading(false);
       });

       return unsubscribe;
     }, [groupId]);

     const updateGroupInfo = async (updates: { name?: string; description?: string }) => {
       try {
         setError(null);
         await groupsService.updateGroup(groupId, updates);
       } catch (error: any) {
         setError(error.message);
         throw error;
       }
     };

     const addMembers = async (memberPhoneNumbers: string[]) => {
       try {
         setError(null);
         // Search for users and add them
         const memberUsers = await Promise.all(
           memberPhoneNumbers.map((phoneNumber) => usersService.searchUsersByPhoneNumber(phoneNumber))
         );
         const memberIds = memberUsers.flat().map((u) => u.id);
         await groupsService.addMembers(groupId, memberIds);
       } catch (error: any) {
         setError(error.message);
         throw error;
       }
     };

     const removeMember = async (userId: string) => {
       try {
         setError(null);
         await groupsService.removeMember(groupId, userId);
       } catch (error: any) {
         setError(error.message);
         throw error;
       }
     };

     const leaveGroup = async () => {
       try {
         if (!user) throw new Error('User not authenticated');
         setError(null);
         await groupsService.leaveGroup(groupId, user.id);
       } catch (error: any) {
         setError(error.message);
         throw error;
       }
     };

     const deleteGroup = async () => {
       try {
         if (!user) throw new Error('User not authenticated');
         setError(null);
         await groupsService.deleteGroup(groupId, user.id);
       } catch (error: any) {
         setError(error.message);
         throw error;
       }
     };

     return {
       group,
       isLoading,
       error,
       updateGroupInfo,
       addMembers,
       removeMember,
       leaveGroup,
       deleteGroup,
       isCreator: user?.id === group?.createdBy,
     };
   };
   ```

#### Acceptance Criteria:
- [ ] useGroups hook for managing all groups
- [ ] useGroup hook for single group operations
- [ ] Real-time updates from Firestore
- [ ] Error handling
- [ ] Loading states

---

### Task 4.3: Create Group Form Screen

**Duration**: 3 hours

#### Subtasks:

1. **Create Member Search Input Component**

   **src/components/groups/MemberSearchInput.tsx**:
   ```typescript
   import React, { useState } from 'react';
   import { View, StyleSheet, FlatList } from 'react-native';
   import { TextInput, List, Text, Chip } from 'react-native-paper';
   import { usersService } from '../../services/firebase/users';
   import { User } from '../../types';
   import { COLORS } from '../../constants';

   interface MemberSearchInputProps {
     selectedMembers: string[];
     onAddMember: (phoneNumber: string) => void;
     onRemoveMember: (phoneNumber: string) => void;
   }

   export const MemberSearchInput: React.FC<MemberSearchInputProps> = ({
     selectedMembers,
     onAddMember,
     onRemoveMember,
   }) => {
     const [searchQuery, setSearchQuery] = useState('');
     const [searchResults, setSearchResults] = useState<User[]>([]);
     const [searching, setSearching] = useState(false);

     const handleSearch = async (query: string) => {
       setSearchQuery(query);

       if (query.length < 3) {
         setSearchResults([]);
         return;
       }

       // Simple phone number validation (digits and + sign)
       if (!/^[\d+\s-]+$/.test(query)) {
         setSearchResults([]);
         return;
       }

       try {
         setSearching(true);
         const results = await usersService.searchUsersByPhoneNumber(query);
         setSearchResults(results);
       } catch (error) {
         console.error('Search error:', error);
         setSearchResults([]);
       } finally {
         setSearching(false);
       }
     };

     const handleSelectUser = (phoneNumber: string) => {
       if (!selectedMembers.includes(phoneNumber)) {
         onAddMember(phoneNumber);
         setSearchQuery('');
         setSearchResults([]);
       }
     };

     return (
       <View style={styles.container}>
         <TextInput
           label="Add members by phone number"
           value={searchQuery}
           onChangeText={handleSearch}
           mode="outlined"
           keyboardType="phone-pad"
           autoCapitalize="none"
           placeholder="+91XXXXXXXXXX"
           left={<TextInput.Icon icon="account-search" />}
         />

         {searchResults.length > 0 && (
           <View style={styles.resultsContainer}>
             {searchResults.map((user) => (
               <List.Item
                 key={user.id}
                 title={user.displayName}
                 description={user.phoneNumber}
                 onPress={() => handleSelectUser(user.phoneNumber)}
                 left={(props) => <List.Icon {...props} icon="account" />}
                 right={(props) => <List.Icon {...props} icon="plus" />}
               />
             ))}
           </View>
         )}

         {searchQuery.length > 0 && searchResults.length === 0 && !searching && (
           <Text variant="bodySmall" style={styles.noResults}>
             No users found. They must sign up first.
           </Text>
         )}

         {selectedMembers.length > 0 && (
           <View style={styles.selectedContainer}>
             <Text variant="bodySmall" style={styles.selectedLabel}>
               Selected members:
             </Text>
             <View style={styles.chipsContainer}>
               {selectedMembers.map((phoneNumber) => (
                 <Chip
                   key={phoneNumber}
                   onClose={() => onRemoveMember(phoneNumber)}
                   style={styles.chip}
                 >
                   {phoneNumber}
                 </Chip>
               ))}
             </View>
           </View>
         )}
       </View>
     );
   };

   const styles = StyleSheet.create({
     container: {
       marginBottom: 16,
     },
     resultsContainer: {
       backgroundColor: COLORS.white,
       borderRadius: 8,
       marginTop: 8,
       elevation: 2,
     },
     noResults: {
       marginTop: 8,
       color: COLORS.dark,
       opacity: 0.6,
       textAlign: 'center',
     },
     selectedContainer: {
       marginTop: 16,
     },
     selectedLabel: {
       marginBottom: 8,
       color: COLORS.dark,
       opacity: 0.7,
     },
     chipsContainer: {
       flexDirection: 'row',
       flexWrap: 'wrap',
       gap: 8,
     },
     chip: {
       marginBottom: 4,
     },
   });
   ```

2. **Create Group Form Screen**

   **src/screens/groups/CreateGroupScreen.tsx**:
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
   import { useForm, Controller } from 'react-hook-form';
   import { zodResolver } from '@hookform/resolvers/zod';
   import { z } from 'zod';
   import { useNavigation } from '@react-navigation/native';
   import { NativeStackNavigationProp } from '@react-navigation/native-stack';
   import { GroupsStackParamList } from '../../navigation/types';
   import { useGroups } from '../../hooks/useGroups';
   import { MemberSearchInput } from '../../components/groups/MemberSearchInput';
   import { COLORS } from '../../constants';

   type CreateGroupNavigationProp = NativeStackNavigationProp<
     GroupsStackParamList,
     'CreateGroup'
   >;

   const createGroupSchema = z.object({
     name: z.string().min(2, 'Group name must be at least 2 characters'),
     description: z.string().optional(),
   });

   type CreateGroupFormData = z.infer<typeof createGroupSchema>;

   export const CreateGroupScreen: React.FC = () => {
     const navigation = useNavigation<CreateGroupNavigationProp>();
     const { createGroup } = useGroups();
     const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
     const [isLoading, setIsLoading] = useState(false);

     const {
       control,
       handleSubmit,
       formState: { errors },
     } = useForm<CreateGroupFormData>({
       resolver: zodResolver(createGroupSchema),
       defaultValues: {
         name: '',
         description: '',
       },
     });

     const handleAddMember = (phoneNumber: string) => {
       if (!selectedMembers.includes(phoneNumber)) {
         setSelectedMembers([...selectedMembers, phoneNumber]);
       }
     };

     const handleRemoveMember = (phoneNumber: string) => {
       setSelectedMembers(selectedMembers.filter((p) => p !== phoneNumber));
     };

     const onSubmit = async (data: CreateGroupFormData) => {
       try {
         setIsLoading(true);
         const group = await createGroup(data.name, data.description || '', selectedMembers);
         Alert.alert('Success', 'Group created successfully!', [
           {
             text: 'OK',
             onPress: () => navigation.navigate('GroupDetails', { groupId: group.id }),
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
         <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
           <Controller
             control={control}
             name="name"
             render={({ field: { onChange, onBlur, value } }) => (
               <>
                 <TextInput
                   label="Group Name *"
                   mode="outlined"
                   value={value}
                   onChangeText={onChange}
                   onBlur={onBlur}
                   error={!!errors.name}
                   left={<TextInput.Icon icon="account-group" />}
                 />
                 {errors.name && (
                   <HelperText type="error">{errors.name.message}</HelperText>
                 )}
               </>
             )}
           />

           <Controller
             control={control}
             name="description"
             render={({ field: { onChange, onBlur, value } }) => (
               <TextInput
                 label="Description (Optional)"
                 mode="outlined"
                 value={value}
                 onChangeText={onChange}
                 onBlur={onBlur}
                 multiline
                 numberOfLines={3}
                 left={<TextInput.Icon icon="text" />}
                 style={styles.descriptionInput}
               />
             )}
           />

           <MemberSearchInput
             selectedMembers={selectedMembers}
             onAddMember={handleAddMember}
             onRemoveMember={handleRemoveMember}
           />

           <Button
             mode="contained"
             onPress={handleSubmit(onSubmit)}
             loading={isLoading}
             disabled={isLoading}
             style={styles.button}
           >
             Create Group
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
     descriptionInput: {
       height: 100,
     },
     button: {
       marginTop: 8,
       paddingVertical: 6,
     },
   });
   ```

#### Acceptance Criteria:
- [ ] Group name input with validation
- [ ] Description input (optional)
- [ ] Member search by phone number
- [ ] Selected members displayed as chips
- [ ] Create group functionality
- [ ] Loading state
- [ ] Navigate to group details after creation

---

### Task 4.4: Create Group Details Screen

**Duration**: 3-4 hours

#### Subtasks:

1. **Create Member List Item Component**

   **src/components/groups/MemberListItem.tsx**:
   ```typescript
   import React from 'react';
   import { StyleSheet, Alert } from 'react-native';
   import { List, Avatar, IconButton, Menu } from 'react-native-paper';
   import { MemberDetail } from '../../types';
   import { COLORS } from '../../constants';

   interface MemberListItemProps {
     member: MemberDetail;
     isCreator: boolean;
     canRemove: boolean;
     onRemove?: () => void;
   }

   export const MemberListItem: React.FC<MemberListItemProps> = ({
     member,
     isCreator,
     canRemove,
     onRemove,
   }) => {
     const [menuVisible, setMenuVisible] = React.useState(false);

     const handleRemove = () => {
       setMenuVisible(false);
       Alert.alert(
         'Remove Member',
         `Are you sure you want to remove ${member.displayName} from this group?`,
         [
           { text: 'Cancel', style: 'cancel' },
           {
             text: 'Remove',
             style: 'destructive',
             onPress: onRemove,
           },
         ]
       );
     };

     return (
       <List.Item
         title={member.displayName}
         description={member.phoneNumber}
         left={() =>
           member.photoURL ? (
             <Avatar.Image size={40} source={{ uri: member.photoURL }} style={styles.avatar} />
           ) : (
             <Avatar.Text
               size={40}
               label={member.displayName.charAt(0).toUpperCase()}
               style={styles.avatar}
             />
           )
         }
         right={() =>
           isCreator && canRemove ? (
             <Menu
               visible={menuVisible}
               onDismiss={() => setMenuVisible(false)}
               anchor={
                 <IconButton
                   icon="dots-vertical"
                   onPress={() => setMenuVisible(true)}
                 />
               }
             >
               <Menu.Item
                 onPress={handleRemove}
                 title="Remove from group"
                 leadingIcon="account-remove"
               />
             </Menu>
           ) : null
         }
       />
     );
   };

   const styles = StyleSheet.create({
     avatar: {
       marginLeft: 8,
       marginTop: 8,
     },
   });
   ```

2. **Create Group Details Screen**

   **src/screens/groups/GroupDetailsScreen.tsx**:
   ```typescript
   import React from 'react';
   import {
     View,
     StyleSheet,
     ScrollView,
     Alert,
   } from 'react-native';
   import { Text, Button, Divider, FAB, Menu } from 'react-native-paper';
   import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
   import { NativeStackNavigationProp } from '@react-navigation/native-stack';
   import { GroupsStackParamList } from '../../navigation/types';
   import { useGroup } from '../../hooks/useGroup';
   import { MemberListItem } from '../../components/groups/MemberListItem';
   import { Loading } from '../../components/common/Loading';
   import { COLORS } from '../../constants';
   import { useAuthStore } from '../../store/authStore';

   type GroupDetailsRouteProp = RouteProp<GroupsStackParamList, 'GroupDetails'>;
   type GroupDetailsNavigationProp = NativeStackNavigationProp<
     GroupsStackParamList,
     'GroupDetails'
   >;

   export const GroupDetailsScreen: React.FC = () => {
     const route = useRoute<GroupDetailsRouteProp>();
     const navigation = useNavigation<GroupDetailsNavigationProp>();
     const { groupId } = route.params;
     const { user } = useAuthStore();
     const { group, isLoading, isCreator, leaveGroup, deleteGroup, removeMember } =
       useGroup(groupId);

     const [menuVisible, setMenuVisible] = React.useState(false);

     const handleAddExpense = () => {
       Alert.alert('Coming Soon', 'Add expense feature will be available in Phase 5');
     };

     const handleEditGroup = () => {
       Alert.alert('Coming Soon', 'Edit group feature coming soon');
     };

     const handleAddMembers = () => {
       Alert.alert('Coming Soon', 'Add members feature coming soon');
     };

     const handleLeaveGroup = async () => {
       Alert.alert(
         'Leave Group',
         'Are you sure you want to leave this group?',
         [
           { text: 'Cancel', style: 'cancel' },
           {
             text: 'Leave',
             style: 'destructive',
             onPress: async () => {
               try {
                 await leaveGroup();
                 navigation.goBack();
                 Alert.alert('Success', 'You have left the group');
               } catch (error: any) {
                 Alert.alert('Error', error.message);
               }
             },
           },
         ]
       );
     };

     const handleDeleteGroup = async () => {
       Alert.alert(
         'Delete Group',
         'Are you sure you want to delete this group? This action cannot be undone.',
         [
           { text: 'Cancel', style: 'cancel' },
           {
             text: 'Delete',
             style: 'destructive',
             onPress: async () => {
               try {
                 await deleteGroup();
                 navigation.goBack();
                 Alert.alert('Success', 'Group deleted successfully');
               } catch (error: any) {
                 Alert.alert('Error', error.message);
               }
             },
           },
         ]
       );
     };

     const handleRemoveMember = async (memberId: string) => {
       try {
         await removeMember(memberId);
         Alert.alert('Success', 'Member removed from group');
       } catch (error: any) {
         Alert.alert('Error', error.message);
       }
     };

     React.useLayoutEffect(() => {
       navigation.setOptions({
         headerRight: () => (
           <Menu
             visible={menuVisible}
             onDismiss={() => setMenuVisible(false)}
             anchor={
               <IconButton
                 icon="dots-vertical"
                 iconColor={COLORS.white}
                 onPress={() => setMenuVisible(true)}
               />
             }
           >
             {isCreator && (
               <>
                 <Menu.Item onPress={handleEditGroup} title="Edit Group" leadingIcon="pencil" />
                 <Menu.Item
                   onPress={handleAddMembers}
                   title="Add Members"
                   leadingIcon="account-plus"
                 />
                 <Divider />
               </>
             )}
             {!isCreator && (
               <Menu.Item
                 onPress={handleLeaveGroup}
                 title="Leave Group"
                 leadingIcon="exit-to-app"
               />
             )}
             {isCreator && (
               <Menu.Item
                 onPress={handleDeleteGroup}
                 title="Delete Group"
                 leadingIcon="delete"
               />
             )}
           </Menu>
         ),
       });
     }, [navigation, menuVisible, isCreator]);

     if (isLoading || !group) {
       return <Loading />;
     }

     return (
       <View style={styles.container}>
         <ScrollView style={styles.content}>
           <View style={styles.header}>
             <Text variant="headlineSmall" style={styles.groupName}>
               {group.name}
             </Text>
             {group.description && (
               <Text variant="bodyMedium" style={styles.description}>
                 {group.description}
               </Text>
             )}
           </View>

           <View style={styles.section}>
             <Text variant="titleMedium" style={styles.sectionTitle}>
               Balances
             </Text>
             <View style={styles.balanceCard}>
               <Text variant="bodyLarge" style={styles.balanceText}>
                 No expenses yet
               </Text>
               <Text variant="bodySmall" style={styles.balanceSubtext}>
                 Add an expense to start tracking
               </Text>
             </View>
           </View>

           <View style={styles.section}>
             <View style={styles.sectionHeader}>
               <Text variant="titleMedium" style={styles.sectionTitle}>
                 Members ({group.members.length})
               </Text>
             </View>
             {group.memberDetails.map((member) => (
               <MemberListItem
                 key={member.userId}
                 member={member}
                 isCreator={isCreator}
                 canRemove={member.userId !== group.createdBy}
                 onRemove={() => handleRemoveMember(member.userId)}
               />
             ))}
           </View>

           <View style={styles.section}>
             <Text variant="titleMedium" style={styles.sectionTitle}>
               Expenses
             </Text>
             <View style={styles.emptyState}>
               <Text variant="bodyLarge" style={styles.emptyText}>
                 No expenses yet
               </Text>
               <Text variant="bodySmall" style={styles.emptySubtext}>
                 Tap the + button to add an expense
               </Text>
             </View>
           </View>
         </ScrollView>

         <FAB
           icon="plus"
           style={styles.fab}
           onPress={handleAddExpense}
           label="Add Expense"
         />
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
     },
     header: {
       backgroundColor: COLORS.white,
       padding: 20,
       marginBottom: 16,
     },
     groupName: {
       fontWeight: 'bold',
       marginBottom: 8,
     },
     description: {
       color: COLORS.dark,
       opacity: 0.7,
     },
     section: {
       backgroundColor: COLORS.white,
       marginBottom: 16,
       paddingVertical: 16,
     },
     sectionHeader: {
       flexDirection: 'row',
       justifyContent: 'space-between',
       alignItems: 'center',
       paddingHorizontal: 16,
       marginBottom: 8,
     },
     sectionTitle: {
       fontWeight: 'bold',
       paddingHorizontal: 16,
       marginBottom: 12,
     },
     balanceCard: {
       paddingHorizontal: 16,
       paddingVertical: 24,
       alignItems: 'center',
     },
     balanceText: {
       color: COLORS.dark,
       marginBottom: 4,
     },
     balanceSubtext: {
       color: COLORS.dark,
       opacity: 0.6,
     },
     emptyState: {
       paddingVertical: 32,
       paddingHorizontal: 16,
       alignItems: 'center',
     },
     emptyText: {
       color: COLORS.dark,
       marginBottom: 4,
     },
     emptySubtext: {
       color: COLORS.dark,
       opacity: 0.6,
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
- [ ] Display group name and description
- [ ] Show all members with avatars
- [ ] Creator can remove members
- [ ] Balances section (placeholder for Phase 5)
- [ ] Expenses section (placeholder for Phase 5)
- [ ] Menu with edit/leave/delete options
- [ ] FAB for adding expenses
- [ ] Real-time updates when group changes

---

### Task 4.5: Update Groups Navigator

**Duration**: 30 minutes

#### Subtasks:

1. **Add New Screens to Navigator**

   **src/navigation/GroupsNavigator.tsx**:
   ```typescript
   import React from 'react';
   import { createStackNavigator } from '@react-navigation/stack';
   import { IconButton } from 'react-native-paper';
   import { GroupsStackParamList } from './types';
   import { GroupsListScreen } from '../screens/groups/GroupsListScreen';
   import { GroupDetailsScreen } from '../screens/groups/GroupDetailsScreen';
   import { CreateGroupScreen } from '../screens/groups/CreateGroupScreen';
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
         <Stack.Screen
           name="GroupDetails"
           component={GroupDetailsScreen}
           options={{ title: 'Group Details' }}
         />
         <Stack.Screen
           name="CreateGroup"
           component={CreateGroupScreen}
           options={{ title: 'Create Group' }}
         />
       </Stack.Navigator>
     );
   };
   ```

2. **Update Groups List Screen Navigation**

   Update the FAB button in `GroupsListScreen.tsx`:
   ```typescript
   const handleCreateGroup = () => {
     navigation.navigate('CreateGroup');
   };
   ```

#### Acceptance Criteria:
- [ ] All group screens added to navigator
- [ ] Navigation between screens works
- [ ] Proper headers for each screen

---

### Task 4.6: Update Firebase Security Rules

**Duration**: 30 minutes

#### Subtasks:

1. **Update Firestore Security Rules**

   Add these rules in Firebase Console > Firestore > Rules:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {

       // Users collection
       match /users/{userId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && request.auth.uid == userId;
       }

       // Groups collection
       match /groups/{groupId} {
         // Members can read group data
         allow read: if request.auth != null &&
                        request.auth.uid in resource.data.members;

         // Any authenticated user can create a group
         allow create: if request.auth != null &&
                          request.auth.uid in request.resource.data.members;

         // Only members can update group
         allow update: if request.auth != null &&
                          request.auth.uid in resource.data.members;

         // Only creator can delete group
         allow delete: if request.auth != null &&
                          request.auth.uid == resource.data.createdBy;
       }
     }
   }
   ```

#### Acceptance Criteria:
- [ ] Security rules prevent unauthorized access
- [ ] Only members can read/update groups
- [ ] Only creator can delete groups

---

## Testing & Verification

### Manual Testing Checklist

**Group Creation:**
- [ ] Create group with just name
- [ ] Create group with name and description
- [ ] Add members by searching phone number
- [ ] Create group without members (should include creator)
- [ ] Verify group appears in groups list
- [ ] Verify all members see the group

**Group Details:**
- [ ] View group details
- [ ] See all members listed
- [ ] Creator sees edit/delete options
- [ ] Non-creator sees leave option
- [ ] Real-time updates when member joins/leaves

**Member Management:**
- [ ] Creator can remove members
- [ ] Cannot remove creator
- [ ] Leave group as non-creator
- [ ] Verify removed member no longer sees group

**Group Deletion:**
- [ ] Creator can delete group
- [ ] Non-creator cannot delete
- [ ] Deleted group removed from all members' lists

### Integration Tests

```typescript
// To be implemented in Phase 7

describe('Group Management', () => {
  it('should create a group', async () => {});
  it('should add members to group', async () => {});
  it('should remove member from group', async () => {});
  it('should delete group', async () => {});
});
```

---

## Common Issues & Troubleshooting

### Issue 1: Members Not Found
**Solution:**
- User must be registered in the app first
- Phone number must match exactly (including country code)
- Check users collection in Firestore

### Issue 2: Real-time Updates Not Working
**Solution:**
- Verify Firestore listeners are set up correctly
- Check Firebase security rules allow reads
- Ensure cleanup functions return unsubscribe

### Issue 3: Cannot Delete Group
**Solution:**
- Only creator can delete
- Check user ID matches createdBy field
- Verify security rules

---

## Success Criteria

Phase 4 is complete when:

1. ✅ Users can create groups with name and description
2. ✅ Users can search and add members by phone number
3. ✅ Groups list displays all user's groups
4. ✅ Group details show members and info
5. ✅ Creator can edit group details
6. ✅ Creator can add/remove members
7. ✅ Creator can delete group
8. ✅ Non-creators can leave group
9. ✅ Real-time updates work for groups
10. ✅ Firebase security rules protect data
11. ✅ Clean UI with proper navigation
12. ✅ Error handling for all operations

---

## Handoff to Phase 5

**What's Ready:**
- Complete group management system
- Member management
- Real-time group updates
- Groups ready to hold expenses
- UI foundation for expense features

**Next Phase:** Phase 5 will implement expense management - adding expenses, splitting them among members, viewing expense history, and calculating balances.

---

## Estimated Time Breakdown

| Task | Estimated Time |
|------|---------------|
| 4.1 Groups Firebase Service | 2 hours |
| 4.2 Group Hooks | 1 hour |
| 4.3 Create Group Screen | 3 hours |
| 4.4 Group Details Screen | 3-4 hours |
| 4.5 Update Navigator | 30 minutes |
| 4.6 Security Rules | 30 minutes |
| Testing & Bug Fixes | 2 hours |
| **Total** | **12-13 hours** |

Can be completed in 1.5-2 working days or spread across a week working part-time.
