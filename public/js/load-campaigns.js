firebase.auth().onAuthStateChanged(async (user) => {
  const container = document.getElementById("campaigns");

  if (!user) {
    container.innerHTML = "<p>Please log in to view available campaigns.</p>";
    return;
  }

  try {
    const db = firebase.firestore();

    // Get all reposted campaign IDs by this user
    const repostSnapshot = await db
      .collection("reposts")
      .where("userId", "==", user.uid)
      .get();

    const repostedCampaignIds = new Set();
    repostSnapshot.forEach(doc => {
      repostedCampaignIds.add(doc.data().campaignId);
    });

    // Get all campaigns with available credits
    const campaignSnapshot = await db
      .collection("campaigns")
      .where("credits", ">", 0)
      .orderBy("createdAt", "desc")
      .get();

    container.innerHTML = "";

    let foundAny = false;

    campaignSnapshot.forEach(doc => {
      const campaign = doc.data();
      const campaignId = doc.id;

      // Hide own campaigns and reposted ones
      if (campaign.userId === user.uid || repostedCampaignIds.has(campaignId)) return;

      const artwork = campaign.artworkUrl || "/images/placeholder-artwork.jpg";

      const card = document.createElement("div");
      card.className = "campaign-card";
      card.innerHTML = `
        <img src="${artwork}" alt="Artwork" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;">
        <h3>${campaign.title || "Untitled Track"}</h3>
        <p>👤 ${campaign.artist || "Unknown Artist"}</p>
        <p>🎵 Genre: ${campaign.genre}</p>
        <p>💳 Credits: ${campaign.credits}</p>
        <a class="button" href="repost-action.html?id=${campaignId}">🔁 Repost This Track</a>
      `;

      container.appendChild(card);
      foundAny = true;
    });

    if (!foundAny) {
      container.innerHTML = "<p>No new campaigns available for repost right now.</p>";
    }

  } catch (err) {
    console.error("Error loading campaigns:", err);
    container.innerHTML = "<p>❌ Failed to load campaigns. Please try again later.</p>";
  }
});
