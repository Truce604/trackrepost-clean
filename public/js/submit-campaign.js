firebase.auth().onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const creditDisplay = document.getElementById("creditBalance");
  const form = document.getElementById("campaignForm");

  const userRef = firebase.firestore().collection("users").doc(user.uid);
  const userSnap = await userRef.get();
  const userData = userSnap.data();

  creditDisplay.textContent = userData.credits;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const trackUrl = document.getElementById("trackUrl").value.trim();
    const genre = document.getElementById("genre").value.trim();
    const credits = parseInt(document.getElementById("credits").value);

    if (!trackUrl || !genre || isNaN(credits)) {
      alert("Please fill in all fields.");
      return;
    }

    if (userData.credits < credits) {
      alert(`Not enough credits. You only have ${userData.credits} credits.`);
      return;
    }

    // 🧠 Fetch metadata from SoundCloud oEmbed
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

    await firebase.firestore().collection("campaigns").doc(campaignId).set({
      userId: user.uid,
      trackUrl,
      genre,
      credits,
      title,
      artworkUrl,
      artist,
      active: true,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    await userRef.update({
      credits: firebase.firestore.FieldValue.increment(-credits)
    });

    alert("✅ Campaign submitted!");
    window.location.href = "dashboard.html";
  });
});
