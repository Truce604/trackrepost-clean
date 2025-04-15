firebase.auth().onAuthStateChanged(async (user) => {
  const container = document.getElementById("campaigns");

  if (!user) {
    container.innerHTML = `<p>Please sign in to view campaigns.</p>`;
    return;
  }

  try {
    const db = firebase.firestore();

    // Step 1: Get all campaigns the user already reposted
    const repostsSnapshot = await db.collection("reposts")
      .where("userId", "==", user.uid)
      .get();

    const repostedCampaignIds = new Set();
    repostsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.campaignId) {
        repostedCampaignIds.add(data.campaignId);
      }
    });

    // Step 2: Get all available campaigns, excluding ones already reposted
    const campaignsSnapshot = await db.collection("campaigns")
      .where("credits", ">", 0)
      .orderBy("credits", "desc") // ✅ must order by the inequality field first
      .orderBy("createdAt", "desc")
      .get();

    container.innerHTML = "";

    if (campaignsSnapshot.empty) {
      container.innerHTML = "<p>No campaigns found.</p>";
      return;
    }

    let found = false;

    campaignsSnapshot.forEach(doc => {
      if (repostedCampaignIds.has(doc.id)) return;

      const c = doc.data();
      const id = doc.id;

      const card = document.createElement("div");
      card.className = "campaign-card";
      card.innerHTML = `
        <h3>${c.title || "Untitled Track"} <span style="font-weight: normal;">by</span> ${c.artist || "Unknown"}</h3>
        <p><strong>Genre:</strong> ${c.genre}</p>
        <p><strong>Credits:</strong> ${c.credits}</p>
        <a href="repost-action.html?id=${id}" class="button">🔁 Repost This Track</a>
      `;
      container.appendChild(card);
      found = true;
    });

    if (!found) {
      container.innerHTML = "<p>🎉 You’ve reposted all available tracks for now!</p>";
    }

  } catch (err) {
    console.error("Error loading campaigns:", err);
    document.getElementById("campaigns").innerHTML = `<p>❌ Error loading campaigns.</p>`;
  }
});

