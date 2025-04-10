// ✅ Firebase Auth (for logout)
const auth = firebase.auth();

// ✅ Header HTML
const headerHTML = `
  <header style="background:#121212; padding:10px 20px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #333;">
    <div style="display:flex; align-items:center; gap:12px;">
      <img src="/images/track-repost-logo.png" alt="TrackRepost Logo" style="height:36px;">
      <a href="dashboard.html" style="color:#ffa500; font-weight:bold; font-size:1.1rem; text-decoration:none;">TrackRepost</a>
    </div>
    <nav style="display:flex; gap:15px;">
      <a href="dashboard.html">Dashboard</a>
      <a href="submit-campaign.html">Submit</a>
      <a href="explore.html">Explore</a>
      <a href="repost-action.html">Repost</a>
      <a href="credits.html">Buy Credits</a>
      <a href="profile.html">Profile</a>
      <a href="pro-plan.html">Pro Plans</a>
      <a href="notifications.html">Notifications</a>
      <button id="logout-btn" style="background:#ffa500; color:black; border:none; padding:6px 12px; border-radius:6px; font-weight:bold; cursor:pointer;">Logout</button>
    </nav>
  </header>
`;

// ✅ Inject header into page
document.addEventListener("DOMContentLoaded", () => {
  const headerContainer = document.getElementById("site-header");
  if (headerContainer) {
    headerContainer.innerHTML = headerHTML;

    document.getElementById("logout-btn").addEventListener("click", () => {
      auth.signOut().then(() => {
        window.location.href = "index.html";
      });
    });
  }
});

