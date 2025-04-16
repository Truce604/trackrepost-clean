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

  // ✅ Display user credits
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

    const campaignId = `${user.uid}_${Date.now()}`;

    // Temporary placeholders for now — later we'll pull real SoundCloud meta
    const title = "Untitled Track";
    const artworkUrl = "/images/default-art.png";
    const artist = userData.displayName || "Unknown Artist";

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

    // ✅ Deduct user credits
    await userRef.update({
      credits: firebase.firestore.FieldValue.increment(-credits)
    });

    alert("✅ Campaign submitted!");
    window.location.href = "dashboard.html";
  });
});

