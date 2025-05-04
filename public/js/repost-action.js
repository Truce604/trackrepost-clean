// ✅ Firebase SDKs assumed loaded via HTML + firebase-init.js
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const campaignId = params.get("campaignId");

  if (!campaignId) {
    document.getElementById("message").textContent =
      "❌ Missing campaignId in URL. Please access from Explore page.";
    throw new Error("Missing campaignId in URL.");
  }

  const user = firebase.auth().currentUser;
  if (!user) {
    document.getElementById("message").textContent = "⚠️ Please sign in.";
    return;
  }

  try {
    // ✅ Load campaign
    const campaignDoc = await firebase.firestore().collection("campaigns").doc(campaignId).get();
    if (!campaignDoc.exists) {
      document.getElementById("message").textContent = "❌ Campaign not found.";
      return;
    }

    const data = campaignDoc.data();

    // ✅ Prevent reposting your own
    if (data.owner === user.uid) {
      document.getElementById("message").textContent =
        "⚠️ You can't repost your own campaign.";
      return;
    }

    // ✅ Show campaign
    document.getElementById("campaignTitle").textContent = data.title || "Untitled Track";
    document.getElementById("campaignInfo").innerHTML = `
      <p><strong>🎵 Artist:</strong> ${data.artist || "Unknown"}</p>
      <p><strong>💰 Credits Left:</strong> ${data.credits || 0}</p>
      <iframe 
        width="100%" 
        height="120" 
        scrolling="no" 
        frameborder="no" 
        allow="autoplay"
        src="https://w.soundcloud.com/player/?url=${encodeURIComponent(data.trackUrl)}">
      </iframe>
    `;

    document.getElementById("repostActions").style.display = "block";

    // ✅ Handle comment toggle
    const commentToggle = document.getElementById("commentBoxToggle");
    const commentText = document.getElementById("commentText");
    commentToggle.addEventListener("change", () => {
      commentText.style.display = commentToggle.checked ? "block" : "none";
    });

    // ✅ Submit repost
    const submitBtn = document.getElementById("submitRepost");
    submitBtn.onclick = async () => {
      const liked = document.getElementById("likeTrack").checked;
      const comment = commentToggle.checked ? commentText.value.trim() : null;

      try {
        // 🎛️ Radio static effect
        document.getElementById("radioLoading").style.display = "block";
        document.getElementById("radioSound").play();

        const res = await fetch("https://us-central1-trackrepost-921f8.cloudfunctions.net/processRepost", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.uid,
            campaignId,
            liked,
            comment,
            earnedCredits: 1 + (liked ? 1 : 0) + (comment ? 2 : 0),
          }),
        });

        const json = await res.json();
        if (json.success) {
          document.getElementById("message").textContent =
            `✅ Repost complete! You earned ${json.earned || "credits"} credits.`;
        } else {
          throw new Error(json.error || "Unknown error");
        }
      } catch (err) {
        console.error("❌ Repost failed:", err);
        document.getElementById("message").textContent = `❌ Repost failed: ${err.message}`;
      } finally {
        document.getElementById("radioLoading").style.display = "none";
      }
    };
  } catch (err) {
    console.error("❌ Error loading repost UI:", err);
    document.getElementById("message").textContent =
      "❌ Failed to load campaign data.";
  }
});





