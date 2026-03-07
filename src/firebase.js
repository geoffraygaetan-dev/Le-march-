// ─────────────────────────────────────────────────────────────
//  🔥 FIREBASE — Colle ici ta configuration Firebase
//  (tu la trouveras à l'étape 2 du guide)
// ─────────────────────────────────────────────────────────────
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey:            "AIzaSyB3xK7mPqRt2...",
  authDomain:        "le-marche.firebaseapp.com",
  databaseURL:       "https://le-marche-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:         "le-marche",
  storageBucket:     "le-marche.appspot.com",
  messagingSenderId: "123456789012",
  appId:             "1:123456:web:abc123..."
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
