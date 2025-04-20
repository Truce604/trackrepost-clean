import { onRequest } from "firebase-functions/v2/https";
import { onUserCreated } from "firebase-functions/v2/auth";
import * as admin from "firebase-admin";
import squareConnect from "square-connect";
import corsLib from "cors";
import { v4 as uuidv4 } from "uuid";

admin.initializeApp();
const db = admin.firestore();
const cors = corsLib({ origin: true });

// ✅ Setup Square SDK
const defaultClient = squareConnect.ApiClient.instance;
defaultClient.basePath = "https://connect.squareup.com";
defaultClient.authentications["oauth2"].accessToken = process.env.SQUARE_ACCESS_TOKEN;
const checkoutApi = new squareConnect.CheckoutApi();

// ✅ Assign profile when user signs up
export const assignUserDefaults = onUserCreated(async (event) => {
  const user = event.data;

  const userDoc = {
    email: user.email || "",
    credits: 30,
    isPro: false,
    plan: "Free",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    badge: {
      emoji: "🟢",
      level: 1,
      name: "Rookie",
    },
    usedCoupons: [],
    soundcloud: {
      followers: 0,
      handle: "",
      url: "",
    },
  };

  try {
    await db.collection("users").doc(user.uid).set(userDoc);
    console.log(`✅ Created user profile for ${user.email}`);
  } catch (err) {
    console.error("❌ Failed to set user doc:", err);
  }
});

// ✅ Create Square Checkout
export const createCheckout = onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
      const { credits, userId, plan } = req.body;
      const locationId = process.env.SQUARE_LOCATION_ID;

      if (!credits || !userId) {
        return res.status(400).json({ error: "Missing credits or userId" });
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
                  amount: credits * 10, // CAD cents
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

      const response = await checkoutApi.createCheckout(locationId, requestBody);
      res.status(200).json({ checkoutUrl: response.checkout.checkout_page_url });
    } catch (err) {
      console.error("❌ Square Checkout Error:", err);
      res.status(500).json({ error: "Failed to create checkout" });
    }
  });
});






