// functions/index.js

const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

/**
 * Callable function that:
 * 1. Creates the repost doc
 * 2. Decrements campaign credits
 * 3. Increments user credits
 */
exports.processRepost = functions.https.onCall(async (data, context) => {
  // 1️⃣ Auth check
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Sign in first");
  }
  const userId = context.auth.uid;
  const { campaignId, liked = false, comment = null } = data;

  // 2️⃣ Load campaign
  const campaignRef = db.collection("campaigns").doc(campaignId);
  const campaignSnap = await campaignRef.get();
  if (!campaignSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Campaign not found");
  }
  const campaign = campaignSnap.data();

  // 3️⃣ Prevent self-repost
  if (campaign.userId === userId) {
    throw new functions.https.HttpsError("failed-precondition", "Cannot repost your own");
  }

  // 4️⃣ Compute cost
  const cost = 1 + (liked ? 1 : 0) + (comment ? 2 : 0);
  if (campaign.credits < cost) {
    throw new functions.https.HttpsError("resource-exhausted", "Campaign out of credits");
  }

  // 5️⃣ Transaction
  await db.runTransaction(async tx => {
    // Create repost
    const repostRef = db
      .collection("reposts")
      .doc(`${userId}_${campaignId}`);
    tx.set(repostRef, {
      userId,
      campaignId,
      trackUrl: campaign.trackUrl,
      liked,
      comment,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      prompted: false,
    });

    // Debit campaign
    tx.update(campaignRef, {
      credits: admin.firestore.FieldValue.increment(-cost),
    });

    // Credit user
    const userRef = db.collection("users").doc(userId);
    tx.update(userRef, {
      credits: admin.firestore.FieldValue.increment(cost),
    });
  });

  return { earned: cost };
});












