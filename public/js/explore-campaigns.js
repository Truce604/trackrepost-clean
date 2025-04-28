// ✅ Initialize Firestore
const db = firebase.firestore();
const campaignList = document.getElementById("campaignList");

// ✅ Load campaigns
async function loadCampaigns() {
  try {
    const snapshot = await db.collection("campaigns").orderBy("createdAt", "desc").get();

    if (snapshot.empty) {
      campaignList.innerHTML = "<p>No campaigns found.</p>";
      return;
    }

    campaignList.innerHTML = ""; // Clear loading text

    snapshot.forEach(doc => {
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
            src="https://w.soundcloud.com/player/?url=${encodeURIComponent(data.trackUrl || '')}">
          </iframe>
        </div>
        <div class="campaign-details">
          <h3>${data.title || "Untitled Track"}</h3>
          <p><strong>Artist:</strong> ${data.artist || "Unknown"}</p>
          <p><strong>Genre:</strong> ${data.genre || "Unknown"}</p>
          <p><strong>Credits:</strong> ${data.credits || 0}</p>
          <a href="repost-action.html?campaignId=${campaignId}" class="repost-btn">🎵 Repost This</a>
        </div>
      `;

      campaignList.appendChild(card);
    });
  } catch (error) {
    console.error("Error loading campaigns:", error);
    campaignList.innerHTML = "<p>Failed to load campaigns.</p>";
  }
}

// ✅ Auto load on page ready
document.addEventListener("DOMContentLoaded", loadCampaigns);
