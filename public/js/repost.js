document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("repost-history");

  firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
      container.innerHTML = `<p>⚠️ Please log in to view campaigns.</p>`;
      return;
    }

    const db = firebase.firestore();
    const userId = user.uid;

    try {
      // ✅ Step 1: Get reposted campaign IDs
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

      // ✅ Step 2: Get active campaigns
      const campaignSnapshot = await db.collection("campaigns")
        .where("credits", ">", 0)
        .orderBy("createdAt", "desc")
        .get();

      container.innerHTML = "";
      let foundAny = false;

      campaignSnapshot.forEach(doc => {
        const data = doc.data();
        const id = doc.id;

        // ❌ Skip if user owns the campaign or already reposted
        if (data.userId === userId || repostedCampaignIds.has(id)) return;

        // ✅ Create campaign card
        const card = document.createElement("div");
        card.className = "campaign-card";
        card.innerHTML = `
          <h3>${data.title || "Untitled"}</h3>
          <p><strong>Artist:</strong> ${data.artist || "Unknown"}</p>
          <p><strong>Genre:</strong> ${data.genre || "N/A"}</p>
          <p><strong>Credits:</strong> ${data.credits}</p>
          <p><a href="${data.trackUrl}" target="_blank">🎵 Listen on SoundCloud</a></p>
          <a href="repost-action.html?id=${id}" class="button">🔁 Repost This Track</a>
        `;

        container.appendChild(card);
        foundAny = true;
      });

      if (!foundAny) {
        container.innerHTML = `
          <div class="no-campaigns">
            <p>🎉 You've reposted all available tracks for now!</p>
            <p>🔥 New campaigns are added daily. Check back soon!</p>
          </div>
        `;
      }

    } catch (err) {
      console.error("❌ Error loading repost campaigns:", err);
      container.innerHTML = `<p>❌ Error loading campaigns. Please try again later.</p>`;
    }
  });
});
