const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors");

// ✅ Init only once
admin.initializeApp();
const db = admin.firestore();
const corsHandler = cors({ origin: true });

// ✅ Repost Function (with full transaction + error handling)
exports.processRepost = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    try {
      const { userId, campaignId, liked, comment } = req.body;

      if (!userId || !campaignId) {
        return res.status(400).json({ error: "Missing userId or campaignId" });
      }

      const campaignRef = db.collection("campaigns").doc(campaignId);
      const campaignSnap = await campaignRef.get();

      if (!campaignSnap.exists) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      const campaign = campaignSnap.data();

      if (campaign.userId === userId) {
        return res.status(403).json({ error: "Cannot repost your own campaign" });
      }

      const earnedCredits = 1 + (liked ? 1 : 0) + (comment ? 2 : 0);

      if (campaign.credits < earnedCredits) {
        return res.status(400).json({ error: "Not enough campaign credits" });
      }

      await db.runTransaction(async (tx) => {
        const repostRef = db.collection("reposts").doc(`${userId}_${campaignId}`);
        tx.set(repostRef, {
          userId,
          campaignId,
          liked: !!liked,
          comment: comment || "",
          trackUrl: campaign.trackUrl,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          prompted: false,
        });

        tx.update(campaignRef, {
          credits: admin.firestore.FieldValue.increment(-earnedCredits),
        });

        const userRef = db.collection("users").doc(userId);
        tx.update(userRef, {
          credits: admin.firestore.FieldValue.increment(earnedCredits),
        });

        const txRef = db.collection("transactions").doc();
        tx.set(txRef, {
          userId,
          type: "repost-earn",
          credits: earnedCredits,
          campaignId,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      return res.status(200).json({ success: true, earnedCredits });
    } catch (err) {
      console.error("❌ Repost error:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });
});


