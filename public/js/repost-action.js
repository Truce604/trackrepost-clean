// ✅ repost-action.js - TrackRepost Launch Version

firebase.auth().onAuthStateChanged(async (user) => {
  if (!user) {
    alert("Please log in to repost.");
    window.location.href = "/index.html";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const campaignId = params.get("id");
  if (!campaignId) {
    document.body.innerHTML = "<p>❌ No campaign ID found in URL.</p>";
    return;
  }

  const db = firebase.firestore();
  const campaignRef = db.collection("campaigns").doc(campaignId);
  const repostId = `${user.uid}_${campaignId}`;
  const repostRef = db.collection("reposts").doc(repostId);
  const userRef = db.collection("users").doc(user.uid);

  try {
    const [campaignSnap, repostSnap] = await Promise.all([
      campaignRef.get(),
      repostRef.get()
    ]);

    if (!campaignSnap.exists) {
      document.body.innerHTML = "<p>❌ Campaign not found.</p>";
      return;
    }

    if (repostSnap.exists) {
      document.body.innerHTML = "<p>✅ You already reposted this track.</p>";
      return;
    }

    const campaign = campaignSnap.data();

    const limitTime = new Date(Date.now() - 12 * 60 * 60 * 1000); // 12 hrs ago
    const repostsQuery = await db.collection("reposts")
      .where("userId", "==", user.uid)
      .where("timestamp", ">", limitTime)
      .get();

    if (repostsQuery.size >= 10) {
      document.body.innerHTML = "<p>⏳ You’ve reached your 12-hour repost limit.</p>";
      return;
    }

    // 🎵 Inject UI
    document.getElementById("trackTitle").textContent = campaign.title || "Untitled";
    document.getElementById("artistName").textContent = campaign.artist || "Unknown Artist";
    document.getElementById("genre").textContent = campaign.genre || "Unknown";
    document.getElementById("creditsAvailable").textContent = campaign.credits || 0;
    document.getElementById("soundcloudPlayer").src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(campaign.trackUrl)}&color=%23ff5500&auto_play=false&show_user=true`;

    document.getElementById("confirmBtn").addEventListener("click", async () => {
      const likeChecked = document.getElementById("likeCheckbox").checked;
      const comment = document.getElementById("commentBox").value.trim();
      const creditsEarned = 1 + (likeChecked ? 1 : 0) + (comment ? 2 : 0);

      if (campaign.credits < creditsEarned) {
        alert("❌ Not enough credits remaining in this campaign.");
        return;
      }

      const batch = db.batch();

      batch.set(repostRef, {
        userId: user.uid,
        campaignId,
        trackUrl: campaign.trackUrl,
        prompted: false,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });

      batch.update(userRef, {
        credits: firebase.firestore.FieldValue.increment(creditsEarned)
      });

      batch.update(campaignRef, {
        credits: firebase.firestore.FieldValue.increment(-creditsEarned)
      });

      await batch.commit();

      alert(`✅ Reposted! You earned ${creditsEarned} credits.`);
      window.location.href = "/repost.html";
    });

  } catch (err) {
    console.error("❌ Repost Error:", err);
    document.body.innerHTML = "<p>❌ Failed to load campaign. Please try again.</p>";
  }
});



