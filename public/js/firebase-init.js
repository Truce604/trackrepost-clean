// ✅ firebase-init.js

// Ensure Firebase SDKs are loaded in the HTML BEFORE this file:
// <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
// <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"></script>
// <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js"></script>

// ✅ Prevent Firebase from initializing multiple times
if (!firebase.apps.length) {
  firebase.initializeApp(window.firebaseConfig);
  console.log("✅ Firebase initialized");
} else {
  console.log("⚠️ Firebase already initialized");
}

// ✅ Setup Firebase services
const db = firebase.firestore();
const auth = firebase.auth();

// ✅ Make services globally accessible
window.db = db;
window.auth = auth;

console.log("✅ Firebase services exposed globally");

