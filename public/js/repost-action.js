firebase.auth().onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const campaignId = params.get("campaignId");

  const campaignRef = firebase.firestore().collection("campaigns").doc(campaignId);
  const repostRef = firebase.firestore().collection("reposts").doc(`${user.uid}_${campaignId}`);

  const campaignContainer = document.getElementById("campaignDetails");
  const actionForm = document.getElementById("actionForm");

  try {
    // Check if user already reposted this campaign
    const repostDoc = await repostRef.get();
    if (repostDoc.exists) {
      campaignContainer.innerHTML = "<p>⚠️ You've already reposted this campaign.</p>";
      return;
    }

    // Load campaign details
    const doc = await campaignRef.get();
    if (!doc.exists) {
      campaignContainer.innerHTML = "<p>Campaign not found.</p>";
      return;
    }

    const data = doc.data();

    // Display campaign info
    campaignContainer.innerHTML = `
      <img src="${data.artworkUrl}" class="artwork" />
      <div class="campaign-info">
        <h3>${data.title}</h3>
        <p><strong>Artist:</strong> ${data.artist}</p>
        <p><strong>Genre:</strong> ${data.genre}</p>
        <p><strong>Track:</strong> <a href="${data.trackUrl}" target="_blank">${data.trackUrl}</a></p>
        <p><strong>Available Credits:</strong> ${data.credits}</p>
      </div>
    `;

    actionForm.style.display = "block";

    // Handle repost form
    const form = document.getElementById("repostForm");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const like = document.getElementById("likeCheckbox").checked;
      const follow = document.getElementById("followCheckbox").checked;
      const comment = document.getElementById("commentBox").value.trim();

      let earned = 1; // base for repost
      if (like) earned += 1;
      if (follow) earned += 2;
      if (comment.length > 0) earned += 2;

      // Prevent repost if campaign doesn't have enough credits
      if (data.credits < earned) {
        alert("🚫 Campaign doesn't have enough credits to reward you right now.");
        return;
      }

      // Write repost log
      await repostRef.set({
        userId: user.uid,
        campaignId,
        trackUrl: data.trackUrl,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        like,
        follow,
        comment
      });

      // Update credits
      const userRef = firebase.firestore().collection("users").doc(user.uid);
      const ownerRef = firebase.firestore().collection("users").doc(data.userId);

      const batch = firebase.firestore().batch();
      batch.update(userRef, {
        credits: firebase.firestore.FieldValue.increment(earned)
      });
      batch.update(ownerRef, {
        credits: firebase.firestore.FieldValue.increment(-earned)
      });
      batch.update(campaignRef, {
        credits: firebase.firestore.FieldValue.increment(-earned)
      });

      // Add transaction logs
      const txRef = firebase.firestore().collection("transactions").doc();
      batch.set(txRef, {
        userId: user.uid,
        type: "earn",
        credits: earned,
        campaignId,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });

      batch.commit().then(() => {
        alert(`✅ Repost confirmed! You earned ${earned} credits.`);
        window.location.href = "explore.html";
      });
    });

  } catch (error) {
    console.error("❌ Error loading campaign:", error);
    campaignContainer.innerHTML = "<p>Error loading campaign.</p>";
  }
});


