// Firebase Functions init
const functions = firebase.app().functions("us-central1");

// DOM elements
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
let campaignId = urlParams.get("campaignId") || urlParams.get("id"); // fallback for safety

console.log("📦 Full URL:", window.location.href);
console.log("📦 Detected campaignId:", campaignId);

if (!campaignId) {
  document.getElementById("campaignTitle").textContent = "❌ Invalid Repost Link";
  messageEl.textContent = "Missing campaignId. Please access this page from the Explore section.";
  actionsEl.style.display = "none";
} else {
  // Show/hide comment box
  commentToggle.addEventListener("change", () => {
    commentBox.style.display = commentToggle.checked ? "block" : "none";
  });

  // Load campaign
  firebase.firestore().collection("campaigns").doc(campaignId).get()
    .then(doc => {
      if (!doc.exists) {
        messageEl.textContent = "⚠️ Campaign not found.";
        return;
      }

      const data = doc.data();
      document.getElementById("campaignTitle").textContent = data.title || "Untitled";
      document.getElementById("campaignInfo").innerHTML = `
        <p><strong>Genre:</strong> ${data.genre || "Unknown"}</p>
        <p><strong>Credits Remaining:</strong> ${data.credits || 0}</p>
        <iframe width="100%" height="166" scrolling="no" frameborder="no"
          allow="autoplay" src="https://w.soundcloud.com/player/?url=${encodeURIComponent(data.trackUrl)}"></iframe>
      `;
      actionsEl.style.display = "block";
    })
    .catch(err => {
      console.error("❌ Error loading campaign:", err);
      messageEl.textContent = "Failed to load campaign. Check the console for details.";
    });

  // Handle repost
  submitBtn.onclick = async () => {
    const liked = likeEl.checked;
    const comment = commentToggle.checked ? commentBox.value.trim() : null;

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
}
