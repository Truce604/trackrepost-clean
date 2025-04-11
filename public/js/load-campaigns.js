import { db, auth } from "./firebase-init.js";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

const campaignContainer = document.getElementById("campaigns");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    campaignContainer.innerHTML = `<p>Please log in to view your campaigns.</p>`;
    return;
  }

  try {
    const q = query(
      collection(db, "campaigns"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      campaignContainer.innerHTML = `<p>You haven't submitted any campaigns yet.</p>`;
      return;
    }

    campaignContainer.innerHTML = "";

    snapshot.forEach(async (doc) => {
      const data = doc.data();
      const card = document.createElement("div");
      card.className = "campaign-card";
      card.innerHTML = `
        <h3>${data.genre}</h3>
        <p><a href="${data.soundcloudUrl}" target="_blank">SoundCloud Track</a></p>
        <p>Credits: ${data.credits}</p>
        <p class="timestamp">${data.createdAt?.toDate().toLocaleString() || "N/A"}</p>
      `;

      // Check if the campaign has been reposted by the user
      const repostDoc = await db.collection("reposts").doc(`${user.uid}_${doc.id}`).get();
      if (repostDoc.exists) {
        // Skip this campaign from being displayed
        return;
      }

      campaignContainer.appendChild(card);
    });

  } catch (err) {
    console.error("Error loading campaigns:", err);
    campaignContainer.innerHTML = `<p>❌ Error loading your campaigns.</p>`;
  }
});

