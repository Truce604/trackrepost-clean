// ✅ Ensure user is signed in
firebase.auth().onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "/index.html"; // Redirect to login
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const campaignId = urlParams.get("campaignId");

  if (!campaignId) {
    document.getElementById("campaignTitle").textContent = "⚠️ Missing campaignId in URL";
    return;
  }

  const db = firebase.firestore();
  const functions = firebase.app().functions("us-central1");
  const campaignRef = db.collection("campaigns").doc(campaignId);
  const campaignSnap = await campaignRef.get();

  if (!campaignSnap.exists) {
    document.getElementById("campaignTitle").textContent = "⚠️ Campaign not found";
    return;
  }

  const campaign = campaignSnap.data();
  document.getElementById("campaignTitle").textContent = campaign.title || "Track Title";
  document.getElementById("campaignInfo").innerHTML = `
    <p><strong>Artist:</strong> ${campaign.artist || "Unknown"}</p>
    <p><strong>Genre:</strong> ${campaign.genre || "Unknown"}</p>
    <p><strong>Credits Available:</strong> ${campaign.credits}</p>
    <iframe width="100%" height="166" scrolling="no" frameborder="no"
      src="https://w.soundcloud.com/player/?url=${encodeURIComponent(campaign.trackUrl)}">
    </iframe>
  `;
  document.getElementById("repostActions").style.display = "block";

  // Event handlers
  const likeEl = document.getElementById("likeTrack");
  const commentToggle = document.getElementById("commentBoxToggle");
  const commentBox = document.getElementById("commentText");
  const submitBtn = document.getElementById("submitRepost");
  const messageEl = document.getElementById("message");
  const radioLoading = document.getElementById("radioLoading");
  const radioSound = document.getElementById("radioSound");

  commentToggle.addEventListener("change", () => {
    commentBox.style.display = commentToggle.checked ? "block" : "none";
  });

  submitBtn.onclick = async () => {
    const liked = likeEl.checked;
    const comment = commentToggle.checked ? commentBox.value.trim() : null;

    radioLoading.style.display = "block";
    radioSound.currentTime = 0;
    radioSound.play();
    messageEl.textContent = "";

    try {
      const result = await functions.httpsCallable("processRepost")({
        campaignId,
        liked,
        comment,
      });
      messageEl.textContent = `🎉 You earned ${result.data.earned} credits!`;
      document.getElementById("repostActions").style.display = "none";
    } catch (err) {
      console.error("❌ Repost failed:", err);
      messageEl.textContent = `❌ ${err.message}`;
    } finally {
      radioLoading.style.display = "none";
      radioSound.pause();
    }
  };
});

