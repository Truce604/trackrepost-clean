// /js/explore-campaigns.js
firebase.auth().onAuthStateChanged(async (user) => {
  if (!user) return;

  const campaignList = document.getElementById("campaignList");
  campaignList.innerHTML = "⏳ Loading campaigns...";

  try {
    const snapshot = await firebase.firestore()
      .collection("campaigns")
      .orderBy("createdAt", "desc")
      .get();

    campaignList.innerHTML = "";
    if (snapshot.empty) {
      campaignList.innerHTML = "<p>No active campaigns.</p>";
      return;
    }

    snapshot.forEach(doc => {
      const data = doc.data();
      const id = doc.id;

      // Hide user's own campaign
      if (data.owner === user.uid) return;

      const campaignCard = document.createElement("div");
      campaignCard.className = "campaign-card";

      campaignCard.innerHTML = `
        <div class="soundcloud-embed">
          <iframe 
            width="100%" 
            height="120" 
            scrolling="no" 
            frameborder="no" 
            allow="autoplay"
            src="https://w.soundcloud.com/player/?url=${encodeURIComponent(data.trackUrl)}">
          </iframe>
        </div>
        <div class="campaign-details">
          <h3>${data.title || "Untitled Track"}</h3>
          <p>👤 ${data.artist || "Unknown Artist"}</p>
          <p>🎵 ${data.genre || "Genre"}</p>
          <p>💰 ${data.credits || 0} Credits Available</p>
          <a class="repost-btn" href="/repost-action.html?campaignId=${id}">Repost This</a>
        </div>
      `;

      campaignList.appendChild(campaignCard);
    });
  } catch (err) {
    console.error("🔥 Error loading campaigns:", err);
    campaignList.innerHTML = "<p>❌ Failed to load campaigns.</p>";
  }
});

