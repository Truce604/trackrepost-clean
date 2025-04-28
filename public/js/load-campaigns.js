const db = firebase.firestore();
const campaignsContainer = document.getElementById("campaigns"); // 🔥 Your container div

async function loadCampaigns() {
  try {
    const snapshot = await db.collection("campaigns").orderBy("createdAt", "desc").get();

    if (snapshot.empty) {
      campaignsContainer.innerHTML = "<p>No campaigns available.</p>";
      return;
    }

    snapshot.forEach(doc => {
      const campaign = doc.data();
      const campaignId = doc.id;

      const card = document.createElement("div");
      card.className = "campaign-card";

      card.innerHTML = `
        <h3>${campaign.title || "Untitled Track"}</h3>
        <p><strong>Artist:</strong> ${campaign.artist || "Unknown"}</p>
        <p><strong>Genre:</strong> ${campaign.genre || "Unknown"}</p>
        <p><strong>Credits:</strong> ${campaign.credits || 0}</p>
        <a href="repost-action.html?campaignId=${campaignId}" class="button">🎵 Repost This Track</a>
      `;

      campaignsContainer.appendChild(card);
    });
  } catch (error) {
    console.error("Error loading campaigns:", error);
    campaignsContainer.innerHTML = "<p>Failed to load campaigns.</p>";
  }
}

// ✅ Auto-load campaigns when page loads
document.addEventListener("DOMContentLoaded", loadCampaigns);


