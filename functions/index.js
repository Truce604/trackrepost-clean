const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// Assign 30 credits to new users on signup
exports.assignCreditsOnSignup = functions.auth.user().onCreate(async (user) => {
  const uid = user.uid;

  await db.collection("users").doc(uid).set({
    credits: 30,
    createdAt: new Date(),
    email: user.email || null,
    displayName: user.displayName || null,
  }, { merge: true });
});

// Test function
exports.helloWorld = functions.https.onRequest((req, res) => {
  res.send("Hello from TrackRepost Firebase Functions!");
});

