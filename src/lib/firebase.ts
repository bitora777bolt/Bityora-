import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  onSnapshot,
  updateDoc,
  increment,
  serverTimestamp,
  getDocFromServer,
} from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';

export const firebaseConfig = {
  apiKey: "AIzaSyAGzk8aI3e-AKpNEDRbsKDPDO0eIg79aMw",
  authDomain: "bityora.firebaseapp.com",
  projectId: "bityora",
  storageBucket: "bityora.firebasestorage.app",
  messagingSenderId: "706352651228",
  appId: "1:706352651228:web:ff5bc93269ed3c98a4cd19",
  measurementId: "G-GCE4DKNQ13"
};

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export {
  collection,
  doc,
  setDoc,
  onSnapshot,
  updateDoc,
  increment,
  serverTimestamp,
};

// Initialize Analytics safely
export let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch((err) => {
      console.warn('Firebase Analytics not supported in this runtime environment:', err);
    });
}

// Connection verification test per skill guidelines
async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection check: client is offline or network constrained.');
    }
  }
}

if (typeof window !== 'undefined') {
  testFirestoreConnection();
}

export default app;
