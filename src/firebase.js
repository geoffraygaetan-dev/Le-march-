import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyA99en40UOSz1ZGiIddEcXOUmh4FCre29w",
  authDomain: "liste-de-courses-95459.firebaseapp.com",
  databaseURL: "https://liste-de-courses-95459-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "liste-de-courses-95459",
  storageBucket: "liste-de-courses-95459.firebasestorage.app",
  messagingSenderId: "850115175726",
  appId: "1:850115175726:web:44dc21b7cac1b5ebe046bf",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
