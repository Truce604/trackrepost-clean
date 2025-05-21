import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getFirestore, doc, getDoc, updateDoc, setDoc, collection, addDoc, query, where, getDocs, Timestamp,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

function getCurrent12HourWindow() {
  const now = new Date();
  const localHour = now.getHours();
  const resetHour = localHour < 12 ? 0 : 12;
  const resetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), resetHour, 0, 0);
  return Timestamp.fromDate(resetDate);
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Please log in to repost.");
    window.location.href = "/index.html";
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const campaignId = urlParams.get("campaignId");
  if (!campaignId) {
    alert("Missing campaign ID.");
    return;
  }

  const campaignRef = doc(db, "campaigns", campaignId);
  const campaignSnap = await getDoc(campaignRef);
  if (!campaignSnap.exists()) {
    alert("Campaign not found.");
    return;
  }

  const campaignData = campaignSnap.data();
  const userId = user.uid;
  const now = Timestamp.now();
  const windowStart = getCurrent12HourWindow();

  // Prevent reposting same campaign twice
  const repostsRef = collection(db, "reposts");
  const duplicateQuery = query(
    repostsRef,
    where("userId", "==", userId),
    where("campaignId", "==", campaignId)
  );
  const duplicateSnap = await getDocs(duplicateQuery);
  if (!duplicateSnap.empty) {
    alert("You’ve already reposted this track.");
    return;
  }

  // Check 12-hour repost limit
  const limitQuery = query(
    repostsRef,
    where("userId", "==", userId),
    where("timestamp", ">=", windowStart),
    where("prompted", "==", false)
  );
  const repostsSnap = await getDocs(limitQuery);
  if (repostsSnap.size >= 10) {
    alert("You've hit your 12-hour repost limit.");
    return;
  }

  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.data();
  const followers = userData?.soundcloud?.followers || 0;

  const creditsEarned = Math.floor(followers / 100);
  const likeChecked = document.getElementById("likeCheckbox")?.checked;
  const commentChecked = document.getElementById("commentCheckbox")?.checked;
  const totalEarned = creditsEarned + (likeChecked ? 1 : 0) + (commentChecked ? 2 : 0);

  // Check campaign has enough credits
  const ownerRef = doc(db, "users", campaignData.userId);
  const ownerSnap = await getDoc(ownerRef);
  const ownerData = ownerSnap.data();
  if (ownerData.credits < totalEarned) {
    alert("Campaign owner does not have enough credits.");
    return;
  }

  // Update credits
  await updateDoc(userRef, {
    credits: (userData.credits || 0) + totalEarned
  });
  await updateDoc(ownerRef, {
    credits: ownerData.credits - totalEarned
  });

  // Log the repost
  await addDoc(repostsRef, {
    userId,
    campaignId,
    trackUrl: campaignData.trackUrl,
    timestamp: now,
    prompted: false,
    earnedCredits: totalEarned
  });

  // Confirmation
  document.getElementById("repostStatus").innerText =
    `✅ Reposted! You earned ${totalEarned} credits.`;
});
