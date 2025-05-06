const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors");

admin.initializeApp();
const db = admin.firestore();
const corsHandler = cors({ origin: true });

// ✅ Repost Function
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
        return res.status(403).json({ error: "You cannot repost your own campaign" });
      }

      const repostRef = db.collection("reposts").doc(`${userId}_${campaignId}`);
      const repostSnap = await repostRef.get();
      if (repostSnap.exists) {
        return res.status(409).json({ error: "You already reposted this campaign" });
      }

      const userRef = db.collection("users").doc(userId);
      const userSnap = await userRef.get();
      const userData = userSnap.exists ? userSnap.data() : {};
      const followers = userData.soundcloud?.followers || 0;
      const followerBonus = Math.floor(followers / 100);

      const earnedCredits = 1 + (liked ? 1 : 0) + (comment ? 2 : 0) + followerBonus;

      if (campaign.credits < earnedCredits) {
        return res.status(400).json({ error: "Campaign does not have enough credits" });
      }

      await db.runTransaction(async (tx) => {
        tx.set(repostRef, {
          userId,
          campaignId,
          trackUrl: campaign.trackUrl,
          liked: !!liked,
          comment: comment || "",
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          prompted: false,
        });

        tx.update(campaignRef, {
          credits: admin.firestore.FieldValue.increment(-earnedCredits),
        });

        tx.update(userRef, {
          credits: admin.firestore.FieldValue.increment(earnedCredits),
        });

        tx.set(db.collection("transactions").doc(), {
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


