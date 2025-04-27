// /js/notifications.js

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("notificationsList");
  const db = firebase.firestore();

  firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
      container.innerHTML = `<p>⚠️ Please sign in to view notifications.</p>`;
      return;
    }

    try {
      // Fetch this user's notifications, newest first
      const snap = await db.collection("notifications")
        .where("userId", "==", user.uid)
        .orderBy("timestamp", "desc")
        .get();

      if (snap.empty) {
        container.innerHTML = `<p>🎉 No notifications yet.</p>`;
        return;
      }

      // Clear and render each notification
      container.innerHTML = "";
      snap.forEach(doc => {
        const n = doc.data();
        // build a human-readable timestamp
        const ts = n.timestamp?.toDate().toLocaleString() || "";
        // choose a message based on your fields
        // for example: someone reposted your campaign
        const message = `
          <div class="notification-card">
            <p><strong>${n.artist}</strong> — <em>${n.title}</em></p>
            <p>Campaign <code>${n.campaignId}</code> now has <strong>${n.remainingCredits}</strong> credits</p>
            <p><small>${ts}</small></p>
          </div>
        `;
        container.insertAdjacentHTML("beforeend", message);
      });

    } catch (e) {
      console.error("❌ Error loading notifications:", e);
      container.innerHTML = `<p>❌ Failed to load notifications.</p>`;
    }
  });
});
