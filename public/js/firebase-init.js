// ✅ Firebase SDKs must be loaded in HTML before this file:
// <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
// <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"></script>
// <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js"></script>

// ✅ Guard to prevent duplicate init
if (!firebase.apps.length) {
  firebase.initializeApp(window.firebaseConfig);
  console.log("✅ Firebase initialized");
} else {
  firebase.app();
  console.log("⚠️ Firebase already initialized");
}

// ✅ Initialize and expose Firebase services
const db = firebase.firestore();
const auth = firebase.auth();

window.db = db;
window.auth = auth;

