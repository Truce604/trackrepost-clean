// /public/js/repost-action.js

// Initialize Firebase if not already
if (!firebase.apps.length) {
  firebase.initializeApp(window.firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

document.addEventListener("DOMContentLoaded", () => {

  // Elements
  const titleEl = document.getElementById("campaignTitle");
  const artistEl = document.getElementById("campaignArtist");
  const artworkEl = document.getElementById("campaignArtwork");
  const linkEl = document.getElementById("campaignLink");
  const infoEl = document.getElementById("campaignInfo");
  const actionsEl = document.getElementById("repostActions");
  const commentToggle = document.getElementById("commentBoxToggle");
  const commentBox = document.getElementById("commentText");
  const submitBtn = document.getElementById("submitRepost");
  const messageEl = document.getElementById("message");

  // Get campaign ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const campaignId = urlParams.get("id"); // must match ?id=XXX in URL

  if (!campaignId) {
    titleEl.innerText = "❌ Missing campaign ID";
    return;
  }

  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      titleEl.innerText = "🔒 Please log in to repost this track";
      return;
    }

    try {
      // Load campaign
      const docRef = db.collection("campaigns").doc(campaignId);
      const snap = await docRef.get();

      if (!snap.exists) {
        titleEl.innerText = "❌ Campaign not found";
        return;
      }

      const campaign = snap.data();

      if (campaign.userId === user.uid) {
        titleEl.innerText = "🚫 You cannot repost your own campaign";
        return;
      }

      // Check if already reposted
      const repostId = `${user.uid}_${campaignId}`;
      const repostRef = db.collection("reposts").doc(repostId);
      const repostSnap = await repostRef.get();
      if (repostSnap.exists) {
        titleEl.innerText = "✅ You've already reposted this track";
        return;
      }

      // Populate UI
      titleEl.innerText = campaign.title || "Untitled";
      artistEl.innerText = campaign.artist || "Unknown";
      artworkEl.src = campaign.artworkUrl || "/images/default-art.png";
      linkEl.href = campaign.trackUrl;
      infoEl.style.display = "block";
      actionsEl.style.display = "block";

      // Toggle comment box
      commentToggle.addEventListener("change", () => {
        commentBox.style.display = commentToggle.checked ? "block" : "none";
      });

      // Handle repost
      submitBtn.addEventListener("click", async () => {
        submitBtn.disabled = true;
        messageEl.innerText = "⏳ Processing repost...";

        const like = document.getElementById("likeTrack").checked;
        const comment = commentBox.value.trim();
        let earnedCredits = 1; // base credit for repost
        if (like) earnedCredits += 1;
        if (comment) earnedCredits += 2;

        // Save repost
        await repostRef.set({
          userId: user.uid,
          campaignId,
          trackUrl: campaign.trackUrl,
          like,
          comment,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });

        // Update user credits
        const userRef = db.collection("users").doc(user.uid);
        await userRef.update({
          credits: firebase.firestore.FieldValue.increment(earnedCredits)
        });

        // Deduct from campaign owner
        const ownerRef = db.collection("users").doc(campaign.userId);
        await ownerRef.update({
          credits: firebase.firestore.FieldValue.increment(-earnedCredits)
        });

        messageEl.innerText = `🔥 Repost complete! You earned ${earnedCredits} credits.`;
        actionsEl.style.display = "none";
      });

    } catch (e) {
      console.error("⚠️ Error loading campaign:", e);
      titleEl.innerText = "⚠️ Error loading campaign. Try again later.";
    }
  });
});


