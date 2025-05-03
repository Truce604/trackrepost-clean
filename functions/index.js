const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const squareConnect = require("square-connect");

admin.initializeApp();
const db = admin.firestore();
const corsHandler = cors({ origin: true });

// 🔁 Repost with CORS (HTTPS request version)
exports.processRepost = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

    try {
      const { userId, campaignId, earnedCredits, liked, comment } = req.body;

      if (!userId || !campaignId || typeof earnedCredits !== "number") {
        return res.status(400).json({ error: "Missing or invalid parameters" });
      }

      await db.collection("users").doc(userId).update({
        credits: admin.firestore.FieldValue.increment(earnedCredits),
      });

      await db.collection("reposts").doc(`${userId}_${campaignId}`).set({
        userId,
        campaignId,
        earnedCredits,
        liked: !!liked,
        comment: comment || "",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("❌ Error processing repost:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });
});

// 👤 Assign 30 free credits on user signup
exports.assignCreditsOnSignup = functions.auth.user().onCreate(async (user) => {
  const userId = user.uid;

  try {
    await db.collection("users").doc(userId).set(
      {
        credits: 30,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    console.log(`✅ Assigned 30 credits to new user: ${userId}`);
  } catch (error) {
    console.error(`❌ Failed to assign signup credits:`, error);
  }
});

// 💳 Create a Square checkout
exports.createCheckout = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const { userId, credits, plan } = req.body;
  if (!userId || !credits) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    const defaultClient = squareConnect.ApiClient.instance;
    defaultClient.basePath = "https://connect.squareup.com";
    defaultClient.authentications["oauth2"].accessToken = process.env.SQUARE_ACCESS_TOKEN;

    const checkoutApi = new squareConnect.CheckoutApi();
    const locationId = process.env.SQUARE_LOCATION_ID;

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
                amount: getPriceCents(credits),
                currency: "CAD",
              },
            },
          ],
        },
      },
      ask_for_shipping_address: false,
      redirect_url: `https://www.trackrepost.com/payment-success`,
      note: `${credits} Credits Purchase for userId=${userId}${plan ? ` Plan=${plan}` : ""}`,
    };

    const response = await checkoutApi.createCheckout(locationId, requestBody);
    const checkoutUrl = response.checkout.checkout_page_url;

    return res.status(200).json({ checkoutUrl });
  } catch (err) {
    console.error("❌ Failed to create Square checkout:", err.response?.text || err);
    return res.status(500).json({ error: "Failed to create checkout" });
  }
});

function getPriceCents(credits) {
  switch (credits) {
    case 500: return 2499;
    case 1000: return 3499;
    case 2500: return 7999;
    case 5000: return 13999;
    case 25000: return 54999;
    default: return 0;
  }
}


