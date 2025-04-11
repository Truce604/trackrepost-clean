const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { Client } = require("square"); // no Environment
const { v4: uuidv4 } = require("uuid");
const cors = require("cors")({ origin: true });

admin.initializeApp();
const db = admin.firestore();

// ✅ Manual environment string instead of broken enum
const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: "production", // <--- FIXED
});

exports.createCheckout = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
      const { credits, userId, plan } = req.body;

      if (!credits || !userId) {
        return res.status(400).json({ error: 'Missing credits or userId' });
      }

      const response = await squareClient.checkoutApi.createCheckout(
        process.env.SQUARE_LOCATION_ID,
        {
          idempotencyKey: uuidv4(),
          order: {
            order: {
              locationId: process.env.SQUARE_LOCATION_ID,
              lineItems: [
                {
                  name: `${credits} Credits`,
                  quantity: '1',
                  basePriceMoney: {
                    amount: credits * 10,
                    currency: 'CAD',
                  },
                },
              ],
            },
          },
          askForShippingAddress: false,
          redirectUrl: 'https://www.trackrepost.com/payment-success',
          note: `${credits} Credits Purchase for userId=${userId}${plan ? ` Plan=${plan}` : ''}`,
        }
      );

      const checkoutUrl = response.result.checkout.checkoutPageUrl;
      res.status(200).json({ checkoutUrl });

    } catch (err) {
      console.error("❌ Square checkout error:", err);
      res.status(500).json({ error: "Failed to create checkout" });
    }
  });
});










