// /public/js/repost-action.js

firebase.auth().onAuthStateChanged(async (user) => {
  if (!user) {
    alert("You must be signed in to repost.");
    window.location.href = "/index.html";
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const campaignId = urlParams.get("id");
  if (!campaignId) {
    alert("Missing campaign ID.");
    return;
  }

  const db = firebase.firestore();
  const campaignRef = db.collection("campaigns").doc(campaignId);
  const repostRef = db.collection("reposts").doc(`${user.uid}_${campaignId}`);
  const transactionRef = db.collection("transactions");

  try {
    const repostDoc = await repostRef.get();
    if (repostDoc.exists) {
      document.getElementById("repost-container").innerHTML = "<p>✅ You already reposted this track.</p>";
      return;
    }

    const campaignSnap = await campaignRef.get();
    if (!campaignSnap.exists) {
      document.getElementById("repost-container").innerHTML = "<p>❌ Campaign not found.</p>";
      return;
    }

    const campaign = campaignSnap.data();

    // Render track info
    document.getElementById("trackTitle").textContent = campaign.title || "Untitled Track";
    document.getElementById("artistName").textContent = campaign.artist || "Unknown Artist";
    document.getElementById("soundcloudPlayer").src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(campaign.trackUrl)}&color=%23ff5500`;

    document.getElementById("repostButton").addEventListener("click", async () => {
      const likeChecked = document.getElementById("likeCheckbox").checked;
      const commentText = document.getElementById("commentBox").value.trim();

      let creditsEarned = 1; // base credit
      if (likeChecked) creditsEarned += 1;
      if (commentText.length > 0) creditsEarned += 2;

      try {
        await repostRef.set({
          userId: user.uid,
          campaignId: campaignId,
          trackUrl: campaign.trackUrl,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          prompted: false,
          liked: likeChecked,
          comment: commentText || null,
          creditsEarned
        });

        // Update user credits
        const userRef = db.collection("users").doc(user.uid);
        await userRef.set({
          credits: firebase.firestore.FieldValue.increment(creditsEarned)
        }, { merge: true });

        // Deduct credits from campaign
        await campaignRef.update({
          credits: firebase.firestore.FieldValue.increment(-creditsEarned)
        });

        // Log transaction
        await transactionRef.add({
          type: "earn",
          userId: user.uid,
          amount: creditsEarned,
          campaignId: campaignId,
          timestamp: firebase.firestore.Timestamp.now()
        });

        const creditBalanceEl = document.getElementById("creditBalance");
        if (creditBalanceEl) {
          const userDoc = await userRef.get();
          const newCreditBalance = userDoc.data().credits || 0;
          creditBalanceEl.textContent = `Credits: ${newCreditBalance}`;
        }

        document.getElementById("repost-container").innerHTML = `
          <p>✅ Repost complete! You earned ${creditsEarned} credits.</p>
          <a href="/repost.html">Back to Repost Feed</a>
        `;
      } catch (err) {
        console.error("❌ Repost Error:", err);
        alert("There was a problem with your repost.");
      }
    });
  } catch (err) {
    console.error("❌ Error loading campaign:", err);
    document.getElementById("repost-container").innerHTML = "<p>❌ Failed to load campaign.</p>";
  }
});

