// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);