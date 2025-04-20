const functions = require("firebase-functions");
const admin = require("firebase-admin");
const squareConnect = require("square-connect");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors")({ origin: true });

admin.initializeApp();
const db = admin.firestore();

// 🔒 Initialize Square
const defaultClient = squareConnect.ApiClient.instance;
defaultClient.basePath = "https://connect.squareup.com";
const oauth2 = defaultClient.authentications["oauth2"];
oauth2.accessToken = functions.config().square.access_token;
const checkoutApi = new squareConnect.CheckoutApi();

// ✅ Create Square Checkout
exports.createCheckout = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
      const { credits, userId, plan } = req.body;
      const locationId = functions.config().square.location_id;

      // ✅ Validate input
      if (!credits || typeof credits !== "number" || credits <= 0) {
        return res.status(400).json({ error: "Invalid credits value" });
      }

      if (!userId || typeof userId !== "string") {
        return res.status(400).json({ error: "Invalid userId value" });
      }

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

      console.log("💰 Square Request:", JSON.stringify(requestBody));
      const response = await checkoutApi.createCheckout(locationId, requestBody);
      console.log("✅ Square Response:", JSON.stringify(response));

      res.status(200).json({ checkoutUrl: response.checkout.checkout_page_url });
    } catch (error) {
      console.error("❌ Checkout error:", error);
      res.status(500).json({ error: "Failed to create checkout" });
    }
  });
});

// ✅ Add 30 credits & default profile when user signs up
exports.assignCreditsOnSignup = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName } = user;
  try {
    const userData = {
      email: email || "",
      displayName: displayName || "",
      credits: 30,
      isPro: false,
      plan: "Free",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      usedCoupons: [],
      badge: {
        emoji: "🟢",
        name: "Rookie",
        level: 1,
      },
      soundcloud: {
        handle: "",
        url: "",
        followers: 0,
      },
    };

    await db.collection("users").doc(uid).set(userData, { merge: true });
    console.log(`✅ Default user profile created for ${email}`);
  } catch (err) {
    console.error("❌ Error assigning default user data:", err);
  }
});







