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

const urlParams = new URLSearchParams(window.location.search);
const campaignId = urlParams.get('campaignId');

if (!campaignId) {
  alert("Missing campaign ID. Redirecting...");
  window.location.href = "explore.html";
  throw new Error("Missing campaignId in URL");
}

async function loadCampaign() {
  try {
    const campaignRef = db.collection("campaigns").doc(campaignId);
    const campaignSnap = await campaignRef.get();

    if (!campaignSnap.exists) {
      alert("Campaign not found. Redirecting...");
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
    alert("Error loading campaign. Redirecting...");
    window.location.href = "explore.html";
  }
}

submitBtn.onclick = async () => {
  const liked = likeEl.checked;
  const comment = commentToggle.checked ? commentBox.value.trim() : null;

  radioLoading.style.display = "block";
  radioSound.currentTime = 0;
  radioSound.play();
  messageEl.textContent = "";

  try {
    const user = firebase.auth().currentUser;
    if (!user) {
      alert("You must be signed in to repost.");
      return;
    }

    const response = await fetch("https://us-central1-trackrepost-921f8.cloudfunctions.net/processRepost", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        campaignId,
        liked,
        comment,
        userId: user.uid,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }

    const data = await response.json();
    messageEl.textContent = `🎉 You earned ${data.earned} credits!`;
    actionsEl.style.display = "none";
    console.log("✅ Repost complete:", data);
  } catch (err) {
    console.error("❌ Repost failed:", err);
    alert("Something went wrong while reposting.");
  } finally {
    radioLoading.style.display = "none";
    radioSound.pause();
  }
};

commentToggle.addEventListener("change", () => {
  commentBox.style.display = commentToggle.checked ? "block" : "none";
});

loadCampaign();
