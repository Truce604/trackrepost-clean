// ✅ Ensure Firebase is loaded before running scripts
if (typeof firebase === "undefined") {
  console.error("🚨 Firebase failed to load! Check index.html script imports.");
} else {
  console.log("✅ Firebase Loaded Successfully!");
}

// ✅ Firebase Auth & Firestore Init
const auth = firebase.auth();
const db = firebase.firestore();

// ✅ Auth Listener
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log(`✅ User logged in: ${user.email}`);
    syncDisplayName(user);
    updateDashboard(user);
    loadActiveCampaigns();
  } else {
    console.warn("🚨 No user is logged in.");
    updateDashboard(null);
  }
});

// ✅ Sync Display Name
function syncDisplayName(user) {
  const userRef = db.collection("users").doc(user.uid);
  userRef.get().then((doc) => {
    if (!doc.exists || !doc.data().displayName) {
      userRef.set({
        email: user.email,
        credits: 0,
        reposts: 0,
        displayName: user.displayName || "User"
      }, { merge: true });
      console.log(`✅ Synced display name: ${user.displayName}`);
    }
  }).catch((err) => {
    console.error("❌ Error syncing display name:", err);
  });
}

// ✅ Update Dashboard
function updateDashboard(user) {
  const dash = document.getElementById("userDashboard");
  if (!dash) return;

  if (!user) {
    dash.innerHTML = `<h2>You are not logged in.</h2><p>Please log in or sign up.</p>`;
  } else {
    dash.innerHTML = `<h2>Welcome, ${user.displayName || user.email}!</h2>`;
  }
}

// ✅ Sign Up
function signupUser() {
  const email = document.getElementById("email")?.value;
  const password = document.getElementById("password")?.value;
  const displayName = document.getElementById("displayName")?.value;

  if (!email || !password || !displayName) {
    alert("🚨 Please fill in all signup fields.");
    return;
  }

  auth.createUserWithEmailAndPassword(email, password)
    .then((cred) => {
      const user = cred.user;
      return user.updateProfile({ displayName }).then(() => {
        return db.collection("users").doc(user.uid).set({
          email: user.email,
          credits: 0,
          reposts: 0,
          displayName
        }, { merge: true });
      });
    })
    .then(() => {
      console.log(`✅ Signed up as ${email}`);
    })
    .catch((err) => {
      console.error("❌ Signup Error:", err);
      alert(`Signup Error: ${err.message}`);
    });
}

// ✅ Login
function loginUser() {
  const email = document.getElementById("email")?.value;
  const password = document.getElementById("password")?.value;

  if (!email || !password) {
    alert("🚨 Please enter email and password.");
    return;
  }

  auth.signInWithEmailAndPassword(email, password)
    .then((cred) => {
      const user = cred.user;
      syncDisplayName(user);
    })
    .catch((err) => {
      console.error("❌ Login Error:", err);
      alert(`Login Error: ${err.message}`);
    });
}

// ✅ Logout
function logoutUser() {
  auth.signOut()
    .then(() => {
      console.log("✅ Logged out successfully.");
    })
    .catch((err) => {
      console.error("❌ Logout Error:", err);
    });
}

// ✅ Load Campaigns
function loadActiveCampaigns() {
  const container = document.getElementById("activeCampaigns");
  if (!container) return;

  db.collection("campaigns").get()
    .then((snapshot) => {
      container.innerHTML = "";
      if (snapshot.empty) {
        container.innerHTML = "<p>No active campaigns right now.</p>";
      } else {
        snapshot.forEach((doc) => {
          const data = doc.data();
          const earned = Math.max(1, Math.floor(100 / 100)) + 3;

          container.innerHTML += `
            <div class="campaign">
              <h3>🔥 Now Promoting:</h3>
              <iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay"
                src="https://w.soundcloud.com/player/?url=${encodeURIComponent(data.track)}">
              </iframe>
              <button onclick="redirectToRepostPage('${doc.id}', '${data.track}')">
                Repost & Earn ${earned} Credits
              </button>
            </div>
          `;
        });
      }
    })
    .catch((err) => {
      console.error("❌ Error loading campaigns:", err);
    });
}

// ✅ Redirect to repost page
function redirectToRepostPage(campaignId, trackUrl) {
  window.location.href = `repost.html?campaignId=${campaignId}&trackUrl=${encodeURIComponent(trackUrl)}`;
}

// ✅ Repost track (credits, deduction, etc.)
async function repostTrack(campaignId) {
  const user = auth.currentUser;
  if (!user) {
    alert("🚨 Please login first.");
    return;
  }

  const userRef = db.collection("users").doc(user.uid);
  const campaignRef = db.collection("campaigns").doc(campaignId);

  try {
    const [userSnap, campaignSnap] = await Promise.all([userRef.get(), campaignRef.get()]);

    if (!userSnap.exists || !campaignSnap.exists) {
      alert("❌ Error: Missing user or campaign.");
      return;
    }

    const userData = userSnap.data();
    const campaignData = campaignSnap.data();

    const followerCount = userData.followers || 100;
    let creditsToEarn = Math.max(1, Math.floor(followerCount / 100)) + 3;

    if (campaignData.creditsRemaining < creditsToEarn) {
      alert("⚠️ Not enough credits left.");
      return;
    }

    await db.runTransaction(async (txn) => {
      txn.update(campaignRef, {
        creditsRemaining: campaignData.creditsRemaining - creditsToEarn,
        repostCount: (campaignData.repostCount || 0) + 1
      });

      txn.update(userRef, {
        credits: (userData.credits || 0) + creditsToEarn
      });
    });

    alert(`✅ Repost complete. You earned ${creditsToEarn} credits!`);
  } catch (err) {
    console.error("❌ Repost error:", err);
    alert("Repost failed.");
  }
}

// ✅ Safe attach handlers
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("signupBtn")?.addEventListener("click", signupUser);
  document.getElementById("loginBtn")?.addEventListener("click", loginUser);
  document.getElementById("logoutBtn")?.addEventListener("click", logoutUser);

  loadActiveCampaigns();
});

