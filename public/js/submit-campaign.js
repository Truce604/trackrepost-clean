firebase.auth().onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("creditBalance").textContent = "Loading...";

  const userRef = firebase.firestore().collection("users").doc(user.uid);
  const userDoc = await userRef.get();
  const userData = userDoc.data();

  document.getElementById("creditBalance").textContent = `${userData.credits} credits`;

  const form = document.getElementById("campaignForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const trackUrl = document.getElementById("trackUrl").value;
    const genre = document.getElementById("genre").value;
    const credits = parseInt(document.getElementById("credits").value);

    if (userData.credits < credits) {
      alert("Not enough credits.");
      return;
    }

    const title = "Blaster by Lowsealoc Records";
    const artworkUrl = "https://i1.sndcdn.com/artworks-bu0M9Og5ViAZIQmP-O1G0Zw-t500x500.jpg";
    const artist = "skrapbeats";

    const campaignId = `${user.uid}_${Date.now()}`;

    await firebase.firestore().collection("campaigns").doc(campaignId).set({
      trackUrl,
      genre,
      credits,
      title,
      artworkUrl,
      artist,
      userId: user.uid,
      active: true,
      createdAt: firebase.firestore.FieldValue.serverTimestamp() // ✅ Correct type
    });

    // Deduct user credits
    await userRef.update({
      credits: firebase.firestore.FieldValue.increment(-credits)
    });

    alert("Campaign submitted!");
    window.location.href = "dashboard.html";
  });
});
