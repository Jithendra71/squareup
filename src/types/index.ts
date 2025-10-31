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
