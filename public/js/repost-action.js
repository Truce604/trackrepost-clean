// /public/js/repost-action.js

// ✅ Initialize Firebase if not already
if (!firebase.apps.length) {
  firebase.initializeApp(window.firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("repost-container");
  const urlParams = new URLSearchParams(window.location.search);
  const campaignId = urlParams.get("campaignId");

  if (!campaignId) {
    container.innerHTML = `<p>❌ Missing campaign ID. Please access this page from Explore.</p>`;
    return;
  }

  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      container.innerHTML = `<p>🔒 Log in to repost this track.</p>`;
      return;
    }

    try {
      const campaignDoc = await db.collection("campaigns").doc(campaignId).get();
      if (!campaignDoc.exists) {
        container.innerHTML = `<p>❌ Campaign not found.</p>`;
        return;
      }

      const campaign = campaignDoc.data();
      if (campaign.userId === user.uid) {
        container.innerHTML = `<p>🚫 You cannot repost your own campaign.</p>`;
        return;
      }

      const repostId = `${user.uid}_${campaignId}`;
      const repostRef = db.collection("reposts").doc(repostId);
      const repostDoc = await repostRef.get();
      if (repostDoc.exists) {
        container.innerHTML = `<p>✅ You've already reposted this track.</p>`;
        return;
      }

      // ✅ Build UI
      container.innerHTML = `
        <h2>${campaign.title}</h2>
        <p>Artist: ${campaign.artist}</p>
        <iframe width="100%" height="166" scrolling="no" frameborder="no"
          src="https://w.soundcloud.com/player/?url=${encodeURIComponent(campaign.trackUrl)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true">
        </iframe>
        <label><input type="checkbox" id="likeTrack" checked> ❤️ Like this track (1 credit)</label><br>
        <label>💬 Comment for 2 extra credits:<br><textarea id="commentBox" placeholder="Leave a comment..."></textarea></label><br>
        <button id="repostBtn">🚀 Repost This</button>
      `;

      document.getElementById("repostBtn").addEventListener("click", async () => {
        const like = document.getElementById("likeTrack").checked;
        const comment = document.getElementById("commentBox").value.trim();
        let earnedCredits = 1;

        if (like) earnedCredits += 1;
        if (comment) earnedCredits += 2;

        await db.collection("reposts").doc(repostId).set({
          userId: user.uid,
          campaignId,
          trackUrl: campaign.trackUrl,
          like,
          comment,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });

        // Update credits
        const userRef = db.collection("users").doc(user.uid);
        await userRef.update({
          credits: firebase.firestore.FieldValue.increment(earnedCredits)
        });

        // Deduct from campaign owner
        const campaignOwnerRef = db.collection("users").doc(campaign.userId);
        await campaignOwnerRef.update({
          credits: firebase.firestore.FieldValue.increment(-earnedCredits)
        });

        container.innerHTML = `<p>🔥 Repost complete. You earned ${earnedCredits} credits!</p>`;
      });

    } catch (error) {
      console.error("⚠️ Error loading campaign or processing repost:", error);
      container.innerHTML = `<p>⚠️ Error loading campaign.</p>`;
    }
  });
});

