import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyAoupNW80cAR_xG6ZMwNfPLeS3C9Gq6GuY",
  authDomain: "image-processing-91709.firebaseapp.com",
  projectId: "image-processing-91709",
  storageBucket: "image-processing-91709.firebasestorage.app",
  messagingSenderId: "529508238154",
  appId: "1:529508238154:web:941462bc79bed566f077b3",
  measurementId: "G-NLCGJ32V6K"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => { });
}

googleProvider.setCustomParameters({
  prompt: 'select_account'
});


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
