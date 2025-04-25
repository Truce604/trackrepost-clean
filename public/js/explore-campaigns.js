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

        card.innerHTML = `
          <div class="soundcloud-embed">
            <iframe 
              width="100%" 
              height="120" 
              scrolling="no" 
              frameborder="no" 
              allow="autoplay" 
              src="https://w.soundcloud.com/player/?url=${encodeURIComponent(data.trackUrl)}&color=%23ff5500&inverse=false&auto_play=false&show_user=true&show_artwork=true&show_comments=false&visual=false">
            </iframe>
          </div>
          <div class="campaign-details">
            <h3>${data.title || "Untitled"}</h3>
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
