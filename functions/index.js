const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const { v4: uuidv4 } = require("uuid");
const squareConnect = require("square-connect");

admin.initializeApp();
const db = admin.firestore();

// ✅ Square Config (from Firebase environment config)
const squareConfig = functions.config().square || {};
const SQUARE_ACCESS_TOKEN = squareConfig.access_token;
const SQUARE_LOCATION_ID = squareConfig.location_id;

if (!SQUARE_ACCESS_TOKEN || !SQUARE_LOCATION_ID) {
  console.error("❌ Missing SQUARE_ACCESS_TOKEN or SQUARE_LOCATION_ID");
}

// ✅ Square SDK Setup
const defaultClient = squareConnect.ApiClient.instance;
defaultClient.basePath = "https://connect.squareup.com";
const oauth2 = defaultClient.authentications["oauth2"];
oauth2.accessToken = SQUARE_ACCESS_TOKEN;
const checkoutApi = new squareConnect.CheckoutApi();

// ✅ Express-style checkout endpoint
exports.createCheckout = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
      const { credits, userId, plan } = req.body;

      if (!credits || !userId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const amountInCents = credits * 10;

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
                  amount: amountInCents,
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
    } catch (error) {
      console.error("❌ Failed to create checkout:", error.message);
      return res.status(500).json({ error: error.message || "Checkout failed" });
    }
  });
});

// ✅ Firebase Auth signup trigger
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

  console.log(`✅ Assigned 30 credits to ${user.uid}`);
});











