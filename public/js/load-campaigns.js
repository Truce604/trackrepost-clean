document.addEventListener("DOMContentLoaded", () => {
  const campaignContainer = document.getElementById("campaigns");

  firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
      campaignContainer.innerHTML = `<p>Please log in to view your campaigns.</p>`;
      return;
    }

    try {
      const db = firebase.firestore();
      const campaignsRef = db.collection("campaigns").where("userId", "==", user.uid).orderBy("createdAt", "desc");
      const snapshot = await campaignsRef.get();

      if (snapshot.empty) {
        campaignContainer.innerHTML = `<p>You haven't submitted any campaigns yet.</p>`;
        return;
      }

      campaignContainer.innerHTML = "";

      for (const doc of snapshot.docs) {
        const data = doc.data();

        // Skip if user has already reposted this campaign
        const repostId = `${user.uid}_${doc.id}`;
        const repostDoc = await db.collection("reposts").doc(repostId).get();
        if (repostDoc.exists) continue;

        const card = document.createElement("div");
        card.className = "campaign-card";
        card.innerHTML = `
          <h3>${data.genre}</h3>
          <p><a href="${data.trackUrl}" target="_blank">🎵 SoundCloud Track</a></p>
          <p>Credits: ${data.credits}</p>
          <p class="timestamp">${data.createdAt?.toDate().toLocaleString() || "N/A"}</p>
        `;
        campaignContainer.appendChild(card);
      }

    } catch (err) {
      console.error("❌ Error loading campaigns:", err);
      campaignContainer.innerHTML = `<p>❌ Failed to load your campaigns.</p>`;
    }
  });
});
