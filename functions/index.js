import { onUserCreated } from 'firebase-functions/v2/auth';
import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import functions from 'firebase-functions';
import nodemailer from 'nodemailer';

initializeApp();
const db = getFirestore();

// ✅ Assign 30 credits to new users on signup
export const assignCreditsOnSignup = onUserCreated(async (event) => {
  const user = event.data;
  const uid = user.uid;

  await db.collection('users').doc(uid).set({
    credits: 30,
    createdAt: new Date(),
    email: user.email || null,
    displayName: user.displayName || null,
  }, { merge: true });

  // ✅ Send welcome email
  const mailTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'officialtrackrepost@gmail.com',
      pass: functions.config().gmail.password,
    },
  });

  const mailOptions = {
    from: 'TrackRepost <officialtrackrepost@gmail.com>',
    to: user.email,
    subject: '🔥 Welcome to TrackRepost!',
    text: `Hey ${user.displayName || 'friend'} 👋\n\nWelcome to TrackRepost! You've been credited with 30 credits to get started. Submit your first campaign and let the reposts roll in!\n\n🚀 Let’s go!`,
  };

  if (user.email) {
    try {
      await mailTransport.sendMail(mailOptions);
      console.log(`✅ Welcome email sent to ${user.email}`);
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error);
    }
  }
});

// ✅ Simple test route
export const helloWorld = onRequest((req, res) => {
  res.send("Hello from TrackRepost Firebase Functions!");
});
