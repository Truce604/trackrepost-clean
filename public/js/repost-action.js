// public/js/repost-action.js

firebase.auth().onAuthStateChanged(async (user) => {
  if (!user) {
    alert("Please log in to continue.");
    window.location.href = "/index.html";
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const campaignId = urlParams.get("id");

  if (!campaignId) {
    document.body.innerHTML = "<p>❌ No campaign ID provided.</p>";
    return;
  }

  const db = firebase.firestore();
  const container = document.querySelector(".container");

  try {
    const doc = await db.collection("campaigns").doc(campaignId).get();
    if (!doc.exists) {
      container.innerHTML = "<p>❌ Campaign not found.</p>";
      return;
    }

    const data = doc.data();

    container.innerHTML = `
      <h1>${data.title || "Untitled Track"}</h1>
      <p><strong>Artist:</strong> ${data.artist}</p>
      <p><strong>Genre:</strong> ${data.genre}</p>
      <iframe
        scrolling="no"
        frameborder="no"
        allow="autoplay"
        src="https://w.soundcloud.com/player/?url=${encodeURIComponent(
          data.trackUrl
        )}&color=%23ff5500&auto_play=false&show_user=true"
      ></iframe>

      <label>
        <input type="checkbox" id="likeCheckbox" checked />
        ❤️ Like this track (earn +1 credit)
      </label>
      <br />
      <label>
        💬 Leave a comment for +2 credits:
        <input type="text" id="commentInput" placeholder="Great track!" />
      </label>
      <br />
      <button id="repostBtn">✅ Confirm Repost</button>
    `;

    document
      .getElementById("repostBtn")
      .addEventListener("click", async () => {
        const likeChecked = document.getElementById("likeCheckbox").checked;
        const commentText = document.getElementById("commentInput").value;

        let earnedCredits = Math.floor(
          (user.followers || 0) / 100
        ); // fallback: 0
        if (likeChecked) earnedCredits += 1;
        if (commentText.trim()) earnedCredits += 2;

        try {
          await db.collection("reposts").doc(`${user.uid}_${campaignId}`).set({
            userId: user.uid,
            campaignId,
            trackUrl: data.trackUrl,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            prompted: false,
            liked: likeChecked,
            comment: commentText,
          });

          await db.collection("users").doc(user.uid).update({
            credits: firebase.firestore.FieldValue.increment(earnedCredits),
          });

          await db.collection("users").doc(data.userId).update({
            credits: firebase.firestore.FieldValue.increment(-earnedCredits),
          });

          alert(`✅ Repost complete! You earned ${earnedCredits} credits.`);
          window.location.href = "/dashboard.html";
        } catch (err) {
          console.error("🔥 Repost failed:", err);
          alert("Something went wrong. Try again.");
        }
      });
  } catch (err) {
    console.error("❌ Error loading campaign:", err);
    container.innerHTML = "<p>❌ Error loading campaign. Check console.</p>";
  }
});



