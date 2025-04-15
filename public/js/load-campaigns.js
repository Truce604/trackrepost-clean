firebase.auth().onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const userId = user.uid;
  const campaignContainer = document.getElementById("campaigns");
  campaignContainer.innerHTML = "Loading campaigns...";

  try {
    // 🧠 Step 1: Get campaigns the user has already reposted
    const repostSnapshot = await firebase.firestore()
      .collection("reposts")
      .where("userId", "==", userId)
      .get();

    const alreadyReposted = new Set();
    repostSnapshot.forEach((doc) => {
      const data = doc.data();
      alreadyReposted.add(data.campaignId);
    });

    // 📦 Step 2: Get all active campaigns with credits
    const campaignSnapshot = await firebase.firestore()
      .collection("campaigns")
      .where("active", "==", true)
      .orderBy("credits", "desc")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    let campaignsShown = 0;
    campaignContainer.innerHTML = "";

    campaignSnapshot.forEach((doc) => {
      const data = doc.data();
      const campaignId = doc.id;

      if (alreadyReposted.has(campaignId)) {
        return; // 🚫 Skip campaigns this user already reposted
      }

      // Only show if it still has credits
      if (!data.credits || data.credits <= 0) {
        return;
      }

      // ✅ Build card
      const card = document.createElement("div");
      card.className = "campaign-card";

      card.innerHTML = `
        <img src="${data.artworkUrl || '/images/default-art.png'}" alt="Artwork" class="artwork" />
        <div class="campaign-info">
          <h3>${data.artist || 'Unknown Artist'}</h3>
          <p><strong>Track:</strong> ${data.title || 'Untitled'}</p>
          <p><strong>Genre:</strong> ${data.genre || 'N/A'}</p>
          <p><strong>Credits:</strong> ${data.credits}</p>
          <a href="repost-action.html?campaignId=${campaignId}" class="button">🔥 Repost This</a>
        </div>
      `;

      campaignContainer.appendChild(card);
      campaignsShown++;
    });

    if (campaignsShown === 0) {
      campaignContainer.innerHTML = "<p>No campaigns available for you to repost right now.</p>";
    }

  } catch (error) {
    console.error("❌ Error loading campaigns:", error);
    campaignContainer.innerHTML = `<p>Error loading campaigns: ${error.message}</p>`;
  }
});



