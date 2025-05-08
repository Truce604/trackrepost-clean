window.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const campaignId = urlParams.get("campaignId");

  const campaignTitle = document.getElementById("campaignTitle");
  const campaignInfo = document.getElementById("campaignInfo");
  const repostActions = document.getElementById("repostActions");
  const likeTrack = document.getElementById("likeTrack");
  const commentBoxToggle = document.getElementById("commentBoxToggle");
  const commentText = document.getElementById("commentText");
  const submitBtn = document.getElementById("submitRepost");
  const message = document.getElementById("message");
  const radioLoading = document.getElementById("radioLoading");
  const radioSound = document.getElementById("radioSound");

  if (!campaignId) {
    message.textContent = "❌ Missing campaign ID. Please access this page from the Explore section.";
    return;
  }

  try {
    const doc = await db.collection("campaigns").doc(campaignId).get();
    if (!doc.exists) throw new Error("Campaign not found");

    const data = doc.data();
    campaignTitle.textContent = data.title || "Untitled Campaign";
    campaignInfo.innerHTML = `
      <iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay"
        src="https://w.soundcloud.com/player/?url=${encodeURIComponent(data.trackUrl)}">
      </iframe>
      <p>🎯 Genre: ${data.genre}</p>
      <p>💰 Available Credits: ${data.credits}</p>
    `;
    repostActions.style.display = "block";

    // Toggle comment box
    commentBoxToggle.addEventListener("change", () => {
      commentText.style.display = commentBoxToggle.checked ? "block" : "none";
    });

    // Submit repost
    submitBtn.onclick = async () => {
      message.textContent = "⏳ Submitting repost...";
      const user = firebase.auth().currentUser;
      if (!user) return (message.textContent = "⚠️ Please sign in.");

      const liked = likeTrack.checked;
      const comment = commentBoxToggle.checked ? commentText.value.trim() : null;
      const earnedCredits = 1 + (liked ? 1 : 0) + (comment ? 2 : 0);

      try {
        radioLoading.style.display = "block";
        radioSound.play();

        const response = await fetch(
          "https://us-central1-trackrepost-921f8.cloudfunctions.net/processRepost",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.uid,
              campaignId,
              liked,
              comment,
            }),
          }
        );

        const data = await response.json();
        if (data.success) {
          message.textContent = `✅ Repost complete! You earned ${data.earnedCredits} credits.`;
        } else {
          message.textContent = `❌ Error: ${data.error}`;
        }
      } catch (err) {
        console.error("❌ Repost failed:", err);
        message.textContent = `❌ Repost failed: ${err.message}`;
      } finally {
        radioLoading.style.display = "none";
        radioSound.pause();
        radioSound.currentTime = 0;
      }
    };
  } catch (err) {
    console.error(err);
    message.textContent = `❌ ${err.message}`;
  }
});
