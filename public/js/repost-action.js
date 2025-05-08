// ✅ /js/repost-action.js (Launch Ready)
window.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  let campaignId = urlParams.get("campaignId");

  // 🔁 Fallback if missing from URL
  if (!campaignId) {
    campaignId = localStorage.getItem("lastCampaignId");
  }

  if (!campaignId) {
    document.getElementById("message").textContent = "❌ Missing campaign ID. Please access this page from Explore.";
    return;
  }

  const campaignTitle = document.getElementById("campaignTitle");
  const campaignInfo = document.getElementById("campaignInfo");
  const repostActions = document.getElementById("repostActions");
  const likeTrack = document.getElementById("likeTrack");
  const commentBoxToggle = document.getElementById("commentBoxToggle");
  const commentText = document.getElementById("commentText");
  const submitBtn = document.getElementById("submitRepost");
  const message = document.getElementById("message");
  const radioSound = document.getElementById("radioSound");
  const radioLoading = document.getElementById("radioLoading");

  let campaignData = null;

  try {
    const doc = await db.collection("campaigns").doc(campaignId).get();
    if (!doc.exists) throw new Error("Campaign not found");

    campaignData = doc.data();
    campaignTitle.textContent = campaignData.title || "Untitled Campaign";
    campaignInfo.innerHTML = `
      <iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay"
        src="https://w.soundcloud.com/player/?url=${encodeURIComponent(campaignData.trackUrl)}">
      </iframe>
      <p>🎯 Genre: ${campaignData.genre}</p>
      <p>💰 Available Credits: ${campaignData.credits}</p>
    `;
    repostActions.style.display = "block";
  } catch (err) {
    message.textContent = `❌ ${err.message}`;
    return;
  }

  commentBoxToggle.addEventListener("change", () => {
    commentText.style.display = commentBoxToggle.checked ? "block" : "none";
  });

  submitBtn.onclick = async () => {
    message.textContent = "⏳ Submitting repost...";
    const user = firebase.auth().currentUser;
    if (!user) return (message.textContent = "⚠️ Please sign in.");

    const liked = likeTrack.checked;
    const comment = commentBoxToggle.checked ? commentText.value.trim() : null;
    const earnedCredits = 1 + (liked ? 1 : 0) + (comment ? 2 : 0);

    // 📻 Play radio sound + loading spin
    radioLoading.style.display = "block";
    radioSound.currentTime = 0;
    radioSound.play();

    try {
      const response = await fetch(
        "https://us-central1-trackrepost-921f8.cloudfunctions.net/processRepost",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.uid,
            campaignId,
            earnedCredits,
            liked,
            comment,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        message.textContent = `✅ Repost complete! You earned ${data.earnedCredits} credits.`;
        localStorage.removeItem("lastCampaignId");
      } else {
        message.textContent = `❌ Failed: ${data.error || "Unknown error"}`;
      }
    } catch (err) {
      console.error("❌ Repost failed:", err);
      message.textContent = `❌ Repost failed: ${err.message}`;
    } finally {
      radioLoading.style.display = "none";
      radioSound.pause();
    }
  };
});