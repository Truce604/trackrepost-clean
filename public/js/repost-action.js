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
    const doc = await firebase.firestore().collection("campaigns").doc(campaignId).get();
    if (!doc.exists) throw new Error("Campaign not found");
    
    const campaign = doc.data();

    if (campaign.userId === user.uid) {
      titleEl.textContent = "🚫 You can't repost your own campaign.";
      return;
    }

    titleEl.textContent = campaign.title || "Untitled";
    infoEl.innerHTML = `
      <p><strong>Artist:</strong> ${campaign.artist}</p>
      <p><strong>Genre:</strong> ${campaign.genre}</p>
      <p><strong>Credits:</strong> ${campaign.credits}</p>
      <iframe scrolling="no" frameborder="no" allow="autoplay"
        src="https://w.soundcloud.com/player/?url=${encodeURIComponent(campaign.trackUrl)}&color=%23ff5500&auto_play=false&show_user=true"
        width="100%" height="166"></iframe>
    `;

    actionsEl.style.display = "block";

    commentToggle.addEventListener("change", () => {
      commentBox.style.display = commentToggle.checked ? "block" : "none";
    });

    submitBtn.onclick = async () => {
      const creditsEarned = 1 + (likeEl.checked ? 1 : 0) + (commentToggle.checked && commentBox.value.trim() ? 2 : 0);

      await firebase.firestore().collection("reposts").doc(`${user.uid}_${campaignId}`).set({
        userId: user.uid,
        campaignId,
        trackUrl: campaign.trackUrl,
        liked: likeEl.checked,
        comment: commentBox.value.trim() || null,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        prompted: false
      });

      await firebase.firestore().collection("users").doc(user.uid).update({
        credits: firebase.firestore.FieldValue.increment(creditsEarned)
      });

      await firebase.firestore().collection("campaigns").doc(campaignId).update({
        credits: firebase.firestore.FieldValue.increment(-creditsEarned)
      });

      messageEl.textContent = `🎉 Repost successful! You earned ${creditsEarned} credits.`;
      actionsEl.style.display = "none";
    };
  } catch (err) {
    console.error("❌ Error loading campaign:", err);
    titleEl.textContent = "❌ Failed to load campaign.";
    infoEl.innerHTML = "";
  }
});


