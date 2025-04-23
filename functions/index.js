// index.js (CommonJS + Gen 1 only)

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const squareConnect = require("square-connect");

// 🔥 Init Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// 🔐 Load Square config from Firebase functions:config
const square = functions.config().square || {};
const accessToken = square.access_token;
const locationId = square.location_id;

if (!accessToken || !locationId) {
  console.error("❌ Missing Square config. Run: firebase functions:config:set square.access_token=... square.location_id=...");
}

// 💳 Square SDK setup
const client = squareConnect.ApiClient.instance;
client.basePath = "https://connect.squareup.com";
client.authentications["oauth2"].accessToken = accessToken;
const checkoutApi = new squareConnect.CheckoutApi();

// 🚀 Express app
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.post("/checkout", async (req, res) => {
  try {
    const { credits, userId, plan } = req.body;
    if (!credits || credits <= 0 || !userId) {
      return res.status(400).json({ error: "Invalid credits or userId" });
    }

    const body = {
      idempotency_key: uuidv4(),
      order: {
        order: {
          location_id: locationId,
          line_items: [{
            name: `${credits} Credits`,
            quantity: "1",
            base_price_money: { amount: credits * 10, currency: "CAD" }
          }]
        }
      },
      ask_for_shipping_address: false,
      redirect_url: "https://www.trackrepost.com/payment-success",
      note: `${credits} credits for user ${userId}${plan ? ` plan=${plan}` : ""}`
    };

    const response = await checkoutApi.createCheckout(locationId, body);
    return res.json({ checkoutUrl: response.checkout.checkout_page_url });
  } catch (err) {
    console.error("❌ Checkout failed:", err.message);
    return res.status(500).json({ error: "Checkout failed" });
  }
});

// ✅ Gen 1: HTTPS Cloud Function
exports.createCheckout = functions.https.onRequest(app);

// ✅ Gen 1: Auth Trigger to Assign Credits
exports.assignCreditsOnSignup = functions.auth.user().onCreate(async (user) => {
  const userRef = db.collection("users").doc(user.uid);
  await userRef.set({
    email: user.email || "",
    displayName: user.displayName || "",
    credits: 30,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    isPro: false,
    plan: "Free",
    badge: { emoji: "🟢", name: "Rookie", level: 1 },
    soundcloud: { handle: "", url: "", followers: 0 },
    usedCoupons: []
  }, { merge: true });

  console.log(`✅ Initialized ${user.uid} with 30 credits`);
});









