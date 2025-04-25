document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("notifications");
  
    firebase.auth().onAuthStateChanged(async (user) => {
      if (!user) {
        container.innerHTML = `<p>⚠️ Please log in to view notifications.</p>`;
        return;
      }
  
      const db = firebase.firestore();
      const userId = user.uid;
  
      try {
        container.innerHTML = "";
  
        // ✅ Fetch reposts where you reposted someone else's track
        const repostsSnapshot = await db.collection("reposts")
          .where("userId", "==", userId)
          .orderBy("timestamp", "desc")
          .get();
  
        repostsSnapshot.forEach(doc => {
          const data = doc.data();
          const card = document.createElement("div");
          card.className = "notification-card";
  
          card.innerHTML = `
            <p>🎵 You reposted a track!</p>
            <p><strong>Track:</strong> <a href="${data.trackUrl}" target="_blank" style="color: #ff9900;">Listen</a></p>
            <div class="timestamp">${data.timestamp?.toDate().toLocaleString() || 'Unknown time'}</div>
          `;
  
          container.appendChild(card);
        });
  
        // ✅ Fetch reposts where someone reposted your campaigns
        const userCampaignsSnapshot = await db.collection("campaigns")
          .where("userId", "==", userId)
          .get();
  
        const campaignIds = [];
        userCampaignsSnapshot.forEach(doc => {
          campaignIds.push(doc.id);
        });
  
        if (campaignIds.length > 0) {
          const repostsOfYourTracksSnapshot = await db.collection("reposts")
            .where("campaignId", "in", campaignIds)
            .orderBy("timestamp", "desc")
            .get();
  
          repostsOfYourTracksSnapshot.forEach(doc => {
            const data = doc.data();
            const card = document.createElement("div");
            card.className = "notification-card";
  
            card.innerHTML = `
              <p>🚀 Someone reposted your track!</p>
              <p><strong>Track:</strong> <a href="${data.trackUrl}" target="_blank" style="color: #ff9900;">Listen</a></p>
              <div class="timestamp">${data.timestamp?.toDate().toLocaleString() || 'Unknown time'}</div>
            `;
  
            container.appendChild(card);
          });
        }
  
        if (container.innerHTML.trim() === "") {
          container.innerHTML = `<p>🔔 No notifications yet. Start reposting tracks!</p>`;
        }
  
      } catch (err) {
        console.error("❌ Error loading notifications:", err);
        container.innerHTML = `<p>❌ Failed to load notifications. Please try again later.</p>`;
      }
    });
  });
  