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
