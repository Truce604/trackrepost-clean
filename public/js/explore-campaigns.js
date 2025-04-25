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

        // ✅ Generate SoundCloud artwork thumbnail
        let artworkUrl = "";
        if (data.artwork) {
          artworkUrl = data.artwork;
        } else if (data.trackUrl) {
          const trackIdMatch = data.trackUrl.match(/tracks\/(\d+)/);
          if (trackIdMatch) {
            const trackId = trackIdMatch[1];
            artworkUrl = `https://i1.sndcdn.com/artworks-${trackId}-t500x500.jpg`;
          } else {
            artworkUrl = "https://i1.sndcdn.com/avatars-000000000000-000000-t500x500.jpg"; // generic SC avatar if no match
          }
        } else {
          artworkUrl = "https://i1.sndcdn.com/avatars-000000000000-000000-t500x500.jpg"; // generic backup
        }

        // ✅ Create campaign card
        const card = document.createElement("div");
        card.className = "campaign-card";

        card.innerHTML = `
          <img src="${artworkUrl}" alt="Artwork">
          <div class="campaign-details">
            <h3>${data.title || "Untitled"}</h3>
            <p><strong>Artist:</strong> ${data.artist || "Unknown"}</p>
            <p><strong>Genre:</strong> ${data.genre || "N/A"}</p>
            <p><strong>Credits:</strong> ${data.credits}</p>
            <p><a href="${data.trackUrl}" target="_blank">🎵 Listen on SoundCloud</a></p>
            <div class="action-bar">
              <label><input type="checkbox" checked disabled /> 👍 Like this track (1 credit)</label>
              <label><input type="checkbox" id="commentToggle-${id}" /> 💬 Leave a comment (2 credits)</label>
              <input type="text" id="commentInput-${id}" placeholder="Optional comment..." style="display:none;" />
              <a href="repost-action.html?id=${id}" class="repost-btn">🔁 Repost This Track</a>
            </div>
          </div>
        `;

        // 📝 Toggle comment input visibility
        const commentToggle = card.querySelector(`#commentToggle-${id}`);
        const commentInput = card.querySelector(`#commentInput-${id}`);
        commentToggle.addEventListener("change", () => {
          commentInput.style.display = commentToggle.checked ? "block" : "none";
        });

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


