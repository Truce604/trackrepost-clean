// explore-campaigns.js
firebase.auth().onAuthStateChanged(async (user) => {
  if (!user) {
    document.getElementById("campaignList").innerHTML =
      "<p>Please sign in to explore campaigns.</p>";
    return;
  }

  const db = firebase.firestore();
  const campaignList = document.getElementById("campaignList");

  try {
    const snapshot = await db.collection("campaigns").orderBy("createdAt", "desc").get();
    campaignList.innerHTML = "";

    if (snapshot.empty) {
      campaignList.innerHTML = "<p>No active campaigns found.</p>";
      return;
    }

    snapshot.forEach((doc) => {
      const data = doc.data();
      const campaignId = doc.id;

      const card = document.createElement("div");
      card.className = "campaign-card";

      card.innerHTML = `
        <div class="soundcloud-embed">
          <iframe
            width="100%"
            height="166"
            scrolling="no"
            frameborder="no"
            allow="autoplay"
            src="https://w.soundcloud.com/player/?url=${encodeURIComponent(data.trackUrl)}">
          </iframe>
        </div>
        <div class="campaign-details">
          <h3>${data.title || "Untitled Track"}</h3>
          <p>👤 ${data.artist || "Unknown Artist"}</p>
          <p>🎵 ${data.genre || "Unknown Genre"}</p>
          <p>💰 ${data.credits || 0} Credits</p>
          <a href="/repost-action.html?campaignId=${campaignId}" class="repost-btn">Repost This</a>
        </div>
      `;

      campaignList.appendChild(card);
    });
  } catch (error) {
    console.error("❌ Error loading campaigns:", error);
    campaignList.innerHTML = "<p>Error loading campaigns.</p>";
  }
});

