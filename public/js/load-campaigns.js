// /js/load-campaigns.js
firebase.auth().onAuthStateChanged(async (user) => {
  if (!user) return;

  const campaignContainer = document.getElementById("campaigns");
  campaignContainer.innerHTML = "Loading campaigns...";

  try {
    const querySnapshot = await firebase.firestore()
      .collection("campaigns")
      .where("active", "==", true)
      .orderBy("credits", "desc") // Primary sort
      .orderBy("createdAt", "desc") // Secondary sort (needs index)
      .limit(50)
      .get();

    if (querySnapshot.empty) {
      campaignContainer.innerHTML = "<p>No campaigns available.</p>";
      return;
    }

    campaignContainer.innerHTML = "";

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const card = document.createElement("div");
      card.className = "campaign-card";

      card.innerHTML = `
        <img src="${data.artwork || '/images/default-art.png'}" alt="Track Art" class="artwork" />
        <div class="campaign-info">
          <h3>${data.artist || 'Unknown Artist'}</h3>
          <p><strong>Track:</strong> ${data.title || 'Untitled'}</p>
          <p><strong>Genre:</strong> ${data.genre || 'N/A'}</p>
          <p><strong>Credits:</strong> ${data.credits}</p>
          <a href="repost-action.html?campaignId=${doc.id}" class="button">🔥 Repost This</a>
        </div>
      `;

      campaignContainer.appendChild(card);
    });

  } catch (error) {
    console.error("Error loading campaigns:", error);
    campaignContainer.innerHTML = `<p>Error loading campaigns: ${error.message}</p>`;
  }
});


