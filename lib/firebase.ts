// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBnonkmR14dJ9RMt57IwPwk_lmWxYfZcSY",
  authDomain: "cashflowtodo.firebaseapp.com",
  projectId: "cashflowtodo",
  storageBucket: "cashflowtodo.firebasestorage.app",
  messagingSenderId: "169869772410",
  appId: "1:169869772410:web:de56a064c0415664729dc3",
  measurementId: "G-SRDRPM6S8W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;