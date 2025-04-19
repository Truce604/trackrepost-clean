import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// ✅ Firebase config (uses window.firebaseConfig if defined)
const firebaseConfig = window.firebaseConfig || {
  apiKey: "YOUR_API_KEY",
  authDomain: "trackrepost-921f8.firebaseapp.com",
  projectId: "trackrepost-921f8",
  storageBucket: "trackrepost-921f8.appspot.com",
  messagingSenderId: "967836604288",
  appId: "1:967836604288:web:3782d50de7384c9201d365",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ✅ Get DOM elements
const campaignInfo = document.getElementById("campaignInfo");
const repostBtn = document.getElementById("repostBtn");
const repostStatus = document.getElementById("repostStatus");
const likeCheckbox = document.getElementById("likeCheckbox");
const followCheckbox = document.getElementById("followCheckbox");
const commentBox = document.getElementById("commentBox");

// ✅ Extract campaign ID from URL
const urlParams = new URLSearchParams(window.location.search);
const campaignId = urlParams.get("id");

// ✅ Prevent double actions
let isSubmitting = false;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    campaignInfo.innerHTML = "<p>Please sign in to continue.</p>";
    return;
  }

  try {
    const campaignRef = doc(db, "campaigns", campaignId);
    const campaignSnap = await getDoc(campaignRef);

    if (!campaignSnap.exists()) {
      campaignInfo.innerHTML = "<p>Campaign not found.</p>";
      return;
    }

    const campaign = campaignSnap.data();

    // ✅ Prevent self-reposts
    if (campaign.userId === user.uid) {
      campaignInfo.innerHTML = "<p>You can't repost your own campaign.</p>";
      repostBtn.style.display = "none";
      return;
    }

    // ✅ Check if already reposted
    const repostDoc = await getDoc(doc(db, "reposts", `${user.uid}_${campaignId}`));
    if (repostDoc.exists()) {
      campaignInfo.innerHTML = "<p>You've already reposted this track.</p>";
      repostBtn.style.display = "none";
      return;
    }

    // ✅ Show campaign
    campaignInfo.innerHTML = `
      <h3>${campaign.title} by ${campaign.artist}</h3>
      <p><strong>Genre:</strong> ${campaign.genre}</p>
      <p><strong>Credits:</strong> ${campaign.credits}</p>
      <iframe scrolling="no" frameborder="no" allow="autoplay"
        src="https://w.soundcloud.com/player/?url=${encodeURIComponent(campaign.trackUrl)}&color=%23ff5500&auto_play=false&show_user=true">
      </iframe>
    `;

    // ✅ Repost button click
    repostBtn.addEventListener("click", async () => {
      if (isSubmitting) return;
      isSubmitting = true;

      const liked = likeCheckbox.checked;
      const followed = followCheckbox.checked;
      const comment = commentBox.value.trim();

      let earnedCredits = 1; // base credit
      if (liked) earnedCredits += 1;
      if (comment) earnedCredits += 2;

      try {
        await setDoc(doc(db, "reposts", `${user.uid}_${campaignId}`), {
          userId: user.uid,
          campaignId,
          trackUrl: campaign.trackUrl,
          timestamp: serverTimestamp(),
          liked,
          followed,
          comment,
        });

        await updateDoc(doc(db, "users", user.uid), {
          credits: increment(earnedCredits),
        });

        await updateDoc(doc(db, "campaigns", campaignId), {
          credits: increment(-earnedCredits),
        });

        repostStatus.textContent = `✅ Repost complete! You earned ${earnedCredits} credits.`;
        repostBtn.disabled = true;
      } catch (err) {
        console.error("❌ Repost Error:", err);
        repostStatus.textContent = "❌ Error submitting repost.";
      } finally {
        isSubmitting = false;
      }
    });
  } catch (err) {
    console.error("❌ Error loading campaign:", err);
    campaignInfo.innerHTML = "<p>Error loading campaign.</p>";
  }
});


