document.addEventListener("DOMContentLoaded", () => {
  const titleEl = document.getElementById("campaignTitle");
  const infoEl = document.getElementById("campaignInfo");
  const actionsEl = document.getElementById("repostActions");
  const messageEl = document.getElementById("message");
  const likeEl = document.getElementById("likeTrack");
  const commentToggle = document.getElementById("commentBoxToggle");
  const commentBox = document.getElementById("commentText");
  const submitBtn = document.getElementById("submitRepost");

  firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
      titleEl.textContent = "⚠️ Please sign in to repost.";
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const campaignId = urlParams.get("id");

    if (!campaignId) {
      titleEl.textContent = "❌ Campaign not found.";
      return;
    }

    console.log("✅ Current user:", user.uid);
    console.log("✅ Loading campaign ID:", campaignId);

    try {
      const campaignDoc = await firebase.firestore()
        .collection("campaigns")
        .doc(campaignId)
        .get();

      if (!campaignDoc.exists) {
        throw new Error("Campaign not found in Firestore");
      }

      const campaign = campaignDoc.data();

      if (campaign.userId === user.uid) {
        titleEl.textContent = "🚫 You can't repost your own campaign.";
        return;
      }

      titleEl.textContent = campaign.title || "Untitled Track";
      infoEl.innerHTML = `
        <p><strong>Artist:</strong> ${campaign.artist || "Unknown"}</p>
        <p><strong>Genre:</strong> ${campaign.genre || "N/A"}</p>
        <p><strong>Credits Available:</strong> ${campaign.credits || 0}</p>
        <iframe scrolling="no" frameborder="no" allow="autoplay"
          src="https://w.soundcloud.com/player/?url=${encodeURIComponent(campaign.trackUrl)}&color=%23ff9900&auto_play=false&show_user=true"
          width="100%" height="166"></iframe>
      `;

      actionsEl.style.display = "block";

      commentToggle.addEventListener("change", () => {
        commentBox.style.display = commentToggle.checked ? "block" : "none";
      });

      submitBtn.onclick = async () => {
        const likeCredits = likeEl.checked ? 1 : 0;
        const commentCredits = (commentToggle.checked && commentBox.value.trim()) ? 2 : 0;
        const totalCreditsEarned = 1 + likeCredits + commentCredits; // 1 credit for repost always

        if (campaign.credits < totalCreditsEarned) {
          alert("⚠️ Not enough campaign credits left to reward you!");
          return;
        }

        const repostId = `${user.uid}_${campaignId}`;

        await firebase.firestore().collection("reposts").doc(repostId).set({
          userId: user.uid,
          campaignId: campaignId,
          trackUrl: campaign.trackUrl,
          liked: likeEl.checked,
          comment: commentBox.value.trim() || null,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          prompted: false
        });

        // Update user credits
        await firebase.firestore().collection("users").doc(user.uid).update({
          credits: firebase.firestore.FieldValue.increment(totalCreditsEarned)
        });

        // Deduct campaign credits
        await firebase.firestore().collection("campaigns").doc(campaignId).update({
          credits: firebase.firestore.FieldValue.increment(-totalCreditsEarned)
        });

        console.log(`✅ Repost successful. Earned ${totalCreditsEarned} credits.`);

        messageEl.textContent = `🎉 Repost successful! You earned ${totalCreditsEarned} credits.`;
        actionsEl.style.display = "none";
      };

    } catch (error) {
      console.error("❌ Error loading campaign:", error);
      titleEl.textContent = "❌ Failed to load campaign.";
      infoEl.innerHTML = "";
    }
  });
});



