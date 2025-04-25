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
    // 🔍 Check if campaign exists
    const doc = await firebase.firestore().collection("campaigns").doc(campaignId).get();
    if (!doc.exists) throw new Error("Campaign not found");
    const campaign = doc.data();

    // 🚫 Block reposting own campaign
    if (campaign.userId === user.uid) {
      titleEl.textContent = "🚫 You can't repost your own campaign.";
      return;
    }

    // 🔍 Check if already reposted
    const repostId = `${user.uid}_${campaignId}`;
    const repostDoc = await firebase.firestore().collection("reposts").doc(repostId).get();
    if (repostDoc.exists) {
      titleEl.textContent = "⛔ You've already reposted this track.";
      return;
    }

    // 🎨 Display campaign info
    titleEl.textContent = campaign.title || "Untitled";
    infoEl.innerHTML = `
      <p><strong>Artist:</strong> ${campaign.artist}</p>
      <p><strong>Genre:</strong> ${campaign.genre}</p>
      <p><strong>Credits Available:</strong> ${campaign.credits}</p>
      <iframe scrolling="no" frameborder="no" allow="autoplay"
        src="https://w.soundcloud.com/player/?url=${encodeURIComponent(campaign.trackUrl)}&color=%23ff5500&auto_play=false&show_user=true"
        width="100%" height="166"></iframe>
    `;
    actionsEl.style.display = "block";

    // 📝 Toggle comment box
    commentToggle.addEventListener("change", () => {
      commentBox.style.display = commentToggle.checked ? "block" : "none";
    });

    // 🚀 Handle Repost Submit
    submitBtn.onclick = async () => {
      const comment = commentBox.value.trim();
      const creditsEarned = 1 + (likeEl.checked ? 1 : 0) + (commentToggle.checked && comment ? 2 : 0);

      // ✅ Prevent overdrafting credits
      if (campaign.credits < creditsEarned) {
        messageEl.textContent = "❌ Not enough credits in campaign.";
        return;
      }

      // 🔥 Create repost record
      await firebase.firestore().collection("reposts").doc(repostId).set({
        userId: user.uid,
        campaignId,
        trackUrl: campaign.trackUrl,
        liked: likeEl.checked,
        comment: comment || null,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        prompted: false
      });

      // 💰 Add credits to user
      await firebase.firestore().collection("users").doc(user.uid).update({
        credits: firebase.firestore.FieldValue.increment(creditsEarned)
      });

      // 💸 Deduct credits from campaign
      await firebase.firestore().collection("campaigns").doc(campaignId).update({
        credits: firebase.firestore.FieldValue.increment(-creditsEarned)
      });

      // 🎉 Show success
      messageEl.textContent = `🎉 Repost successful! You earned ${creditsEarned} credits.`;
      actionsEl.style.display = "none";
    };

  } catch (err) {
    console.error("❌ Error loading campaign:", err);
    titleEl.textContent = "❌ Failed to load campaign.";
    infoEl.innerHTML = "";
  }
});


