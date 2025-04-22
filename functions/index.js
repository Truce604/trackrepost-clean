import admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import { onUserCreated } from "firebase-functions/v2/auth";
import corsModule from "cors";
import { v4 as uuidv4 } from "uuid";
import squareConnect from "square-connect";

admin.initializeApp();
const db = admin.firestore();
const cors = corsModule({ origin: true });

// ✅ Square Setup
const defaultClient = squareConnect.ApiClient.instance;
defaultClient.basePath = "https://connect.squareup.com";
const oauth2 = defaultClient.authentications["oauth2"];
oauth2.accessToken = process.env.SQUARE_ACCESS_TOKEN || process.env.square_access_token || 
  (await import("firebase-functions")).functions.config().square.access_token;
const checkoutApi = new squareConnect.CheckoutApi();

// ✅ Create Checkout (Gen 2)
export const createCheckout = onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
      const { credits, userId, plan } = req.body;
      const locationId = (await import("firebase-functions")).functions.config().square.location_id;

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
                  amount: credits * 10, // 💰 $0.10 per credit
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

      console.log("💳 Creating checkout with body:", requestBody);
      const response = await checkoutApi.createCheckout(locationId, requestBody);
      const checkoutUrl = response.checkout.checkout_page_url;

      return res.status(200).json({ checkoutUrl });
    } catch (error) {
      console.error("❌ Failed to create checkout:", error);
      return res.status(500).json({ error: "Failed to create checkout" });
    }
  });
});

// ✅ Assign Credits on Signup (Gen 2)
export const assignCreditsOnSignup = onUserCreated(async (event) => {
  const user = event.data;
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
  console.log(`✅ New user initialized: ${user.uid}`);
});



