import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAoupNW80cAR_xG6ZMwNfPLeS3C9Gq6GuY",
  authDomain: "image-processing-91709.firebaseapp.com",
  projectId: "image-processing-91709",
  storageBucket: "image-processing-91709.firebasestorage.app",
  messagingSenderId: "529508238154",
  appId: "1:529508238154:web:941462bc79bed566f077b3",
  measurementId: "G-NLCGJ32V6K"
};

// Initialize Firebase safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Analytics when supported in browser environment
export let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

// Custom parameters to prompt user account selection
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Sign in using Firebase Google Auth popup
 * Returns the verified user details and ID Token to send to the backend
 */
export const signInWithGoogleFirebase = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  const idToken = await user.getIdToken();

  return {
    idToken,
    email: user.email,
    name: user.displayName || '',
    avatar: user.photoURL || '',
    googleId: user.uid,
  };
};

export default app;
