// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD559yiYSm_tj9PEwJvnqI9Q5_BH7H4uVE",
  authDomain: "c-tech-employee.firebaseapp.com",
  projectId: "c-tech-employee",
  storageBucket: "c-tech-employee.firebasestorage.app",
  messagingSenderId: "232353794654",
  appId: "1:232353794654:web:ef23f159c25dbdba8c42cf"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);


export const API_BASE_URL = "http://localhost:8085/"