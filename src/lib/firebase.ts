import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  updateDoc,
  increment,
  serverTimestamp,
  getDocFromServer,
} from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  uploadString,
  getDownloadURL,
} from 'firebase/storage';
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

export const PROVISIONED_FIRESTORE_DB_ID =
  'ai-studio-bitoragamingsuit-cde12368-3d1d-4042-b2d3-12f91544b816';

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const provisionedDb = getFirestore(app, PROVISIONED_FIRESTORE_DB_ID);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export {
  collection,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  updateDoc,
  increment,
  serverTimestamp,
  storageRef,
  uploadBytes,
  uploadString,
  getDownloadURL,
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
