// ✅ Firebase Initialization Assumes Already Done (in firebase-init.js)
const auth = firebase.auth();
const firestore = firebase.firestore();
const functions = firebase.app().functions("us-central1");

// ✅ DOM Elements
const submitBtn = document.getElementById("submitRepost");
const likeEl = document.getElementById("likeTrack");
const commentToggle = document.getElementById("commentBoxToggle");
const commentBox = document.getElementById("commentText");
const messageEl = document.getElementById("message");
const actionsEl = document.getElementById("repostActions");
const radioLoading = document.getElementById("radioLoading");
const radioSound = document.getElementById("radioSound");
const campaignTitle = document.getElementById("campaignTitle");
const campaignInfo = document.getElementById("campaignInfo");

// ✅ Get campaignId from URL
const urlParams = new URLSearchParams(window.location.search);
const campaignId = urlParams.get("campaignId");
if (!campaignId) {
  throw new Error("Missing campaignId in URL.");
}

// ✅ Load Campaign Info
async function loadCampaign() {
  try {
    const doc = await firestore.collection("campaigns").doc(campaignId).get();
    if (!doc.exists) {
      campaignTitle.textContent = "Campaign not found.";
      return;
    }
    const data = doc.data();
    campaignTitle.textContent = data.title || "Untitled Track";
    campaignInfo.innerHTML = `
      <p><strong>Artist:</strong> ${data.artist || "Unknown"}</p>
      <p><strong>Genre:</strong> ${data.genre || "Unknown"}</p>
      <p><strong>Credits Left:</strong> ${data.credits || 0}</p>
      <p><a href="${data.trackUrl}" target="_blank">🎵 Listen on SoundCloud</a></p>
    `;
    actionsEl.style.display = "block";
  } catch (err) {
    console.error("❌ Failed to load campaign:", err);
  }
}
loadCampaign();

// ✅ Submit Repost
submitBtn.onclick = async () => {
  const user = auth.currentUser;
  if (!user) {
    alert("Please sign in first.");
    return;
  }

  const liked = likeEl.checked;
  const comment = commentToggle.checked ? commentBox.value.trim() : null;

  // 🎛️ Show radio animation
  radioLoading.style.display = "block";
  radioSound.currentTime = 0;
  radioSound.play();
  messageEl.textContent = "";

  try {
    const res = await fetch("https://us-central1-trackrepost-921f8.cloudfunctions.net/processRepost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.uid,
        campaignId,
        earnedCredits: 1 + (liked ? 1 : 0) + (comment ? 2 : 0),
        liked,
        comment
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Repost failed");

    messageEl.textContent = `🎉 You earned ${data.success ? "credits!" : "nothing."}`;
    actionsEl.style.display = "none";
  } catch (err) {
    console.error("❌ Repost failed:", err);
    alert("Repost failed. Please try again.");
  } finally {
    radioLoading.style.display = "none";
    radioSound.pause();
  }
};

// ✅ Show/hide comment box
commentToggle.addEventListener("change", () => {
  commentBox.style.display = commentToggle.checked ? "block" : "none";
});
