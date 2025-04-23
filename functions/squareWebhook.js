// /api/square/webhook.js (Vercel API Route)
import { buffer } from "micro";
import * as admin from "firebase-admin";
import crypto from "crypto";

if (!admin.apps.length) {
  admin.initializeApp();
}

export const config = {
  api: {
    bodyParser: false,
  },
};

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const signature = req.headers["x-square-signature"];
  const webhookUrl = "https://www.trackrepost.com/api/square/webhook";
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;

  const rawBody = (await buffer(req)).toString("utf8");

  const hmac = crypto
    .createHmac("sha1", signatureKey)
    .update(webhookUrl + rawBody)
    .digest("base64");

  if (hmac !== signature) {
    console.error("❌ Invalid signature");
    return res.status(403).end("Forbidden");
  }

  const event = JSON.parse(rawBody);

  try {
    if (event.type === "payment.created") {
      const note = event.data.object.payment.note;
      const match = note.match(/(\d+)\sCredits\sPurchase\sfor\suserId=(\w+)/);

      if (!match) throw new Error("Invalid note format");

      const credits = parseInt(match[1], 10);
      const userId = match[2];

      const userRef = db.collection("users").doc(userId);
      await userRef.update({
        credits: admin.firestore.FieldValue.increment(credits),
      });

      console.log(`✅ Added ${credits} credits to user ${userId}`);
    }

    res.status(200).end("OK");
  } catch (err) {
    console.error("❌ Webhook error:", err);
    res.status(500).end("Internal Server Error");
  }
}

