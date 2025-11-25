// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBxcr0rxerUjoPssaLsB4o0syBKV2EJWWs",
  authDomain: "movie-night-tracker-1b0d4.firebaseapp.com",
  projectId: "movie-night-tracker-1b0d4",
  storageBucket: "movie-night-tracker-1b0d4.firebasestorage.app",
  messagingSenderId: "525367378500",
  appId: "1:525367378500:web:72d43e57300560959ff211",
  measurementId: "G-69QM0X3FJ1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (only in browser)
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Initialize Firestore and export it
export const db = getFirestore(app);

export { app, analytics };