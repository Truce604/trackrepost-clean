// /public/js/header.js
document.addEventListener("DOMContentLoaded", () => {
  const header = document.getElementById("site-header");
  if (!header) return;

  const user = firebase.auth().currentUser;
  const navLinks = `
    <header style="background:#111;padding:10px 20px;border-bottom:1px solid #333;display:flex;justify-content:space-between;align-items:center;">
      <a href="index.html" style="color:#ffa500;font-weight:bold;font-size:1.2rem;text-decoration:none;">
        🎵 TrackRepost
      </a>
      <nav>
        <a href="dashboard.html">Dashboard</a>
        <a href="submit-campaign.html">Submit</a>
        <a href="explore.html">Explore</a>
        <a href="repost.html">Repost</a>
        <a href="credits.html">Buy Credits</a>
        <a href="profile.html">Profile</a>
        <a href="notifications.html">Notifications</a>
        <a href="pro-plan.html">Pro Plans</a>
        <button id="logout-btn" style="margin-left:15px;padding:6px 12px;border:none;border-radius:6px;background:#ffa500;color:#000;font-weight:bold;cursor:pointer;">
          Logout
        </button>
      </nav>
    </header>
  `;

  header.innerHTML = navLinks;

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      firebase.auth().signOut().then(() => {
        window.location.href = "index.html";
      });
    });
  }
});


