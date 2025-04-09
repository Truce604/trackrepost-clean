import functions from 'firebase-functions';
import admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

// Assign 30 credits to new users on signup
export const assignCreditsOnSignup = functions.auth.user().onCreate(async (user) => {
  const uid = user.uid;

  await db.collection('users').doc(uid).set({
    credits: 30,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    email: user.email || null,
    displayName: user.displayName || null,
  }, { merge: true });
});

// Test endpoint (optional)
export const helloWorld = functions.https.onRequest((req, res) => {
  res.send("Hello from TrackRepost Firebase Functions!");
});
