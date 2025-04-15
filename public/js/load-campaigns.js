// Import Firebase modules and initialize app
import { db } from "./firebase-init.js";
import { query, collection, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const campaignContainer = document.getElementById("campaigns");

// Function to load campaigns from Firestore
const loadCampaigns = async () => {
  campaignContainer.innerHTML = "<p>Loading campaigns...</p>";

  try {
    // Query to get campaigns ordered by creation date
    const q = query(collection(db, "campaigns"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    // If no campaigns found, display a message
    if (snapshot.empty) {
      campaignContainer.innerHTML = "<p>No campaigns available yet.</p>";
      return;
    }

    campaignContainer.innerHTML = "";

    // Iterate over each campaign document and display its details
    snapshot.forEach(doc => {
      const data = doc.data();
      const card = document.createElement("div");
      card.className = "campaign-card";
      card.innerHTML = `
        <h3>${data.genre}</h3>
        <p><a href="${data.soundcloudUrl}" target="_blank">SoundCloud Track</a></p>
        <p>Credits: ${data.credits}</p>
        <p class="timestamp">${data.createdAt?.toDate().toLocaleString() || "N/A"}</p>
      `;
      campaignContainer.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading campaigns:", err);
    campaignContainer.innerHTML = "<p>❌ Error loading campaigns.</p>";
  }
};

// Call the function to load campaigns when the page loads
window.addEventListener("DOMContentLoaded", () => {
  loadCampaigns();
});


