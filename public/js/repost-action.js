document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const campaignId = params.get("campaignId");

  if (!campaignId) {
    document.body.innerHTML = "<p style='color:red;'>❌ Missing campaignId in URL.</p>";
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

  try {
    const doc = await firebase.firestore().collection("campaigns").doc(campaignId).get();
    if (!doc.exists) throw new Error("Campaign not found");

    const data = doc.data();
    campaignTitle.textContent = data.title || "Untitled Campaign";

    campaignInfo.innerHTML = `
      <iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay"
        src="https://w.soundcloud.com/player/?url=${encodeURIComponent(data.trackUrl)}">
      </iframe>
      <p>🎯 Genre: ${data.genre || "Unknown"}</p>
      <p>💰 Available Credits: ${data.credits || 0}</p>
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
    radioLoading.style.display = "block";

    const user = firebase.auth().currentUser;
    if (!user) {
      message.textContent = "⚠️ Please sign in.";
      radioLoading.style.display = "none";
      return;
    }

    const liked = likeTrack.checked;
    const comment = commentBoxToggle.checked ? commentText.value.trim() : null;
    const earnedCredits = 1 + (liked ? 1 : 0) + (comment ? 2 : 0);

    try {
      const res = await fetch("https://us-central1-trackrepost-921f8.cloudfunctions.net/processRepost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, campaignId, liked, comment }),
      });

      const result = await res.json();

      if (result.success) {
        message.textContent = `✅ Repost complete! You earned ${result.earnedCredits || earnedCredits} credits.`;
        radioSound.play();
      } else {
        message.textContent = `❌ ${result.error || "Repost failed."}`;
      }
    } catch (err) {
      console.error("❌ Repost error:", err);
      message.textContent = "❌ Repost failed. Please try again.";
    }

    radioLoading.style.display = "none";
  };
});

      
