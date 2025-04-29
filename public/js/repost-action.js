// ✅ No db initialization at top! (db is already globally available)

const submitBtn = document.getElementById("submitRepost");
const likeEl = document.getElementById("likeTrack");
const commentToggle = document.getElementById("commentBoxToggle");
const commentBox = document.getElementById("commentText");
const messageEl = document.getElementById("message");
const actionsEl = document.getElementById("repostActions");
const radioLoading = document.getElementById("radioLoading");
const radioSound = document.getElementById("radioSound");
const campaignTitleEl = document.getElementById("campaignTitle");
const campaignInfoEl = document.getElementById("campaignInfo");

const functions = firebase.app().functions("us-central1");

// ✅ Get campaignId from URL
const urlParams = new URLSearchParams(window.location.search);
const campaignId = urlParams.get('campaignId');

// ✅ Safe Redirect if missing campaignId
if (!campaignId) {
  alert("Invalid or missing campaign ID. Redirecting to Explore.");
  window.location.href = "explore.html"; 
  throw new Error("Missing campaignId - user redirected.");
}

// ✅ Load campaign data
async function loadCampaign() {
  try {
    const campaignRef = db.collection("campaigns").doc(campaignId); // ✅ db used directly
    const campaignSnap = await campaignRef.get();

    if (!campaignSnap.exists) {
      alert("Campaign not found. Redirecting to Explore.");
      window.location.href = "explore.html"; 
      return;
    }

    const campaign = campaignSnap.data();
    campaignTitleEl.textContent = campaign.title || "Untitled Track";

    campaignInfoEl.innerHTML = `
      <p><strong>Artist:</strong> ${campaign.artist || "Unknown"}</p>
      <p><strong>Genre:</strong> ${campaign.genre || "Unknown"}</p>
      <p><strong>Credits:</strong> ${campaign.credits || "0"}</p>
      <a href="${campaign.trackUrl}" target="_blank" class="button">🎵 Listen to Track</a>
    `;

    actionsEl.style.display = "block"; 
  } catch (error) {
    console.error("Error loading campaign:", error);
    alert("Error loading campaign. Redirecting.");
    window.location.href = "explore.html"; 
  }
}

// ✅ Handle repost submit
submitBtn.onclick = async () => {
  const liked = likeEl.checked;
  const comment = commentToggle.checked ? commentBox.value.trim() : null;

  radioLoading.style.display = "block";
  radioSound.currentTime = 0;
  radioSound.play();
  messageEl.textContent = "";

  try {
    const { data } = await functions
      .httpsCallable("processRepost")({ campaignId, liked, comment });

    messageEl.textContent = `🎉 You earned ${data.earned} credits!`;
    actionsEl.style.display = "none";
    console.log("✅ Repost complete:", data);
  } catch (err) {
    console.error("❌ Repost failed:", err);
    alert(err.message);
  } finally {
    radioLoading.style.display = "none";
    radioSound.pause();
  }
};

// ✅ Show/hide comment box
commentToggle.addEventListener("change", () => {
  commentBox.style.display = commentToggle.checked ? "block" : "none";
});

// ✅ Load campaign on page start
loadCampaign();


