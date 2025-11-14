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
