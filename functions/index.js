const functions = require("firebase-functions");
const admin = require("firebase-admin");
const squareConnect = require("square-connect");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors")({ origin: true });

admin.initializeApp();
const db = admin.firestore();

// ✅ Initialize Square client
const defaultClient = squareConnect.ApiClient.instance;
defaultClient.basePath = "https://connect.squareup.com";

const oauth2 = defaultClient.authentications["oauth2"];
oauth2.accessToken = functions.config().square.access_token;

const checkoutApi = new squareConnect.CheckoutApi();

exports.createCheckout = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
      const { credits, userId, plan } = req.body;
      const locationId = functions.config().square.location_id;

      if (!credits || !userId) {
        return res.status(400).json({ error: "Missing credits or userId" });
      }

      console.log("✅ Using Square Location ID:", locationId);

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
                  amount: credits * 10, // 💰 Adjust price per credit
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

      const checkoutUrl = response.checkout.checkout_page_url;
      res.status(200).json({ checkoutUrl });
    } catch (err) {
      console.error("❌ Square checkout error:", err);
      res.status(500).json({ error: "Failed to create checkout" });
    }
  });
});













