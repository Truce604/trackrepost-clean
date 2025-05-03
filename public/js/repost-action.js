// ✅ Firebase Compatibility SDK assumed loaded
const submitBtn = document.getElementById("submitRepost");
const likeEl = document.getElementById("likeTrack");
const commentToggle = document.getElementById("commentBoxToggle");
const commentBox = document.getElementById("commentText");
const messageEl = document.getElementById("message");
const actionsEl = document.getElementById("repostActions");
const radioLoading = document.getElementById("radioLoading");
const radioSound = document.getElementById("radioSound");

// ✅ Extract campaignId from URL
const urlParams = new URLSearchParams(window.location.search);
const campaignId = urlParams.get("campaignId");

if (!campaignId) {
  messageEl.textContent = "⚠️ Missing campaignId. Please access from Explore page.";
  throw new Error("Missing campaignId in URL.");
}

// ✅ Toggle comment box visibility
commentToggle.addEventListener("change", () => {
  commentBox.style.display = commentToggle.checked ? "block" : "none";
});

// ✅ Submit repost
submitBtn.onclick = async () => {
  const liked = likeEl.checked;
  const comment = commentToggle.checked ? commentBox.value.trim() : null;

  // 🎛️ Play radio static and show loading
  radioLoading.style.display = "block";
  radioSound.currentTime = 0;
  radioSound.play();
  messageEl.textContent = "";

  try {
    const user = firebase.auth().currentUser;
    if (!user) {
      alert("⚠️ Please sign in first.");
      return;
    }

    const result = await firebase.functions().httpsCallable("processRepost")({
      campaignId,
      liked,
      comment,
    });

    const earned = result.data.earned;
    messageEl.textContent = `🎉 You earned ${earned} credits!`;
    actionsEl.style.display = "none";
    console.log("✅ Repost processed:", result.data);
  } catch (err) {
    console.error("❌ Repost failed:", err);
    alert(err.message || "Something went wrong.");
  } finally {
    radioLoading.style.display = "none";
    radioSound.pause();
  }
};
