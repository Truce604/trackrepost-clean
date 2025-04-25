firebase.auth().onAuthStateChanged(async (user) => {
  const urlParams = new URLSearchParams(window.location.search);
  const campaignId = urlParams.get("id");

  const titleEl = document.getElementById("campaignTitle");
  const infoEl = document.getElementById("campaignInfo");
  const actionsEl = document.getElementById("repostActions");
  const messageEl = document.getElementById("message");
  const likeEl = document.getElementById("likeTrack");
  const commentToggle = document.getElementById("commentBoxToggle");
  const commentBox = document.getElementById("commentText");
  const submitBtn = document.getElementById("submitRepost");

  if (!user) {
    titleEl.textContent = "Please sign in.";
    return;
  }

  try {
    const campaignDoc = await firebase.firestore().collection("campaigns").doc(campaignId).get();
    if (!campaignDoc.exists) throw new Error("Campaign not found");
    const campaign = campaignDoc.data();

    if (campaign.userId === user.uid) {
      titleEl.textContent = "🚫 You can't repost your own campaign.";
      return;
    }

    const repostId = `${user.uid}_${campaignId}`;
    const repostDoc = await firebase.firestore().collection("reposts").doc(repostId).get();
    if (repostDoc.exists) {
      titleEl.textContent = "⛔ You've already reposted this track.";
      return;
    }

    // Show campaign info
    titleEl.textContent = campaign.title || "Untitled";
    infoEl.innerHTML = `
      <p><strong>Artist:</strong> ${campaign.artist || "Unknown"}</p>
      <p><strong>Genre:</strong> ${campaign.genre || "N/A"}</p>
      <p><strong>Credits Available:</strong> ${campaign.credits}</p>
      <iframe scrolling="no" frameborder="no" allow="autoplay"
        src="https://w.soundcloud.com/player/?url=${encodeURIComponent(campaign.trackUrl)}&color=%23ff5500&auto_play=false&show_user=true"
        width="100%" height="166"></iframe>
    `;

    actionsEl.style.display = "block";

    // Comment toggle
    commentToggle.addEventListener("change", () => {
      commentBox.style.display = commentToggle.checked ? "block" : "none";
    });

    // Submit handler
    submitBtn.onclick = async () => {
      const comment = commentToggle.checked ? commentBox.value.trim() : "";
      const likeChecked = likeEl.checked;

      // 💰 Credits logic
      let creditsEarned = 1; // base for repost
      if (likeChecked) creditsEarned += 1;
      if (comment) creditsEarned += 2;

      // ❌ Not enough credits in campaign
      if (campaign.credits < creditsEarned) {
        messageEl.textContent = "❌ This campaign doesn’t have enough credits left.";
        return;
      }

      // 🔥 Create repost
      await firebase.firestore().collection("reposts").doc(repostId).set({
        userId: user.uid,
        campaignId,
        trackUrl: campaign.trackUrl,
        liked: likeChecked,
        comment: comment || null,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        prompted: false
      });

      // 💸 Credit updates
      await firebase.firestore().collection("users").doc(user.uid).update({
        credits: firebase.firestore.FieldValue.increment(creditsEarned)
      });

      await firebase.firestore().collection("campaigns").doc(campaignId).update({
        credits: firebase.firestore.FieldValue.increment(-creditsEarned)
      });

      // 🎉 Confirmation
      messageEl.textContent = `🎉 Repost successful! You earned ${creditsEarned} credits.`;
      actionsEl.style.display = "none";
    };

  } catch (err) {
    console.error("❌ Error loading campaign:", err);
    titleEl.textContent = "❌ Failed to load campaign.";
    infoEl.innerHTML = "";
  }
});



