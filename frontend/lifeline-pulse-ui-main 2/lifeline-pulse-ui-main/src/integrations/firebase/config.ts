// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableNetwork, disableNetwork } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBovot4J8xzHlDwQfRheQ4amC79A-o84tQ",
  authDomain: "life-line-9ad7e.firebaseapp.com",
  projectId: "life-line-9ad7e",
  storageBucket: "life-line-9ad7e.firebasestorage.app",
  messagingSenderId: "454696338577",
  appId: "1:454696338577:web:160dfc025800221a98eb30",
  measurementId: "G-HS49F876XS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Analytics (optional)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Enable offline persistence for Firestore
export const enableOffline = () => disableNetwork(db);
export const enableOnline = () => enableNetwork(db);
