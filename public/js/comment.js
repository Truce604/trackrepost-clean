// ✅ Firebase Initialization (uses compat version)
firebase.initializeApp(window.firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;
let currentCampaign = null;

// ✅ Get campaign ID from query string
const params = new URLSearchParams(window.location.search);
const campaignId = params.get("id");

// ✅ DOM Elements
const trackContainer = document.getElementById("trackContainer");
const commentText = document.getElementById("commentText");
const submitCommentBtn = document.getElementById("submitComment");
const likeBtn = document.getElementById("likeTrack");
const followBtn = document.getElementById("followUser");
const logoutBtn = document.getElementById("logoutBtn");

// ✅ Auth Check
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    alert("Please sign in to leave a comment.");
    window.location.href = "/index.html";
    return;
  }

  currentUser = user;
  logoutBtn.style.display = "inline-block";

  try {
    const campaignSnap = await db.collection("campaigns").doc(campaignId).get();
    if (!campaignSnap.exists) {
      trackContainer.innerHTML = "<p>Campaign not found.</p>";
      return;
    }

    currentCampaign = campaignSnap.data();

    trackContainer.innerHTML = `
      <h3>${currentCampaign.title} by ${currentCampaign.artist}</h3>
      <p><strong>Genre:</strong> ${currentCampaign.genre}</p>
      <p><strong>Credits Remaining:</strong> ${currentCampaign.credits}</p>
      <iframe width="100%" height="166" scrolling="no" frameborder="no"
        src="https://w.soundcloud.com/player/?url=${encodeURIComponent(currentCampaign.trackUrl)}&color=%23ff5500&auto_play=false&show_user=true">
      </iframe>
    `;
  } catch (err) {
    console.error("Error loading campaign:", err);
    trackContainer.innerHTML = "<p>❌ Failed to load campaign.</p>";
  }
});

// ✅ Reward Functions
async function earnCredits(type, value) {
  const userRef = db.collection("users").doc(currentUser.uid);
  const campaignRef = db.collection("campaigns").doc(campaignId);
  const transactionRef = db.collection("transactions").doc();

  let credits = 0;
  let reason = "";

  if (type === "comment") {
    credits = 2;
    reason = "Commented";
  } else if (type === "like") {
    credits = 1;
    reason = "Liked";
  } else if (type === "follow") {
    credits = 2;
    reason = "Followed";
  }

  const batch = db.batch();
  batch.update(userRef, { credits: firebase.firestore.FieldValue.increment(credits) });
  batch.update(campaignRef, { credits: firebase.firestore.FieldValue.increment(-credits) });
  batch.set(transactionRef, {
    userId: currentUser.uid,
    campaignId,
    type: "earned",
    amount: credits,
    reason,
    timestamp: firebase.firestore.Timestamp.now(),
    extra: value || ""
  });

  await batch.commit();
  alert(`✅ ${reason} complete! You earned ${credits} credits.`);
}

// ✅ Event Handlers
submitCommentBtn.addEventListener("click", async () => {
  const text = commentText.value.trim();
  if (!text) return alert("Please type a comment first.");
  await earnCredits("comment", text);
  commentText.value = "";
});

likeBtn.addEventListener("click", async () => {
  await earnCredits("like");
});

followBtn.addEventListener("click", async () => {
  await earnCredits("follow");
});

logoutBtn.addEventListener("click", () => {
  auth.signOut().then(() => {
    window.location.href = "/index.html";
  });
});
