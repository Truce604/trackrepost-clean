// ✅ Firebase references
const auth = firebase.auth();
const db = firebase.firestore();
const functions = firebase.app().functions("us-central1");

// ✅ DOM elements
const submitBtn = document.getElementById("submitRepost");
const likeEl = document.getElementById("likeTrack");
const commentToggle = document.getElementById("commentBoxToggle");
const commentBox = document.getElementById("commentText");
const messageEl = document.getElementById("message");
const actionsEl = document.getElementById("repostActions");
const radioLoading = document.getElementById("radioLoading");
const radioSound = document.getElementById("radioSound");
const campaignInfo = document.getElementById("campaignInfo");
const campaignTitle = document.getElementById("campaignTitle");

// ✅ Extract campaignId from URL
const urlParams = new URLSearchParams(window.location.search);
const campaignId = urlParams.get("campaignId");

if (!campaignId) {
  throw new Error("Missing campaignId in URL.");
}

// ✅ Load campaign
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    messageEl.textContent = "Please sign in to repost this track.";
    return;
  }

  try {
    const campaignDoc = await db.collection("campaigns").doc(campaignId).get();

    if (!campaignDoc.exists) {
      campaignTitle.textContent = "❌ Campaign not found.";
      return;
    }

    const data = campaignDoc.data();

    // Prevent self-repost
    if (data.owner === user.uid) {
      campaignTitle.textContent = "⚠️ You cannot repost your own track.";
      return;
    }

    // Show campaign data
    campaignTitle.textContent = data.title || "Track Campaign";
    campaignInfo.innerHTML = `
      <p>🎵 <strong>Artist:</strong> ${data.artist || "Unknown"}</p>
      <p>🎧 <a href="${data.trackUrl}" target="_blank">Listen on SoundCloud</a></p>
      <p>💰 <strong>Credits Remaining:</strong> ${data.credits || 0}</p>
    `;

    actionsEl.style.display = "block";
  } catch (err) {
    console.error("❌ Error loading campaign:", err);
    messageEl.textContent = "Error loading campaign. Please try again.";
  }
});

// ✅ Handle comment box toggle
commentToggle.addEventListener("change", () => {
  commentBox.style.display = commentToggle.checked ? "block" : "none";
});

// ✅ Handle repost submission
submitBtn.onclick = async () => {
  const liked = likeEl.checked;
  const comment = commentToggle.checked ? commentBox.value.trim() : null;

  // 🎛️ Radio loading
  radioLoading.style.display = "block";
  radioSound.currentTime = 0;
  radioSound.play();
  messageEl.textContent = "";

  try {
    const callable = functions.httpsCallable("processRepost");
    const result = await callable({ campaignId, liked, comment });

    const earned = result.data.earned;
    messageEl.textContent = `🎉 You earned ${earned} credits!`;
    actionsEl.style.display = "none";
    console.log("✅ Repost complete:", result.data);
  } catch (err) {
    console.error("❌ Repost failed:", err);
    messageEl.textContent = "❌ Repost failed. Please try again.";
  } finally {
    radioLoading.style.display = "none";
    radioSound.pause();
  }
};


