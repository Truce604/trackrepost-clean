const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

/**
 * Callable function to process a repost:
 * - Adds a repost record
 * - Deducts credits from campaign
 * - Adds credits to user
 */
exports.processRepost = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Please log in first.");
  }

  const userId = context.auth.uid;
  const { campaignId, liked, comment } = data;

  if (!campaignId) {
    throw new functions.https.HttpsError("invalid-argument", "Campaign ID is required.");
  }

  const campaignRef = db.collection("campaigns").doc(campaignId);
  const userRef = db.collection("users").doc(userId);
  const repostRef = db.collection("reposts").doc(`${userId}_${campaignId}`);

  const campaignSnap = await campaignRef.get();
  if (!campaignSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Campaign not found.");
  }

  const campaign = campaignSnap.data();

  if (campaign.userId === userId) {
    throw new functions.https.HttpsError("failed-precondition", "You can't repost your own campaign.");
  }

  const alreadyReposted = await repostRef.get();
  if (alreadyReposted.exists) {
    throw new functions.https.HttpsError("already-exists", "You've already reposted this campaign.");
  }

  const cost = 1 + (liked ? 1 : 0) + (comment ? 2 : 0);
  if (campaign.credits < cost) {
    throw new functions.https.HttpsError("resource-exhausted", "Campaign does not have enough credits.");
  }

  await db.runTransaction(async (tx) => {
    tx.set(repostRef, {
      userId,
      campaignId,
      liked: !!liked,
      comment: comment || "",
      trackUrl: campaign.trackUrl || "",
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

  return { earned: cost };
});


