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
      // ✅ Step 1: Get all reposted campaignIds for this user
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

      // ✅ Step 2: Load campaigns
      const campaignSnapshot = await db.collection("campaigns")
        .where("credits", ">", 0)
        .orderBy("createdAt", "desc")
        .get();

      container.innerHTML = "";
      let found = false;

      campaignSnapshot.forEach(doc => {
        const data = doc.data();
        const id = doc.id;

        // ❌ Skip own campaigns or already reposted
        if (data.userId === userId || repostedCampaignIds.has(id)) return;

        const card = document.createElement("div");
        card.className = "campaign-card";
        card.innerHTML = `
          <h3>${data.genre}</h3>
          <p><a href="${data.trackUrl}" target="_blank">🎵 Listen</a></p>
          <p>💰 Credits: ${data.credits}</p>
          <a href="repost-action.html?id=${id}" class="button">🔁 Repost This Track</a>
        `;
        container.appendChild(card);
        found = true;
      });

      if (!found) {
        container.innerHTML = `<p>No campaigns available to repost right now.</p>`;
      }

    } catch (err) {
      console.error("Error loading campaigns:", err);
      container.innerHTML = `<p>❌ Error loading repost campaigns.</p>`;
    }
  });
});


