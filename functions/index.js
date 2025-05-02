const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true }); // ✅ Allow all origins
admin.initializeApp();
const db = admin.firestore();

exports.processRepost = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
      }

      const { campaignId, liked = false, comment = null, userId } = req.body;

      if (!userId) {
        return res.status(401).send("Missing user ID");
      }

      const campaignRef = db.collection("campaigns").doc(campaignId);
      const campaignSnap = await campaignRef.get();
      if (!campaignSnap.exists) {
        return res.status(404).send("Campaign not found");
      }

      const campaign = campaignSnap.data();

      if (campaign.userId === userId) {
        return res.status(403).send("Cannot repost your own campaign");
      }

      const cost = 1 + (liked ? 1 : 0) + (comment ? 2 : 0);
      if (campaign.credits < cost) {
        return res.status(400).send("Not enough credits");
      }

      await db.runTransaction(async (tx) => {
        const repostRef = db.collection("reposts").doc(`${userId}_${campaignId}`);
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

        const userRef = db.collection("users").doc(userId);
        tx.update(userRef, {
          credits: admin.firestore.FieldValue.increment(cost),
        });
      });

      return res.status(200).json({ earned: cost });
    } catch (err) {
      console.error("processRepost error:", err);
      res.status(500).send("Internal Server Error");
    }
  });
});









