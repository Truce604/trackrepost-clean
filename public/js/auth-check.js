// public/js/auth-check.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ✅ Use window.firebaseConfig which is loaded via <script> before this
const app = initializeApp(window.firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// ✅ Auth listener
onAuthStateChanged(auth, async (user) => {
  const loginUI = document.getElementById("login-ui");

  if (user) {
    if (loginUI) loginUI.style.display = "none";

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        displayName: user.displayName || "",
        email: user.email || "",
        credits: 30,
        plan: "Free",
        createdAt: serverTimestamp()
      });
      console.log("✅ New user created in Firestore");
    } else {
      console.log("✅ Existing user loaded");
    }

  } else {
    if (loginUI) loginUI.style.display = "block";

    // ❌ Redirect if not logged in and not on public pages
    const publicPages = ["/", "/index.html", "/connect-soundcloud.html"];
    const currentPath = window.location.pathname;

    if (!publicPages.includes(currentPath)) {
      console.warn("⛔ Not authenticated, redirecting to home.");
      window.location.href = "/index.html";
    }
  }
});

// ✅ Login button logic
window.loginWithGoogle = async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    console.error("❌ Login failed:", err);
    alert("Google login failed. Please try again.");
  }
};

