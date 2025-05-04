// /js/repost-action.js

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const campaignId = urlParams.get("campaignId");

  if (!campaignId) {
    document.getElementById("message").textContent = "❌ Missing campaignId in URL. Please access from the Explore page.";
    throw new Error("Missing campaignId in URL.");
  }

  const user = auth.currentUser;
  if (!user) {
    document.getElementById("message").textContent = "⚠️ Please sign in first.";
    return;
  }

  try {
    const doc = await db.collection("campaigns").doc(campaignId).get();
    if (!doc.exists) {
      document.getElementById("message").textContent = "❌ Campaign not found.";
      return;
    }

    const campaign = doc.data();

    if (campaign.owner === user.uid) {
      document.getElementById("message").textContent = "⚠️ You cannot repost your own campaign.";
      return;
    }

    document.getElementById("campaignTitle").textContent = campaign.title || "Untitled Campaign";
    document.getElementById("campaignInfo").innerHTML = `
      <p>🎵 Genre: ${campaign.genre}</p>
      <p>💰 Credits left: ${campaign.credits}</p>
      <iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay"
        src="https://w.soundcloud.com/player/?url=${encodeURIComponent(campaign.trackUrl)}">
      </iframe>
    `;

    document.getElementById("repostActions").style.display = "block";

    // Show/hide comment box
    document.getElementById("commentBoxToggle").addEventListener("change", (e) => {
      document.getElementById("commentText").style.display = e.target.checked ? "block" : "none";
    });

    // Confirm repost button
    document.getElementById("submitRepost").addEventListener("click", async () => {
      const liked = document.getElementById("likeTrack").checked;
      const leaveComment = document.getElementById("commentBoxToggle").checked;
      const commentText = leaveComment ? document.getElementById("commentText").value.trim() : "";

      const payload = {
        userId: user.uid,
        campaignId,
        liked,
        comment: commentText
      };

      try {
        const res = await fetch("https://us-central1-trackrepost-921f8.cloudfunctions.net/processRepost", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.ok && data.success) {
          document.getElementById("message").textContent = "✅ Repost successful! Credits updated.";
          document.getElementById("radioSound").play();
          document.getElementById("radioLoading").style.display = "block";
        } else {
          throw new Error(data.error || "Repost failed.");
        }
      } catch (err) {
        console.error("❌ Repost failed:", err);
        document.getElementById("message").textContent = "❌ Repost failed. Try again.";
      }
    });

  } catch (err) {
    console.error("Error loading campaign:", err);
    document.getElementById("message").textContent = "❌ Failed to load campaign.";
  }
});




