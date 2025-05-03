// At the top (if not already)
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

/**
 * ✅ Fix: Use onCall instead of onRequest to avoid CORS errors
 */
exports.processRepost = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Please sign in.");
  }

  const userId = context.auth.uid;
  const { campaignId, liked, comment } = data;

  const campaignRef = db.collection("campaigns").doc(campaignId);
  const campaignSnap = await campaignRef.get();
  if (!campaignSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Campaign not found");
  }

  const campaign = campaignSnap.data();
  if (campaign.userId === userId) {
    throw new functions.https.HttpsError("failed-precondition", "You can't repost your own campaign.");
  }

  const cost = 1 + (liked ? 1 : 0) + (comment ? 2 : 0);
  if (campaign.credits < cost) {
    throw new functions.https.HttpsError("resource-exhausted", "Not enough campaign credits.");
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

  return { earned: cost };
});

