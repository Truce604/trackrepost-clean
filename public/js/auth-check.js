// ✅ auth-check.js (Firebase v8 compat)

document.addEventListener("DOMContentLoaded", () => {
  const loginUI = document.getElementById("login-ui");

  firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
      if (loginUI) loginUI.style.display = "none";
      console.log("✅ User is logged in:", user.email);
    } else {
      if (loginUI) loginUI.style.display = "block";
      console.warn("⛔ User not logged in. Redirecting to login.");
      // Optional redirect or show login button
    }
  });
});

