const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

admin.initializeApp();
const db = admin.firestore();

// ✅ Simple test function
exports.helloWorld = functions.https.onRequest((req, res) => {
  res.send("Hello from TrackRepost Firebase Functions!");
});

// ✅ Handle reposts, calculate rewards, and update Firestore securely
exports.repostAndReward = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const {
        userId,
        campaignId,
        liked,
        followed,
        commented,
        commentText
      } = req.body;

      if (!userId || !campaignId) {
        res.status(400).send("Missing userId or campaignId");
        return;
      }

      const [userSnap, campaignSnap] = await Promise.all([
        db.collection("users").doc(userId).get(),
        db.collection("campaigns").doc(campaignId).get()
      ]);

      if (!userSnap.exists || !campaignSnap.exists) {
        res.status(404).send("User or campaign not found");
        return;
      }

      const userData = userSnap.data();
      const campaignData = campaignSnap.data();

      // 🚫 Prevent duplicate reposts
      const dupes = await db.collection("reposts")
        .where("userId", "==", userId)
        .where("campaignId", "==", campaignId)
        .get();
      if (!dupes.empty) {
        res.status(409).send("Already reposted");
        return;
      }

      // 🔁 Enforce 12-hour repost window (max 10 reposts unless prompted)
      const now = new Date();
      const resetHour = now.getHours() < 12 ? 0 : 12;
      const windowStart = new Date(now);
      windowStart.setHours(resetHour, 0, 0, 0);

      const recent = await db.collection("reposts")
        .where("userId", "==", userId)
        .where("timestamp", ">", windowStart)
        .get();

      const repostCount = recent.docs.filter(doc => !doc.data().prompted).length;
      if (repostCount >= 10) {
        res.status(403).send("Repost limit reached");
        return;
      }

      // ✅ Calculate earned credits
      const followers = userData.soundcloud?.followers || 0;
      let earnedCredits = Math.floor(followers / 100);
      if (liked) earnedCredits += 1;
      if (followed) earnedCredits += 2;
      if (commented && commentText?.trim()) earnedCredits += 2;

      if (earnedCredits <= 0) {
        res.status(400).send("No credits earned from this engagement.");
        return;
      }

      if (campaignData.credits < earnedCredits) {
        res.status(403).send("Campaign doesn't have enough credits");
        return;
      }

      // 🔁 Write repost, transaction, update credits
      const repostRef = db.collection("reposts").doc();
      const transactionRef = db.collection("transactions").doc();

      const batch = db.batch();

      batch.set(repostRef, {
        userId,
        campaignId,
        trackUrl: campaignData.trackUrl,
        liked,
        follow: followed,
        comment: commented,
        commentText,
        timestamp: admin.firestore.Timestamp.now(),
        prompted: false
      });

      batch.update(db.collection("users").doc(userId), {
        credits: admin.firestore.FieldValue.increment(earnedCredits)
      });

      batch.update(db.collection("campaigns").doc(campaignId), {
        credits: admin.firestore.FieldValue.increment(-earnedCredits)
      });

      batch.set(transactionRef, {
        userId,
        type: "earned",
        amount: earnedCredits,
        reason: `Boosted: ${campaignData.title}`,
        timestamp: admin.firestore.Timestamp.now()
      });

      await batch.commit();

      res.status(200).json({ success: true, earnedCredits });

    } catch (err) {
      console.error("🔥 repostAndReward failed:", err);
      res.status(500).send("Internal server error");
    }
  });
});






