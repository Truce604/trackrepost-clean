// public/js/explore-campaigns.js

// ✅ Firebase Firestore Init (if not already done)
const db = firebase.firestore();
const auth = firebase.auth();

const campaignList = document.getElementById("campaignList");

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    campaignList.innerHTML = "<p>Please sign in to view campaigns.</p>";
    return;
  }

  try {
    const snapshot = await db.collection("campaigns")
      .where("credits", ">", 0)
      .orderBy("credits", "desc")
      .get();

    campaignList.innerHTML = "";

    if (snapshot.empty) {
      campaignList.innerHTML = "<p>No campaigns available.</p>";
      return;
    }

    snapshot.forEach(doc => {
      const data = doc.data();
      const campaignId = doc.id;
      const {
        artist = "Unknown Artist",
        title = "Untitled Track",
        trackUrl,
        genre = "Unknown Genre",
        credits = 0,
        artworkUrl = "/images/placeholder.png"
      } = data;

      const card = document.createElement("div");
      card.className = "campaign-card";
      card.innerHTML = `
        <div class="soundcloud-embed">
          <iframe width="100%" height="120" scrolling="no" frameborder="no" allow="autoplay"
            src="https://w.soundcloud.com/player/?url=${encodeURIComponent(trackUrl)}&color=%23ff9900"></iframe>
        </div>
        <div class="campaign-details">
          <h3>${title}</h3>
          <p>🎤 ${artist}</p>
          <p>🎵 ${genre}</p>
          <p>💰 ${credits} Credits</p>
          <a href="repost-action.html?campaignId=${campaignId}" class="repost-btn">Repost This</a>
        </div>
      `;

      campaignList.appendChild(card);
    });
  } catch (err) {
    console.error("❌ Error loading campaigns:", err);
    campaignList.innerHTML = "<p>Error loading campaigns.</p>";
  }
});
