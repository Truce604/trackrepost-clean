// ✅ Initialize Firebase using modular SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
  getAuth
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// ✅ Firebase config must be attached to window.firebaseConfig beforehand
const app = initializeApp(window.firebaseConfig);

// ✅ Export initialized Firebase services
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };

