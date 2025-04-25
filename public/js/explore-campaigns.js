document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("campaignList");

  firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
      container.innerHTML = `<p>⚠️ Please log in to explore campaigns.</p>`;
      return;
    }

    const db = firebase.firestore();
    const userId = user.uid;

    try {
      // ✅ Step 1: Get all reposts by user
      const repostsSnapshot = await db.collection("reposts")
        .where("userId", "==", userId)
        .get();

      const repostedCampaignIds = new Set();
      repostsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.campaignId) {
          repostedCampaignIds.add(data.campaignId);
        }
      });

      // ✅ Step 2: Get active campaigns with credits > 0
      const campaignSnapshot = await db.collection("campaigns")
        .where("credits", ">", 0)
        .orderBy("credits", "desc")
        .orderBy("createdAt", "desc")
        .get();

      container.innerHTML = "";
      let foundAny = false;

      campaignSnapshot.forEach(doc => {
        const data = doc.data();
        const id = doc.id;

        // ❌ Skip own campaigns and already reposted ones
        if (data.userId === userId || repostedCampaignIds.has(id)) return;

        // ✅ Build card
        const card = document.createElement("div");
        card.className = "campaign-card";

        const artworkUrl = data.artwork || "https://i1.sndcdn.com/artworks-000000000000-000000-t500x500.jpg";

        card.innerHTML = `
          <img src="${artworkUrl}" alt="Artwork">
          <div class="campaign-details">
            <h3>${data.title || "Untitled"}</h3>
            <p><strong>Artist:</strong> ${data.artist || "Unknown"}</p>
            <p><strong>Genre:</strong> ${data.genre || "N/A"}</p>
            <p><strong>Credits:</strong> ${data.credits}</p>
            <a href="repost-action.html?id=${id}" class="repost-btn">🔁 Repost</a>
          </div>
        `;

        container.appendChild(card);
        foundAny = true;
      });

      if (!foundAny) {
        container.innerHTML = `<p>🎉 You've reposted all available tracks! New campaigns coming soon.</p>`;
      }

    } catch (err) {
      console.error("❌ Error loading campaigns:", err);
      container.innerHTML = `<p>❌ Failed to load campaigns. Please try again later.</p>`;
    }
  });
});


