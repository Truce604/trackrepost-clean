// ✅ Firebase Init
const auth = firebase.auth();
const db = firebase.firestore();
const functions = firebase.app().functions("us-central1");

// ✅ Get campaignId from URL
const urlParams = new URLSearchParams(window.location.search);
const campaignId = urlParams.get("campaignId");
if (!campaignId) {
  throw new Error("Missing campaignId in URL. Please access from the Explore section.");
}

// ✅ DOM Elements
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

// ✅ Load campaign info
async function loadCampaign() {
  try {
    const doc = await db.collection("campaigns").doc(campaignId).get();
    if (!doc.exists) {
      campaignTitle.textContent = "❌ Campaign not found";
      return;
    }

    const data = doc.data();
    campaignTitle.textContent = data.title || "🎵 Campaign";
    campaignInfo.innerHTML = `
      <p><strong>Artist:</strong> ${data.artist || "Unknown"}</p>
      <p><strong>Genre:</strong> ${data.genre || "Unknown"}</p>
      <p><strong>Credits Available:</strong> ${data.credits || 0}</p>
      <iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay"
        src="https://w.soundcloud.com/player/?url=${encodeURIComponent(data.trackUrl)}">
      </iframe>
    `;

    actionsEl.style.display = "block";
  } catch (err) {
    console.error("❌ Error loading campaign:", err);
    campaignTitle.textContent = "❌ Error loading campaign";
  }
}

// ✅ Handle submit click
submitBtn.onclick = async () => {
  const liked = likeEl.checked;
  const comment = commentToggle.checked ? commentBox.value.trim() : null;

  radioLoading.style.display = "block";
  radioSound.currentTime = 0;
  radioSound.play();
  messageEl.textContent = "";

  try {
    const user = auth.currentUser;
    if (!user) {
      alert("⚠️ Please sign in first.");
      return;
    }

    const response = await fetch("https://us-central1-trackrepost-921f8.cloudfunctions.net/processRepost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.uid,
        campaignId,
        earnedCredits: 1 + (liked ? 1 : 0) + (comment ? 2 : 0),
        liked,
        comment
      })
    });

    const result = await response.json();
    if (result.success) {
      messageEl.textContent = `🎉 Repost complete! Credits earned.`;
      actionsEl.style.display = "none";
    } else {
      throw new Error(result.error || "Unknown error");
    }
  } catch (err) {
    console.error("❌ Repost failed:", err);
    alert("❌ Repost failed: " + err.message);
  } finally {
    radioLoading.style.display = "none";
    radioSound.pause();
  }
};

// ✅ Toggle comment box
commentToggle.addEventListener("change", () => {
  commentBox.style.display = commentToggle.checked ? "block" : "none";
});

// ✅ Init
auth.onAuthStateChanged(user => {
  if (user) loadCampaign();
  else campaignTitle.textContent = "⚠️ Please log in to view campaign.";
});
