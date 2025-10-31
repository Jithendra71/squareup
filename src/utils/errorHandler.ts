export const handleFirebaseError = (error: any): string => {
  switch (error.code) {
    case 'auth/user-not-found':
      return 'No user found with this email';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/email-already-in-use':
      return 'Email already in use';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters';
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection';
    default:
      return error.message || 'An error occurred';
  }
};
