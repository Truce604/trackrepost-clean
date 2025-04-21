import { onRequest } from "firebase-functions/v2/https";
import { auth } from "firebase-functions/v1"; // ✅ Auth trigger working with ESM
import * as logger from "firebase-functions/logger";
import admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";
import corsLib from "cors";
import squareConnect from "square-connect";

// ✅ Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();
const cors = corsLib({ origin: true });

// ✅ Setup Square SDK
const defaultClient = squareConnect.ApiClient.instance;
defaultClient.basePath = "https://connect.squareup.com";
const oauth2 = defaultClient.authentications["oauth2"];
oauth2.accessToken = process.env.SQUARE_ACCESS_TOKEN;

const checkoutApi = new squareConnect.CheckoutApi();
const locationId = process.env.SQUARE_LOCATION_ID;

// ✅ Gen 2: Create Checkout Endpoint
export const createCheckout = onRequest(async (req, res) => {
  return cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
      const { credits, userId, plan } = req.body;

      if (!credits || typeof credits !== "number" || credits <= 0) {
        return res.status(400).json({ error: "Invalid credits value" });
      }

      if (!userId || typeof userId !== "string" || userId.trim() === "") {
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
                  amount: credits * 10, // 🔁 $0.10 per credit
                  currency: "CAD"
                }
              }
            ]
          }
        },
        ask_for_shipping_address: false,
        redirect_url: "https://www.trackrepost.com/payment-success",
        note: `${credits} Credits Purchase for userId=${userId}${plan ? ` Plan=${plan}` : ""}`
      };

      logger.info("💳 Creating checkout with body:", requestBody);

      const response = await checkoutApi.createCheckout(locationId, requestBody);
      const checkoutUrl = response.checkout.checkout_page_url;

      return res.status(200).json({ checkoutUrl });
    } catch (error) {
      logger.error("❌ Failed to create checkout:", error);
      return res.status(500).json({ error: "Failed to create checkout" });
    }
  });
});

// ✅ Assign 30 Credits on Signup
export const assignCreditsOnSignup = auth.user().onCreate(async (user) => {
  const userRef = db.collection("users").doc(user.uid);

  const data = {
    email: user.email || "",
    displayName: user.displayName || "",
    credits: 30,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    isPro: false,
    plan: "Free",
    badge: {
      emoji: "🟢",
      name: "Rookie",
      level: 1
    },
    soundcloud: {
      handle: "",
      url: "",
      followers: 0
    },
    usedCoupons: []
  };

  await userRef.set(data, { merge: true });
  logger.info(`✅ New user initialized: ${user.uid}`);
});




