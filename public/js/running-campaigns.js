document.addEventListener("DOMContentLoaded", () => {
  const runningContainer = document.getElementById("runningCampaigns");

  firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
      runningContainer.innerHTML = `<p>Please log in to view your running campaigns.</p>`;
      return;
    }

    const db = firebase.firestore();

    try {
      // Fetch all campaigns owned by the current user
      const snapshot = await db.collection("campaigns")
        .where("userId", "==", user.uid)
        .orderBy("createdAt", "desc")
        .get();

      if (snapshot.empty) {
        runningContainer.innerHTML = `<p>You have no active campaigns.</p>`;
        return;
      }

      runningContainer.innerHTML = "";
      snapshot.forEach(async (doc) => {
        const data = doc.data();
        const artwork = data.artworkUrl || "/images/placeholder-artwork.jpg";

        // Check if the campaign has been reposted by the user
        const repostDoc = await db.collection("reposts").doc(`${user.uid}_${doc.id}`).get();
        if (repostDoc.exists) {
          // Skip this campaign from being displayed
          return;
        }

        // Render the campaign card if it hasn't been reposted
        const div = document.createElement("div");
        div.className = "campaign-card";
        div.innerHTML = `
          <img src="${artwork}" alt="Artwork" style="width:100%; height:200px; object-fit:cover; border-radius:8px;">
          <h3>${data.title || "Untitled"}</h3>
          <p>🎧 ${data.artist || "Unknown Artist"}</p>
          <p>🎵 Genre: ${data.genre}</p>
          <p>🔥 Credits Remaining: ${data.credits}</p>
          <a href="repost-action.html?id=${doc.id}" class="button">View Campaign</a>
        `;
        runningContainer.appendChild(div);
      });
    } catch (err) {
      console.error("Error loading running campaigns:", err);
      runningContainer.innerHTML = `<p>❌ Error loading your running campaigns.</p>`;
    }
  });
});

