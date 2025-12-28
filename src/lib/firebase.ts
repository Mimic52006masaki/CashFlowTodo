import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG!);
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const appId = process.env.NEXT_PUBLIC_APP_ID || 'cashflow-todo-app';
export const initialAuthToken = process.env.NEXT_PUBLIC_INITIAL_AUTH_TOKEN;