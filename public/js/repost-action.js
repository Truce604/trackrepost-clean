// ✅ repost-action.js (FULL CODE)

// Firebase Compat SDKs already loaded globally via HTML
const db = firebase.firestore();
const auth = firebase.auth();
const functions = firebase.app().functions("us-central1");

// ✅ Get campaignId from URL
const urlParams = new URLSearchParams(window.location.search);
const campaignId = urlParams.get("campaignId");

if (!campaignId) {
  throw new Error("Missing campaignId in URL.");
}

// ✅ Select DOM Elements
const campaignTitle = document.getElementById("campaignTitle");
const campaignInfo = document.getElementById("campaignInfo");
const submitBtn = document.getElementById("submitRepost");
const likeEl = document.getElementById("likeTrack");
const commentToggle = document.getElementById("commentBoxToggle");
const commentBox = document.getElementById("commentText");
const messageEl = document.getElementById("message");
const actionsEl = document.getElementById("repostActions");
const radioLoading = document.getElementById("radioLoading");
const radioSound = document.getElementById("radioSound");

// ✅ Load Campaign
async function loadCampaign() {
  const doc = await db.collection("campaigns").doc(campaignId).get();
  if (!doc.exists) {
    campaignTitle.textContent = "Campaign not found.";
    return;
  }

  const data = doc.data();
  campaignTitle.textContent = data.title || "Track Repost";
  campaignInfo.innerHTML = `
    <p><strong>Genre:</strong> ${data.genre || "N/A"}</p>
    <p><strong>Credits Remaining:</strong> ${data.credits}</p>
    <p><a href="${data.trackUrl}" target="_blank">🔗 SoundCloud Track</a></p>
  `;

  actionsEl.style.display = "block";
}

// ✅ Repost Button Click
submitBtn.onclick = async () => {
  const liked = likeEl.checked;
  const comment = commentToggle.checked ? commentBox.value.trim() : null;

  // 🔊 Radio Effect
  radioLoading.style.display = "block";
  radioSound.currentTime = 0;
  radioSound.play();
  messageEl.textContent = "";

  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Not signed in");

    const res = await fetch("https://us-central1-trackrepost-921f8.cloudfunctions.net/processRepost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.uid,
        campaignId,
        earnedCredits: 1 + (liked ? 1 : 0) + (comment ? 2 : 0),
        liked,
        comment,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Internal Error");

    messageEl.textContent = `🎉 Repost complete! You earned ${data.earnedCredits || 0} credits.`;
    actionsEl.style.display = "none";
  } catch (err) {
    console.error("❌ Repost failed:", err);
    alert(err.message);
  } finally {
    radioLoading.style.display = "none";
    radioSound.pause();
  }
};

// ✅ Toggle Comment Box
commentToggle.addEventListener("change", () => {
  commentBox.style.display = commentToggle.checked ? "block" : "none";
});

// ✅ Load on Page Load
auth.onAuthStateChanged(user => {
  if (user) loadCampaign();
  else campaignTitle.textContent = "Please sign in to continue.";
});
