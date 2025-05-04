// /js/explore-campaigns.js

document.addEventListener("DOMContentLoaded", async () => {
  const campaignList = document.getElementById("campaignList");
  campaignList.innerHTML = "<p>Loading campaigns...</p>";

  try {
    const snapshot = await db.collection("campaigns").orderBy("createdAt", "desc").get();

    if (snapshot.empty) {
      campaignList.innerHTML = "<p>No campaigns found.</p>";
      return;
    }

    campaignList.innerHTML = "";

    snapshot.forEach((doc) => {
      const data = doc.data();
      const campaignId = doc.id;

      const card = document.createElement("div");
      card.className = "campaign-card";

      card.innerHTML = `
        <div class="soundcloud-embed">
          <iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay"
            src="https://w.soundcloud.com/player/?url=${encodeURIComponent(data.trackUrl)}">
          </iframe>
        </div>
        <div class="campaign-details">
          <h3>${data.title || "Untitled"}</h3>
          <p>🎵 ${data.genre || "Genre"}</p>
          <p>💰 ${data.credits} credits left</p>
          <a href="repost-action.html?campaignId=${campaignId}" class="repost-btn">Repost This</a>
        </div>
      `;

      campaignList.appendChild(card);
    });
  } catch (err) {
    console.error("❌ Error loading campaigns:", err);
    campaignList.innerHTML = "<p>Failed to load campaigns.</p>";
  }
});

