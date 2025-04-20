const functions = require("firebase-functions");
const admin = require("firebase-admin");
const squareConnect = require("square-connect");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors")({ origin: true });

admin.initializeApp();
const db = admin.firestore();

// ✅ Create full user profile on signup
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName } = user;

  const newUser = {
    email: email || "",
    displayName: displayName || "",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    credits: 30,
    isPro: false,
    plan: "Free",
    usedCoupons: [],
    badge: {
      name: "Rookie",
      emoji: "🟢",
      level: 1
    },
    soundcloud: {
      handle: "",
      url: "",
      followers: 0
    }
  };

  try {
    await db.collection("users").doc(uid).set(newUser, { merge: true });
    console.log(`✅ New user initialized: ${email}`);
  } catch (err) {
    console.error("❌ Failed to create user profile:", err);
  }
});

// ✅ Setup Square client
const defaultClient = squareConnect.ApiClient.instance;
defaultClient.basePath = "https://connect.squareup.com";
const oauth2 = defaultClient.authentications["oauth2"];
oauth2.accessToken = functions.config().square.access_token;

const checkoutApi = new squareConnect.CheckoutApi();

// ✅ Square checkout with validation & logging
exports.createCheckout = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
      const { credits, userId, plan } = req.body;
      const locationId = functions.config().square.location_id;

      // ✅ Input Validation
      if (!credits || typeof credits !== "number" || credits <= 0) {
        return res.status(400).json({ error: "Invalid credits value" });
      }

      if (!userId || typeof userId !== "string" || userId.trim() === "") {
        return res.status(400).json({ error: "Invalid userId value" });
      }

      // 💳 Construct Square checkout request
      const requestBody = {
        idempotency_key: uuidv4(),
        order: {
          order: {
            location_id: locationId,
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

      // 🧠 Log request
      console.log("💳 Square Request:", JSON.stringify(requestBody));

      const response = await checkoutApi.createCheckout(locationId, requestBody);

      // 🔎 Log response
      console.log("✅ Square Response:", JSON.stringify(response));

      const checkoutUrl = response.checkout.checkout_page_url;
      res.status(200).json({ checkoutUrl });

    } catch (err) {
      console.error("❌ Checkout error:", err.message || err);
      res.status(500).json({ error: "Failed to create checkout" });
    }
  });
});







