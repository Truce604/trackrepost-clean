// ✅ Wait for DOM to fully load
document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const campaignId = urlParams.get("campaignId");

  if (!campaignId) {
    document.body.innerHTML = "<h2 style='color: red;'>❌ Missing campaignId in URL. Please access this page from the Explore section.</h2>";
    throw new Error("Missing campaignId in URL.");
  }

  const campaignTitle = document.getElementById("campaignTitle");
  const campaignInfo = document.getElementById("campaignInfo");
  const likeEl = document.getElementById("likeTrack");
  const commentToggle = document.getElementById("commentBoxToggle");
  const commentBox = document.getElementById("commentText");
  const submitBtn = document.getElementById("submitRepost");
  const messageEl = document.getElementById("message");
  const actionsEl = document.getElementById("repostActions");
  const radioLoading = document.getElementById("radioLoading");
  const radioSound = document.getElementById("radioSound");

  // ✅ Load Campaign
  try {
    const doc = await db.collection("campaigns").doc(campaignId).get();
    if (!doc.exists) {
      campaignTitle.textContent = "Campaign not found.";
      return;
    }

    const data = doc.data();
    campaignTitle.textContent = data.title || "Untitled Campaign";
    campaignInfo.innerHTML = `
      <p>🎵 Genre: ${data.genre}</p>
      <p>🎯 Credits Left: ${data.credits}</p>
      <p>👤 Artist: ${data.artist || "Unknown"}</p>
      <p><a href="${data.trackUrl}" target="_blank">🔗 SoundCloud Link</a></p>
    `;

    actionsEl.style.display = "block";
  } catch (err) {
    campaignTitle.textContent = "Failed to load campaign.";
    console.error("❌ Error loading campaign:", err);
    return;
  }

  // ✅ Comment toggle behavior
  commentToggle.addEventListener("change", () => {
    commentBox.style.display = commentToggle.checked ? "block" : "none";
  });

  // ✅ Submit Repost
  submitBtn.onclick = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("⚠️ Please sign in first.");
      return;
    }

    const liked = likeEl.checked;
    const comment = commentToggle.checked ? commentBox.value.trim() : null;

    messageEl.textContent = "";
    radioLoading.style.display = "block";
    radioSound.currentTime = 0;
    radioSound.play();

    try {
      const response = await fetch("https://us-central1-trackrepost-921f8.cloudfunctions.net/processRepost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          campaignId,
          liked,
          comment,
          earnedCredits: 1 + (liked ? 1 : 0) + (comment ? 2 : 0)
        }),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Failed to repost.");

      messageEl.textContent = `✅ Repost successful! You earned ${result.earnedCredits || "credits"}!`;
      actionsEl.style.display = "none";
    } catch (err) {
      console.error("❌ Repost failed:", err);
      messageEl.textContent = "❌ Repost failed. Try again later.";
    } finally {
      radioLoading.style.display = "none";
      radioSound.pause();
    }
  };
});



