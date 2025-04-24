const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const squareConnect = require("square-connect");

admin.initializeApp();
const db = admin.firestore();

// 🔐 Get from Firebase config
const accessToken = functions.config().square.access_token;
const locationId = functions.config().square.location_id;

if (!accessToken || !locationId) {
  console.error("❌ Missing SQUARE_ACCESS_TOKEN or SQUARE_LOCATION_ID from config.");
}

// ✅ Square setup
const defaultClient = squareConnect.ApiClient.instance;
defaultClient.basePath = "https://connect.squareup.com";
defaultClient.authentications["oauth2"].accessToken = accessToken;

// ✅ Express app for createCheckout
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.post("/", async (req, res) => {
  try {
    const { credits, userId, plan } = req.body;

    if (!credits || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const checkoutApi = new squareConnect.CheckoutApi();

    const body = {
      idempotency_key: uuidv4(),
      order: {
        order: {
          location_id: locationId,
          line_items: [
            {
              name: `${credits} Credits`,
              quantity: "1",
              base_price_money: {
                amount: credits * 10, // Example: 1000 = $10.00 CAD
                currency: "CAD",
              },
            },
          ],
        },
      },
      ask_for_shipping_address: false,
      redirect_url: "https://www.trackrepost.com/payment-success",
      note: `${credits} Credits Purchase for userId=${userId}${plan ? ` Plan=${plan}` : ""}`,
    };

    console.log("💳 Creating checkout with body:", body);

    const response = await checkoutApi.createCheckout(locationId, body);
    return res.json({ checkoutUrl: response.checkout.checkout_page_url });
  } catch (err) {
    console.error("❌ Failed to create checkout:", err);
    return res.status(500).json({ error: "Failed to create checkout" });
  }
});

exports.createCheckout = functions.https.onRequest(app);

// ✅ Correct v1 auth trigger (fixes your error!)
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
    usedCoupons: [],
  }, { merge: true });

  console.log(`✅ Initialized user ${user.uid} with 30 credits`);
});











