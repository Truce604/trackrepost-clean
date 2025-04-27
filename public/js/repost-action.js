document.addEventListener("DOMContentLoaded", () => {
  const titleEl = document.getElementById("campaignTitle");
  const infoEl = document.getElementById("campaignInfo");
  const actionsEl = document.getElementById("repostActions");
  const messageEl = document.getElementById("message");
  const likeEl = document.getElementById("likeTrack");
  const commentToggle = document.getElementById("commentBoxToggle");
  const commentBox = document.getElementById("commentText");
  const submitBtn = document.getElementById("submitRepost");
  const db = firebase.firestore();

  firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
      titleEl.textContent = "⚠️ Please sign in to repost.";
      return;
    }

    const campaignId = new URLSearchParams(window.location.search).get("id");
    if (!campaignId) {
      titleEl.textContent = "❌ Campaign not found.";
      return;
    }

    // Load campaign
    let campaign;
    try {
      const doc = await db.collection("campaigns").doc(campaignId).get();
      if (!doc.exists) throw new Error("not found");
      campaign = doc.data();
    } catch (e) {
      console.error("❌ CAMPAIGN READ ERROR:", e);
      titleEl.textContent = "❌ Failed to load campaign.";
      return;
    }

    // Prevent self-repost
    if (campaign.userId === user.uid) {
      titleEl.textContent = "🚫 You can't repost your own campaign.";
      return;
    }

    // Show info
    titleEl.textContent = campaign.title || "Untitled Track";
    infoEl.innerHTML = `
      <p><strong>Artist:</strong> ${campaign.artist}</p>
      <p><strong>Genre:</strong> ${campaign.genre}</p>
      <p><strong>Credits Left:</strong> ${campaign.credits}</p>
      <iframe src="https://w.soundcloud.com/player/?url=${encodeURIComponent(campaign.trackUrl)}"
        width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay"></iframe>
    `;
    actionsEl.style.display = "block";

    // Toggle comment box
    commentToggle.onchange = () => {
      commentBox.style.display = commentToggle.checked ? "block" : "none";
    };

    // Submit
    submitBtn.onclick = async () => {
      const likeCredit = likeEl.checked ? 1 : 0;
      const commentCredit = (commentToggle.checked && commentBox.value.trim()) ? 2 : 0;
      const earned = 1 + likeCredit + commentCredit;

      // 1) Write repost
      try {
        await db.collection("reposts").doc(`${user.uid}_${campaignId}`).set({
          userId: user.uid,
          campaignId,
          trackUrl: campaign.trackUrl,
          liked: likeEl.checked,
          comment: commentBox.value.trim() || null,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          prompted: false
        });
        console.log("✅ Repost doc created");
      } catch (e) {
        console.error("❌ REPOST.CREATE ERROR:", e);
      }

      // 2) Update user credits
      try {
        await db.collection("users").doc(user.uid).update({
          credits: firebase.firestore.FieldValue.increment(earned)
        });
        console.log("✅ User credits updated");
      } catch (e) {
        console.error("❌ USER.UPDATE ERROR:", e);
      }

      // 3) Deduct campaign credits
      try {
        await db.collection("campaigns").doc(campaignId).update({
          credits: firebase.firestore.FieldValue.increment(-earned)
        });
        console.log("✅ Campaign credits decremented");
      } catch (e) {
        console.error("❌ CAMPAIGN.UPDATE ERROR:", e);
      }

      messageEl.textContent = `🎉 You earned ${earned} credits!`;
      actionsEl.style.display = "none";
    };
  });
});




