// Initialize Firebase Functions
const functions = firebase.app().functions("us-central1");

// Select DOM Elements
const submitBtn = document.getElementById("submitRepost");
const likeEl = document.getElementById("likeTrack");
const commentToggle = document.getElementById("commentBoxToggle");
const commentBox = document.getElementById("commentText");
const messageEl = document.getElementById("message");
const actionsEl = document.getElementById("repostActions");
const radioLoading = document.getElementById("radioLoading");
const radioSound = document.getElementById("radioSound");

// Get campaignId from URL
const urlParams = new URLSearchParams(window.location.search);
const campaignId = urlParams.get("campaignId");

if (!campaignId) {
  messageEl.textContent = "❌ Missing campaignId in URL.";
  throw new Error("Missing campaignId in URL.");
}

// Show/hide comment box
commentToggle.addEventListener("change", () => {
  commentBox.style.display = commentToggle.checked ? "block" : "none";
});

// Load campaign info
firebase.firestore().collection("campaigns").doc(campaignId).get()
  .then(doc => {
    if (!doc.exists) {
      messageEl.textContent = "⚠️ Campaign not found.";
      return;
    }

    const data = doc.data();
    document.getElementById("campaignTitle").textContent = data.title || "Untitled Track";
    document.getElementById("campaignInfo").innerHTML = `
      <p><strong>Genre:</strong> ${data.genre || "Unknown"}</p>
      <p><strong>Credits Remaining:</strong> ${data.credits || 0}</p>
      <iframe width="100%" height="166" scrolling="no" frameborder="no"
        allow="autoplay" src="https://w.soundcloud.com/player/?url=${encodeURIComponent(data.trackUrl)}"></iframe>
    `;
    actionsEl.style.display = "block";
  })
  .catch(err => {
    console.error("❌ Failed to load campaign:", err);
    messageEl.textContent = "Error loading campaign.";
  });

// Handle repost submission
submitBtn.onclick = async () => {
  const liked = likeEl.checked;
  const comment = commentToggle.checked ? commentBox.value.trim() : null;

  // Show radio dial and static
  radioLoading.style.display = "block";
  radioSound.currentTime = 0;
  radioSound.play();
  messageEl.textContent = "";

  try {
    const result = await functions.httpsCallable("processRepost")({
      campaignId, liked, comment
    });

    const earned = result.data.earned || 0;
    messageEl.textContent = `🎉 You earned ${earned} credits!`;
    actionsEl.style.display = "none";
    console.log("✅ Repost complete:", result.data);
  } catch (err) {
    console.error("❌ Repost failed:", err);
    alert("Repost failed: " + (err.message || "Unknown error"));
  } finally {
    radioLoading.style.display = "none";
    radioSound.pause();
  }
};

