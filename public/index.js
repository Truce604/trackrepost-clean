// ✅ Ensure Firebase is loaded before running scripts
if (!window.auth || !window.db) {
  console.error("🚨 Firebase is not properly initialized! Check firebaseConfig.js.");
} else {
  console.log("✅ Firebase Loaded Successfully!");
}

const auth = window.auth;
const db = window.db;

// ✅ Auth State Listener
auth.onAuthStateChanged(user => {
  if (user) {
    console.log(`✅ User logged in: ${user.email}`);
    updateDashboard(user);
    document.getElementById("logoutBtn")?.style.display = "inline-block";
  } else {
    console.warn("🚨 No user is logged in.");
    updateDashboard(null);
    document.getElementById("logoutBtn")?.style.display = "none";
  }
});

// ✅ Update Dashboard UI
function updateDashboard(user) {
  const dashboard = document.getElementById("userDashboard");
  if (!dashboard) return;

  if (!user) {
    dashboard.innerHTML = `
      <h2>Not Logged In</h2>
      <p>Please sign in or create an account.</p>
    `;
    return;
  }

  dashboard.innerHTML = `
    <h2>Welcome, ${user.email}</h2>
    <p><strong>Your Credits:</strong> <span id="userCredits">Loading...</span></p>
    <a href="credits.html"><button>💳 Buy Credits</button></a>
  `;

  loadUserCredits(user.uid);
}

// ✅ Load user credits
function loadUserCredits(uid) {
  db.collection("users").doc(uid).get().then(doc => {
    if (doc.exists) {
      const credits = doc.data().credits || 0;
      document.getElementById("userCredits").textContent = credits;
      console.log(`✅ Loaded credits: ${credits}`);
    } else {
      console.warn("⚠️ User document not found.");
    }
  }).catch(err => {
    console.error("❌ Failed to fetch user credits:", err);
  });
}

// ✅ Sign up
function signupUser() {
  const email = document.getElementById("email")?.value;
  const password = document.getElementById("password")?.value;

  auth.createUserWithEmailAndPassword(email, password).then(res => {
    console.log("✅ Signup successful:", res.user.email);
    updateDashboard(res.user);
  }).catch(err => {
    console.error("❌ Signup error:", err);
    alert("Signup Error: " + err.message);
  });
}

// ✅ Login
function loginUser() {
  const email = document.getElementById("email")?.value;
  const password = document.getElementById("password")?.value;

  auth.signInWithEmailAndPassword(email, password).then(res => {
    console.log("✅ Login successful:", res.user.email);
    updateDashboard(res.user);
  }).catch(err => {
    console.error("❌ Login error:", err);
    alert("Login Error: " + err.message);
  });
}

// ✅ Logout
function logoutUser() {
  auth.signOut().then(() => {
    console.log("✅ Logged out");
    updateDashboard(null);
  }).catch(err => {
    console.error("❌ Logout failed:", err);
  });
}

// ✅ Load current campaigns
function loadActiveCampaigns() {
  const campaignsDiv = document.getElementById("activeCampaigns");
  if (!campaignsDiv) return;

  campaignsDiv.innerHTML = "<p>Loading campaigns...</p>";

  db.collection("campaigns")
    .where("active", "==", true)
    .orderBy("createdAt", "desc")
    .limit(3)
    .get()
    .then(snapshot => {
      if (snapshot.empty) {
        campaignsDiv.innerHTML = "<p>No active campaigns found.</p>";
        return;
      }

      campaignsDiv.innerHTML = "";
      snapshot.forEach(doc => {
        const data = doc.data();
        campaignsDiv.innerHTML += `
          <div class="campaign-card">
            <h3>${data.genre} – ${data.artist}</h3>
            <iframe
              width="100%" height="166" scrolling="no" frameborder="no"
              allow="autoplay"
              src="https://w.soundcloud.com/player/?url=${encodeURIComponent(data.trackUrl)}">
            </iframe>
            <a href="repost-action.html?id=${doc.id}">
              <button>Repost + Earn ${data.credits || 1} Credits</button>
            </a>
          </div>
        `;
      });
    })
    .catch(err => {
      console.error("❌ Error loading campaigns:", err);
      campaignsDiv.innerHTML = "<p>Failed to load campaigns.</p>";
    });
}

// ✅ Attach event listeners
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ index.js loaded");

  loadActiveCampaigns();

  document.getElementById("signupBtn")?.addEventListener("click", signupUser);
  document.getElementById("loginBtn")?.addEventListener("click", loginUser);
  document.getElementById("logoutBtn")?.addEventListener("click", logoutUser);
});

