document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("repost-history");

  firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
      container.innerHTML = `<p>⚠️ Please log in to view campaigns.</p>`;
      return;
    }

    try {
      const db = firebase.firestore();
      const q = db.collection("campaigns")
        .where("credits", ">", 0)
        .orderBy("createdAt", "desc");

      const snapshot = await q.get();

      container.innerHTML = "";

      let found = false;

      snapshot.forEach(doc => {
        const data = doc.data();

        if (data.userId === user.uid) return; // ⛔ Skip user's own campaign

        const card = document.createElement("div");
        card.className = "campaign-card";
        card.innerHTML = `
          <h3>${data.genre}</h3>
          <p><a href="${data.trackUrl}" target="_blank">🎵 Listen</a></p>
          <p>💰 Credits: ${data.credits}</p>
          <a href="repost-action.html?id=${doc.id}" class="button">🔁 Repost This Track</a>
        `;
        container.appendChild(card);
        found = true;

        // Check if the track has already been reposted by the user
        db.collection("reposts").doc(`${user.uid}_${doc.id}`).get()
          .then(repostDoc => {
            if (repostDoc.exists) {
              // Remove the track from UI if already reposted
              container.removeChild(card);
            }
          });
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

