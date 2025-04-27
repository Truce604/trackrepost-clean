// functions/index.js

const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();

/**
 * Callable function to process a repost:
 * - Creates a repost entry
 * - Debits campaign credits
 * - Credits the user
 * All within a Firestore transaction for atomicity.
 */
exports.processRepost = functions.https.onCall(async (data, context) => {
  // 1️⃣ Authentication check
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be signed in to repost."
    );
  }
  const userId = context.auth.uid;
  const { campaignId, liked = false, comment = null } = data;

  // 2️⃣ Load the campaign
  const campaignRef = db.collection("campaigns").doc(campaignId);
  const campaignSnap = await campaignRef.get();
  if (!campaignSnap.exists) {
    throw new functions.https.HttpsError(
      "not-found",
      "Campaign not found."
    );
  }
  const campaign = campaignSnap.data();

  // 3️⃣ Prevent self-reposts
  if (campaign.userId === userId) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "You cannot repost your own campaign."
    );
  }

  // 4️⃣ Calculate cost (you can replace this with follower-based logic)
  const baseCost = 1;
  const likeCost = liked ? 1 : 0;
  const commentCost = comment ? 2 : 0;
  const totalCost = baseCost + likeCost + commentCost;

  if (campaign.credits < totalCost) {
    throw new functions.https.HttpsError(
      "resource-exhausted",
      "Not enough campaign credits remaining."
    );
  }

  // 5️⃣ Perform atomic transaction
  await db.runTransaction(async (tx) => {
    const repostId = `${userId}_${campaignId}`;
    const repostRef = db.collection("reposts").doc(repostId);
    const userRef = db.collection("users").doc(userId);

    // Create the repost document
    tx.set(repostRef, {
      userId,
      campaignId,
      trackUrl: campaign.trackUrl,
      liked,
      comment,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      prompted: false,
    });

    // Debit the campaign's credits
    tx.update(campaignRef, {
      credits: admin.firestore.FieldValue.increment(-totalCost),
    });

    // Credit the user's account
    tx.update(userRef, {
      credits: admin.firestore.FieldValue.increment(totalCost),
    });
  });

  // 6️⃣ Return result
  return { earned: totalCost };
});












