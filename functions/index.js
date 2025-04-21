const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { FieldValue } = admin.firestore;

admin.initializeApp();

const db = admin.firestore();

exports.assignCreditsOnSignup = functions.auth.user().onCreate(async (user) => {
  if (!user) {
    console.error('User object is null or undefined');
    return;
  }

  const { uid, email, displayName } = user;

  const userData = {
    email: email || "",
    displayName: displayName || "",
    createdAt: FieldValue.serverTimestamp(),
    credits: 30,
    isPro: false,
    plan: "Free",
    badge: {
      name: "Rookie",
      emoji: "🟢",
      level: 1
    },
    soundcloud: {
      handle: "",
      url: "",
      followers: 0
    },
    usedCoupons: []
  };

  try {
    await db.collection("users").doc(uid).set(userData);
    console.log(`✅ New user initialized: ${email}`);
  } catch (error) {
    console.error("Error creating new user:", error);
  }
});

exports.squareWebhook = functions.https.onRequest(async (req, res) => {
  const signature = req.headers["square-signature"];
  const body = req.rawBody.toString();
  const webhookUrl = "https://us-central1-your-project-id.cloudfunctions.net/squareWebhook";

  // Verify the signature
  const isValidSignature = validateSquareSignature(signature, body);
  if (!isValidSignature) {
    console.error("Invalid Square webhook signature");
    res.status(403).send("Invalid signature");
    return;
  }

  // Process the webhook event
  try {
    const eventData = JSON.parse(body);
    const userId = eventData.data.object.note.includes("userId=") ? eventData.data.object.note.split("userId=")[1] : null;
    const credits = eventData.data.object.amount_money.amount / 100; // Assuming amount is in cents

    if (userId) {
      // Update user's credits in Firestore
      const userRef = db.collection("users").doc(userId);
      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
          throw new Error(`User with ID ${userId} not found`);
        }

        const newCredits = userDoc.data().credits + credits;
        transaction.update(userRef, { credits: newCredits });
      });

      console.log(`✅ Credits updated for user ID ${userId}: +${credits}`);
    }

    res.status(200).end();
  } catch (error) {
    console.error("Error processing Square webhook:", error);
    res.status(500).send("Error processing webhook");
  }
});

function validateSquareSignature(signature, body) {
  const crypto = require("crypto");
  const hmac = crypto.createHmac("sha256", functions.config().square.webhook_signature_key);
  const expectedSignature = hmac.update(body).digest("base64");

  return signature === expectedSignature;
}








