// ✅ submit-campaign.js

let isSubmitting = false;

firebase.auth().onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const creditDisplay = document.getElementById("creditBalance");
  const form = document.getElementById("campaignForm");
  const submitBtn = document.getElementById("submitBtn");

  const userRef = firebase.firestore().collection("users").doc(user.uid);
  const userSnap = await userRef.get();
  const userData = userSnap.data();
  const currentCredits = userData.credits || 0;

  creditDisplay.textContent = currentCredits;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (isSubmitting) return;
    isSubmitting = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    const trackUrl = document.getElementById("trackUrl").value.trim();
    const genre = document.getElementById("genre").value.trim();
    const credits = parseInt(document.getElementById("credits").value);

    if (!trackUrl || !genre || isNaN(credits) || credits <= 0) {
      alert("Please fill in all fields with valid values.");
      resetButton();
      return;
    }

    if (currentCredits < credits) {
      alert(`Not enough credits. You only have ${currentCredits} credits.`);
      resetButton();
      return;
    }

    // 🎧 Try to fetch SoundCloud metadata
    let title = "Untitled Track";
    let artworkUrl = "/images/default-art.png";

    try {
      const oEmbedUrl = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(trackUrl)}`;
      const response = await fetch(oEmbedUrl);
      const data = await response.json();
      if (data.title) title = data.title;
      if (data.thumbnail_url) artworkUrl = data.thumbnail_url;
    } catch (err) {
      console.warn("Could not fetch SoundCloud metadata:", err);
    }

    const artist = userData.displayName || "Unknown Artist";
    const campaignId = `${user.uid}_${Date.now()}`;

    try {
      await firebase.firestore().collection("campaigns").doc(campaignId).set({
        userId: user.uid,
        trackUrl,
        genre,
        credits,
        remainingCredits: credits,
        title,
        artworkUrl,
        artist,
        active: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        reposts: 0
      });

      await userRef.update({
        credits: firebase.firestore.FieldValue.increment(-credits)
      });

      alert("✅ Campaign submitted!");
      window.location.href = "dashboard.html";
    } catch (error) {
      console.error("❌ Error submitting campaign:", error);
      alert("Something went wrong. Please try again.");
      resetButton();
    }
  });

  function resetButton() {
    isSubmitting = false;
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Campaign";
  }
});
