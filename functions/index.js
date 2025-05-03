// functions/index.js

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors");
admin.initializeApp();
const db = admin.firestore();
const corsHandler = cors({ origin: true });

// ✅ Repost with CORS-safe HTTP trigger
exports.processRepost = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    try {
      const { userId, campaignId, liked, comment } = req.body;
      if (!userId || !campaignId) {
        return res.status(400).json({ error: "Missing parameters" });
      }

      const campaignRef = db.collection("campaigns").doc(campaignId);
      const userRef = db.collection("users").doc(userId);
      const repostRef = db.collection("reposts").doc(`${userId}_${campaignId}`);

      const campaignSnap = await campaignRef.get();
      if (!campaignSnap.exists) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      const campaign = campaignSnap.data();

      if (campaign.owner === userId) {
        return res.status(403).json({ error: "You cannot repost your own campaign" });
      }

      const cost = 1 + (liked ? 1 : 0) + (comment ? 2 : 0);

      if (campaign.credits < cost) {
        return res.status(400).json({ error: "Campaign out of credits" });
      }

      await db.runTransaction(async (tx) => {
        tx.set(repostRef, {
          userId,
          campaignId,
          trackUrl: campaign.trackUrl,
          liked,
          comment,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          prompted: false,
        });

        tx.update(campaignRef, {
          credits: admin.firestore.FieldValue.increment(-cost),
        });

        tx.update(userRef, {
          credits: admin.firestore.FieldValue.increment(cost),
        });
      });

      return res.status(200).json({ earned: cost });
    } catch (err) {
      console.error("❌ Error in processRepost:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });
});


