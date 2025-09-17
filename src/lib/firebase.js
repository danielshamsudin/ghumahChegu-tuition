// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDrhzrIBeXhk1A8PcnS5N8NUTUPKxOPHkQ",
  authDomain: "ghumahchegu-tuition.firebaseapp.com",
  projectId: "ghumahchegu-tuition",
  storageBucket: "ghumahchegu-tuition.firebasestorage.app",
  messagingSenderId: "664019611663",
  appId: "1:664019611663:web:f21acc3ee0051b3283337a"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
