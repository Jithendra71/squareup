import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { firestore } from '../../config/firebase';
import { User } from '../../types';
import { handleFirebaseError } from '../../utils/errorHandler';

export const authService = {
  /**
   * Send OTP to phone number
   */
  async sendOTP(phoneNumber: string): Promise<string> {
    try {
      // Format phone number with country code if not present
      const formattedPhone = phoneNumber.startsWith('+')
        ? phoneNumber
        : `+91${phoneNumber}`; // Default to India, adjust as needed

      const confirmation = await auth().signInWithPhoneNumber(formattedPhone);

      if (!confirmation.verificationId) {
        throw new Error('Failed to get verification ID');
      }

      return confirmation.verificationId;
    } catch (error: any) {
      throw new Error(handleFirebaseError(error));
    }
  },

  /**
   * Verify OTP code
   */
  async verifyOTP(verificationId: string, code: string): Promise<FirebaseAuthTypes.UserCredential> {
    try {
      const credential = auth.PhoneAuthProvider.credential(verificationId, code);
      const userCredential = await auth().signInWithCredential(credential);
      return userCredential;
    } catch (error: any) {
      throw new Error(handleFirebaseError(error));
    }
  },

  /**
   * Check if user profile exists and is complete
   */
  async checkUserProfile(userId: string): Promise<User | null> {
    try {
      const userDoc = await firestore().collection('users').doc(userId).get();

      if (!userDoc.exists) {
        return null;
      }

      const userData = userDoc.data()!;

      // Check if profile is complete
      if (!userData.displayName) {
        return null;
      }

      return {
        id: userDoc.id,
        phoneNumber: userData.phoneNumber,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        createdAt: userData.createdAt?.toDate() || new Date(),
      };
    } catch (error: any) {
      console.error('Error checking user profile:', error);
      return null;
    }
  },

  /**
   * Create or update user profile
   */
  async updateUserProfile(userId: string, data: {
    phoneNumber: string;
    displayName?: string;
    photoURL?: string;
  }): Promise<User> {
    try {
      const userRef = firestore().collection('users').doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        // Create new user
        await userRef.set({
          phoneNumber: data.phoneNumber,
          displayName: data.displayName || '',
          photoURL: data.photoURL || '',
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      } else {
        // Update existing user
        await userRef.update({
          displayName: data.displayName,
          photoURL: data.photoURL,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      }

      return {
        id: userId,
        phoneNumber: data.phoneNumber,
        displayName: data.displayName || '',
        photoURL: data.photoURL,
        createdAt: new Date(),
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
        phoneNumber: userData.phoneNumber || currentUser.phoneNumber || '',
        displayName: userData.displayName || '',
        photoURL: userData.photoURL,
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
