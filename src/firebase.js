// ─────────────────────────────────────────────────────────────
//  🔥 FIREBASE — Colle ici ta configuration Firebase
//  (tu la trouveras à l'étape 2 du guide)
// ─────────────────────────────────────────────────────────────
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey:            "COLLE_TON_API_KEY_ICI",
  authDomain:        "COLLE_TON_AUTH_DOMAIN_ICI",
  databaseURL:       "COLLE_TON_DATABASE_URL_ICI",
  projectId:         "COLLE_TON_PROJECT_ID_ICI",
  storageBucket:     "COLLE_TON_STORAGE_BUCKET_ICI",
  messagingSenderId: "COLLE_TON_MESSAGING_SENDER_ID_ICI",
  appId:             "COLLE_TON_APP_ID_ICI",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
