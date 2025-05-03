import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import {
  getFirestore, doc, getDoc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { firebaseConfig } from "./firebaseConfig.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// UI Elements
const submitBtn = document.getElementById("submitRepost");
const likeEl = document.getElementById("likeTrack");
const commentToggle = document.getElementById("commentBoxToggle");
const commentBox = document.getElementById("commentText");
const messageEl = document.getElementById("message");
const actionsEl = document.getElementById("repostActions");
const radioLoading = document.getElementById("radioLoading");
const radioSound = document.getElementById("radioSound");
const campaignTitleEl = document.getElementById("campaignTitle");
const campaignInfoEl = document.getElementById("campaignInfo");

const urlParams = new URLSearchParams(window.location.search);
const campaignId = urlParams.get("campaignId");

if (!campaignId) {
  alert("Missing campaign ID. Redirecting...");
  window.location.href = "explore.html";
  throw new Error("Missing campaignId in URL");
}

let currentUser = null;
let currentCampaign = null;

// Auth check and campaign load
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/index.html";
    return;
  }
  currentUser = user;
  await loadCampaign();
});

async function loadCampaign() {
  try {
    const campaignRef = doc(db, "campaigns", campaignId);
    const campaignSnap = await getDoc(campaignRef);

    if (!campaignSnap.exists()) {
      alert("Campaign not found. Redirecting...");
      window.location.href = "explore.html";
      return;
    }

    currentCampaign = campaignSnap.data();

    campaignTitleEl.textContent = currentCampaign.title || "Untitled Track";
    campaignInfoEl.innerHTML = `
      <p><strong>Artist:</strong> ${currentCampaign.artist || "Unknown"}</p>
      <p><strong>Genre:</strong> ${currentCampaign.genre || "Unknown"}</p>
      <p><strong>Credits:</strong> ${currentCampaign.credits || "0"}</p>
      <a href="${currentCampaign.trackUrl}" target="_blank" class="button">🎵 Listen to Track</a>
    `;

    actionsEl.style.display = "block";
  } catch (error) {
    console.error("❌ Error loading campaign:", error);
    alert("Failed to load campaign. Redirecting...");
    window.location.href = "explore.html";
  }
}

submitBtn.onclick = async () => {
  const liked = likeEl.checked;
  const comment = commentToggle.checked ? commentBox.value.trim() : "";
  const commentBonus = comment.length >= 5 ? 2 : 0;
  const likeBonus = liked ? 1 : 0;
  const earnedCredits = 10 + likeBonus + commentBonus;

  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";
  radioLoading.style.display = "block";
  radioSound.currentTime = 0;
  radioSound.play();
  messageEl.textContent = "";

  try {
    const response = await fetch("https://us-central1-trackrepost-921f8.cloudfunctions.net/processRepost", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: currentUser.uid,
        campaignId,
        earnedCredits,
        liked,
        comment
      })
    });

    const result = await response.json();

    if (result.success) {
      messageEl.textContent = `🎉 You earned ${earnedCredits} credits!`;
      actionsEl.style.display = "none";
      setTimeout(() => window.location.href = "/dashboard.html", 2500);
    } else {
      throw new Error(result.error || "Unknown error");
    }
  } catch (err) {
    console.error("❌ Repost failed:", err);
    alert("Failed to submit repost. Try again.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Repost This Track";
    radioLoading.style.display = "none";
    radioSound.pause();
  }
};

commentToggle.addEventListener("change", () => {
  commentBox.style.display = commentToggle.checked ? "block" : "none";
});

