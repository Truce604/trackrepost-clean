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
import { firebaseConfig } from "../firebaseConfig.js";

// 🔥 Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// 🌐 Auth State Listener
onAuthStateChanged(auth, async (user) => {
  const loginUI = document.getElementById("login-ui");

  if (user) {
    if (loginUI) loginUI.style.display = "none";

    // ✅ Check if user exists in Firestore, if not — create
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        displayName: user.displayName || "",
        email: user.email || "",
        credits: 30, // initial credits
        plan: "Free",
        createdAt: serverTimestamp()
      });
      console.log("✅ New user created in Firestore");
    } else {
      console.log("✅ Existing user loaded");
    }

  } else {
    if (loginUI) loginUI.style.display = "block";

    // 🚪 Force redirect to index.html if not logged in
    const publicPages = ["/index.html", "/", "/connect-soundcloud.html"];
    if (!publicPages.includes(window.location.pathname)) {
      window.location.href = "/index.html";
    }
  }
});

// 🧠 Expose login trigger for use in login button
window.loginWithGoogle = async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    console.error("❌ Login failed:", err);
    alert("Google login failed. Please try again.");
  }
};
