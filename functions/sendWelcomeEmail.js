// functions/sendWelcomeEmail.js
const functions = require("firebase-functions");
const nodemailer = require("nodemailer");

const SMTP_KEY = functions.config().brevo.key;

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: "officialtrackrepost@gmail.com",
    pass: SMTP_KEY,
  },
});

exports.sendWelcomeEmail = functions.auth.user().onCreate(async (user) => {
  const mailOptions = {
    from: '"TrackRepost" <officialtrackrepost@gmail.com>',
    to: user.email,
    subject: "👋 Welcome to TrackRepost!",
    html: `
      <h2>Welcome to TrackRepost 🎶</h2>
      <p>Hey ${user.displayName || "there"},</p>
      <p>Thanks for signing up! You’ve been awarded <strong>30 free credits</strong> to get started.</p>
      <p>Start promoting your music or earning more credits by supporting other artists today.</p>
      <br/>
      <p style="font-size: 14px; color: gray;">© 2025 TrackRepost. All rights reserved.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${user.email}`);
  } catch (err) {
    console.error(`❌ Failed to send welcome email to ${user.email}`, err);
  }
});

