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
      // ✅ Step 1: Fetch user's repost history
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

      // ✅ Step 2: Fetch all available campaigns
      const campaignSnapshot = await db.collection("campaigns")
        .where("credits", ">", 0)
        .orderBy("createdAt", "desc")
        .get();

      container.innerHTML = "";
      let foundAny = false;

      campaignSnapshot.forEach(doc => {
        const data = doc.data();
        const id = doc.id;

        // ❌ Skip own campaigns and already reposted ones
        if (data.userId === userId || repostedCampaignIds.has(id)) return;

        const card = document.createElement("div");
        card.className = "campaign-card";
        card.innerHTML = `
          <h3>${data.title || "Untitled"}</h3>
          <p><strong>Artist:</strong> ${data.artist || "Unknown"}</p>
          <p><strong>Genre:</strong> ${data.genre}</p>
          <p><strong>Credits:</strong> ${data.credits}</p>
          <p><a href="${data.trackUrl}" target="_blank">🎵 Listen on SoundCloud</a></p>
          <a href="repost-action.html?id=${id}" class="button">🔁 Repost This Track</a>
        `;

        container.appendChild(card);
        foundAny = true;
      });

      if (!foundAny) {
        container.innerHTML = `<p>🎉 You've reposted all available tracks for now!</p>`;
      }

    } catch (err) {
      console.error("❌ Error loading repost campaigns:", err);
      container.innerHTML = `<p>❌ Error loading campaigns. Please try again later.</p>`;
    }
  });
});
