// ✅ Initialize Firebase (already loaded in HTML via compat SDK)
const db = firebase.firestore();
const auth = firebase.auth();

const params = new URLSearchParams(window.location.search);
const campaignId = params.get("id");
const container = document.getElementById("repost-container");

let currentUser = null;
let campaignData = null;
let scWidget = null;

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    container.innerHTML = `<p>🔒 Please log in to boost this track.</p>`;
    return;
  }

  currentUser = user;

  // ✅ Prevent reposting same campaign
  const repostDoc = await db.collection("reposts").doc(`${user.uid}_${campaignId}`).get();
  if (repostDoc.exists) {
    container.innerHTML = `<p>✅ You've already reposted this track.</p>`;
    return;
  }

  try {
    const campaignSnap = await db.collection("campaigns").doc(campaignId).get();
    if (!campaignSnap.exists) {
      container.innerHTML = `<p>❌ Campaign not found or removed.</p>`;
      return;
    }

    campaignData = campaignSnap.data();

    container.innerHTML = `
      <div class="card">
        <img src="${campaignData.artworkUrl}" alt="Artwork" />
        <h2>${campaignData.title}</h2>
        <p>👤 ${campaignData.artist}</p>
        <p>🎧 ${campaignData.genre} | 💳 ${campaignData.credits} credits</p>

        <iframe id="sc-player" width="100%" height="140" scrolling="no" frameborder="no"
          src="https://w.soundcloud.com/player/?url=${encodeURIComponent(campaignData.trackUrl)}&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&visual=false">
        </iframe>

        <form id="engagement-form">
          <label><input type="checkbox" id="like" checked /> 💖 Like this track (+1 credit)</label><br/>
          <label><input type="checkbox" id="follow" checked /> 👣 Follow the artist (+2 credits)</label><br/>
          <label><input type="checkbox" id="comment" /> 💬 Leave a comment (+2 credits)</label><br/>
          <textarea id="commentText" placeholder="Write a comment..." style="display:none;"></textarea>
        </form>

        <p id="reward-estimate">Estimated reward: -- credits</p>
        <button id="repost-btn" class="confirm-button" disabled>▶️ Play track to enable repost</button>
      </div>
    `;

    const iframe = document.getElementById("sc-player");
    scWidget = SC.Widget(iframe);
    scWidget.bind(SC.Widget.Events.PLAY, () => {
      const btn = document.getElementById("repost-btn");
      btn.disabled = false;
      btn.textContent = "✅ Boost & Earn";
      btn.onclick = confirmRepost;
    });

    document.getElementById("comment").addEventListener("change", () => {
      document.getElementById("commentText").style.display = document.getElementById("comment").checked ? "block" : "none";
      updateEstimatedReward();
    });

    document.getElementById("commentText").addEventListener("input", updateEstimatedReward);
    document.getElementById("like").addEventListener("change", updateEstimatedReward);
    document.getElementById("follow").addEventListener("change", updateEstimatedReward);

  } catch (err) {
    console.error("❌ Error loading campaign:", err);
    container.innerHTML = `<p>❌ Error loading campaign info.</p>`;
  }
});

async function updateEstimatedReward() {
  const userSnap = await db.collection("users").doc(currentUser.uid).get();
  const followers = userSnap.data().soundcloud?.followers || 0;
  let total = Math.floor(followers / 100);

  if (document.getElementById("like").checked) total += 1;
  if (document.getElementById("follow").checked) total += 2;
  if (document.getElementById("comment").checked && document.getElementById("commentText").value.trim()) total += 2;

  document.getElementById("reward-estimate").textContent = `Estimated reward: ${total} credits`;
}

async function confirmRepost() {
  const liked = document.getElementById("like").checked;
  const followed = document.getElementById("follow").checked;
  const commented = document.getElementById("comment").checked;
  const commentText = document.getElementById("commentText").value.trim();

  try {
    const res = await fetch("https://us-central1-trackrepost-921f8.cloudfunctions.net/repostAndReward", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: currentUser.uid,
        campaignId,
        liked,
        followed,
        commented,
        commentText
      })
    });

    if (res.ok) {
      const data = await res.json();
      alert(`✅ Boost complete! You earned ${data.earnedCredits} credits.`);
      window.location.href = "dashboard.html";
    } else {
      const error = await res.text();
      alert(`❌ Boost failed: ${error}`);
    }
  } catch (err) {
    console.error("🔥 Boost error:", err);
    alert("❌ Something went wrong during your boost.");
  }
}

