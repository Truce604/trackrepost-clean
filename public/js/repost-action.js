// ✅ Firebase Auth + Firestore references (assume firebase-init.js already initialized Firebase)
const db = firebase.firestore();
const functions = firebase.app().functions("us-central1");
const currentUser = firebase.auth().currentUser;

// ✅ DOM Elements
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
  throw new Error("Missing campaignId in URL.");
}

// ✅ Load campaign info
async function loadCampaign() {
  try {
    const doc = await db.collection("campaigns").doc(campaignId).get();
    if (!doc.exists) throw new Error("Campaign not found");

    const data = doc.data();
    document.getElementById("campaignTitle").textContent = data.title || "Untitled";
    document.getElementById("campaignInfo").innerHTML = `
      <p>🎵 Genre: ${data.genre}</p>
      <p>💰 Remaining Credits: ${data.credits}</p>
      <p>🎧 <a href="${data.trackUrl}" target="_blank">Listen on SoundCloud</a></p>
    `;

    actionsEl.style.display = "block";
  } catch (err) {
    messageEl.textContent = `❌ ${err.message}`;
    console.error("Failed to load campaign:", err);
  }
}

// ✅ Handle Repost Submission
submitBtn.onclick = async () => {
  const liked = likeEl.checked;
  const comment = commentToggle.checked ? commentBox.value.trim() : null;

  // Show radio dial + sound
  radioLoading.style.display = "block";
  radioSound.currentTime = 0;
  radioSound.play();
  messageEl.textContent = "";

  try {
    const user = firebase.auth().currentUser;
    if (!user) throw new Error("Not signed in.");

    const { data } = await functions.httpsCallable("processRepost")({
      campaignId,
      liked,
      comment
    });

    messageEl.textContent = `🎉 You earned ${data.earned} credits!`;
    actionsEl.style.display = "none";
  } catch (err) {
    console.error("❌ Repost failed:", err);
    alert(err.message || "Repost failed.");
  } finally {
    radioLoading.style.display = "none";
    radioSound.pause();
  }
};

// ✅ Show/hide comment box toggle
commentToggle.addEventListener("change", () => {
  commentBox.style.display = commentToggle.checked ? "block" : "none";
});

// ✅ Init
loadCampaign();
