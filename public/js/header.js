// public/js/header.js

// 🔒 Auto-inject header container if missing
if (!document.getElementById("header")) {
  const fallback = document.createElement("div");
  fallback.id = "header";
  document.body.insertBefore(fallback, document.body.firstChild);
}

const headerTarget = document.getElementById("header");
if (headerTarget) {
  headerTarget.innerHTML = `
    <header style="background:#000;padding:10px 20px;border-bottom:1px solid #333;display:flex;justify-content:space-between;align-items:center;">
      <a href="/dashboard.html" style="color:#FFD100;font-weight:bold;font-size:18px;text-decoration:none;">🎵 TRACK REPOST</a>
      <div>
        <button onclick="logout()" style="background:#FFD100;color:#000;padding:6px 12px;border:none;border-radius:6px;cursor:pointer;">Logout</button>
      </div>
    </header>
  `;
}

function logout() {
  firebase.auth().signOut().then(() => {
    window.location.href = "/index.html";
  });
}

