const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const squareConnect = require("square-connect");

admin.initializeApp();
const db = admin.firestore();

// === ENV VARIABLES ===
const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID;

if (!SQUARE_ACCESS_TOKEN || !SQUARE_LOCATION_ID) {
  console.error("❌ Missing SQUARE_ACCESS_TOKEN or SQUARE_LOCATION_ID");
}

// === Square Setup ===
const defaultClient = squareConnect.ApiClient.instance;
defaultClient.basePath = "https://connect.squareup.com";
const oauth2 = defaultClient.authentications["oauth2"];
oauth2.accessToken = SQUARE_ACCESS_TOKEN;
const checkoutApi = new squareConnect.CheckoutApi();

// === Express App for createCheckout ===
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.post("/", async (req, res) => {
  try {
    const { credits, userId, plan } = req.body;

    if (!credits || typeof credits !== "number" || credits <= 0) {
      return res.status(400).json({ error: "Invalid credits value" });
    }

    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      return res.status(400).json({ error: "Invalid userId" });
    }

    const requestBody = {
      idempotency_key: uuidv4(),
      order: {
        order: {
          location_id: SQUARE_LOCATION_ID,
          line_items: [
            {
              name: `${credits} Credits`,
              quantity: "1",
              base_price_money: {
                amount: credits * 10,
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

    console.log("💳 Creating checkout with body:", requestBody);

    const response = await checkoutApi.createCheckout(SQUARE_LOCATION_ID, requestBody);
    const checkoutUrl = response.checkout.checkout_page_url;

    return res.json({ checkoutUrl });
  } catch (e) {
    console.error("❌ Failed to create checkout:", e.message, e.stack);
    return res.status(500).json({ error: "Checkout failed: " + e.message });
  }
});

exports.createCheckout = functions.https.onRequest(app);

// === Auth Trigger for New Users ===
exports.assignCreditsOnSignup = functions.auth.user().onCreate(async (user) => {
  const userRef = db.collection("users").doc(user.uid);

  await userRef.set(
    {
      email: user.email || "",
      displayName: user.displayName || "",
      credits: 30,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isPro: false,
      plan: "Free",
      badge: { emoji: "🟢", name: "Rookie", level: 1 },
      soundcloud: { handle: "", url: "", followers: 0 },
      usedCoupons: [],
    },
    { merge: true }
  );

  console.log(`✅ Initialized ${user.uid} with 30 credits`);
});











