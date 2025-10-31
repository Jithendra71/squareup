export const handleFirebaseError = (error: any): string => {
  switch (error.code) {
    case 'auth/user-not-found':
      return 'No user found with this phone number';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/phone-number-already-in-use':
      return 'Phone number already in use';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters';
    case 'auth/invalid-phone-number':
      return 'Invalid phone number';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection';
    default:
      return error.message || 'An error occurred';
  }
};
