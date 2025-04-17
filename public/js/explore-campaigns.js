// ✅ Explore Campaigns Script

firebase.auth().onAuthStateChanged(async (user) => {
  const campaignList = document.getElementById("campaignList");
  const db = firebase.firestore();

  if (!user) {
    campaignList.innerHTML = "<p>Please sign in to explore campaigns.</p>";
    return;
  }

  try {
    // Get campaign IDs user already reposted
    const repostsSnap = await db.collection("reposts")
      .where("userId", "==", user.uid)
      .get();

    const repostedIds = repostsSnap.docs.map(doc => doc.data().campaignId);

    // Fetch active campaigns
    const snap = await db.collection("campaigns")
      .where("active", "==", true)
      .orderBy("createdAt", "desc")
      .get();

    campaignList.innerHTML = "";

    snap.forEach((doc) => {
      const data = doc.data();
      const campaignId = doc.id;

      if (repostedIds.includes(campaignId)) return;

      const el = document.createElement("div");
      el.className = "campaign-card";
      el.innerHTML = `
        <img src="${data.artworkUrl || "/images/default-art.png"}" alt="Artwork" />
        <div class="campaign-details">
          <h3>${data.title || "Untitled Track"} <span style="font-weight: normal;">by</span> ${data.artist || "Unknown"}</h3>
          <p><strong>Genre:</strong> ${data.genre}</p>
          <p><strong>Credits:</strong> ${data.credits}</p>
          <div class="action-bar">
            <label>
              <input type="checkbox" checked data-like="${campaignId}"> Like this track (1 credit)
            </label>
            <input type="text" placeholder="Optional comment for 2 credits" data-comment="${campaignId}" />
            <button class="repost-btn" onclick="location.href='repost-action.html?id=${campaignId}'">✅ Repost This Track</button>
          </div>
        </div>
      `;
      campaignList.appendChild(el);
    });

    if (!campaignList.hasChildNodes()) {
      campaignList.innerHTML = "<p>🎉 You’ve reposted all available tracks for now!</p>";
    }
  } catch (err) {
    console.error("Error loading campaigns:", err);
    campaignList.innerHTML = "<p>❌ Error loading campaigns. Please try again later.</p>";
  }
});

