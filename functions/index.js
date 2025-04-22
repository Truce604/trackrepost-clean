// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const { v4: uuidv4 } = require("uuid");
const squareConnect = require("square-connect");

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Initialize Square SDK
const defaultClient = squareConnect.ApiClient.instance;
defaultClient.basePath = "https://connect.squareup.com";
const oauth2 = defaultClient.authentications["oauth2"];
oauth2.accessToken = functions.config().square.access_token;
const checkoutApi = new squareConnect.CheckoutApi();

// Gen 2–style HTTPS (still works under CommonJS)
const createCheckout = functions
  .https
  .onRequest((req, res) => {
    cors(req, res, async () => {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
      }

      try {
        const { credits, userId, plan } = req.body;
        const locationId = functions.config().square.location_id;

        if (!credits || credits <= 0) {
          return res.status(400).json({ error: "Invalid credits value" });
        }
        if (!userId) {
          return res.status(400).json({ error: "Missing userId" });
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

        console.log("💳 Creating checkout:", body);
        const { result } = await checkoutApi.createCheckout(locationId, body);
        return res.json({ checkoutUrl: result.checkout.checkoutPageUrl });

      } catch (e) {
        console.error("❌ Checkout error:", e);
        return res.status(500).json({ error: "Checkout failed" });
      }
    });
  });

// Gen 1–style Auth trigger for signup (fully stable)
const assignCreditsOnSignup = functions
  .auth
  .user()
  .onCreate(async (user) => {
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
    console.log(`✅ Initialized new user ${user.uid} with 30 credits`);
  });

module.exports = {
  createCheckout,
  assignCreditsOnSignup
};



