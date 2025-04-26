document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("notificationsList");

  firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
      container.innerHTML = `<p style="text-align: center;">⚠️ Please sign in to view notifications.</p>`;
      return;
    }

    const db = firebase.firestore();
    const userId = user.uid;

    try {
      const snapshot = await db.collection("notifications")
        .where("userId", "==", userId)
        .orderBy("timestamp", "desc")
        .get();

      container.innerHTML = "";
      if (snapshot.empty) {
        container.innerHTML = `<p style="text-align: center;">🎉 No notifications yet.</p>`;
        return;
      }

      snapshot.forEach(doc => {
        const data = doc.data();
        const notif = document.createElement("div");
        notif.className = "notification";
        notif.innerHTML = `
          <h3>${data.title}</h3>
          <p>${data.message}</p>
          <div class="timestamp">${data.timestamp.toDate().toLocaleString()}</div>
        `;
        container.appendChild(notif);
      });

    } catch (err) {
      console.error("❌ Error loading notifications:", err);
      container.innerHTML = `<p style="text-align: center;">❌ Failed to load notifications.</p>`;
    }
  });
});

