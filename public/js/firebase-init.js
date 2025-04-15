// ✅ Firebase SDKs must be loaded in HTML first:
// <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
// <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"></script>
// <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js"></script>

// ✅ Initialize Firebase App using window.firebaseConfig
firebase.initializeApp(window.firebaseConfig);

// ✅ Initialize and expose Firebase services
const db = firebase.firestore();
const auth = firebase.auth();

window.db = db;
window.auth = auth;

console.log("✅ Firebase initialized");

