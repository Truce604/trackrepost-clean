// ✅ Initialize Firebase App
if (!firebase.apps.length) {
  firebase.initializeApp(window.firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

const params = new URLSearchParams(window.location.search);
const campaignId = params.get("id");

let currentUser = null;
let campaignData = null;
let scWidget = null;

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    document.body.innerHTML = "<p>Please log in to boost.</p>";
    return;
  }

  currentUser = user;

  // Check if user already reposted this campaign
  const repostDoc = await db.collection("reposts").doc(`${user.uid}_${campaignId}`).get();
  if (repostDoc.exists) {
    document.body.innerHTML = "<p>✅ You've already reposted this track.</p>";
    return;
  }

  try {
    const campaignSnap = await db.collection("campaigns").doc(campaignId).get();
    if (!campaignSnap.exists) {
      document.body.innerHTML = "<p>❌ Campaign not found.</p>";
      return;
    }

    campaignData = campaignSnap.data();

    document.body.innerHTML = `
      <div class="card">
        <img src="${campaignData.artworkUrl}" alt="Artwork" style="width:100%;border-radius:12px;margin-bottom:15px;" />
        <h2>${campaignData.title}</h2>
        <p>👤 ${campaignData.artist}</p>
        <p>🎧 ${campaignData.genre} | 💳 ${campaignData.credits} credits</p>

        <iframe id="sc-player" width="100%" height="140" scrolling="no" frameborder="no"
          src="https://w.soundcloud.com/player/?url=${encodeURIComponent(campaignData.trackUrl)}&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&visual=false"></iframe>

        <form id="engagement-form" style="margin-top:20px;text-align:left;">
          <label><input type="checkbox" id="like" checked /> 💖 Like this track (+1 credit)</label><br/>
          <label><input type="checkbox" id="follow" checked /> 👣 Follow the artist (+2 credits)</label><br/>
          <label><input type="checkbox" id="comment" /> 💬 Leave a comment (+2 credits)</label><br/>
          <textarea id="commentText" placeholder="Write a comment..." style="width:100%;border-radius:8px;margin-top:5px;display:none;"></textarea>
        </form>

        <p id="reward-estimate" style="margin-top:10px;color:#aaa;">Estimated reward: -- credits</p>

        <button id="repost-btn" class="confirm-button" disabled>▶️ Play track to enable boost</button>
      </div>
    `;

    const script = document.createElement("script");
    script.src = "https://w.soundcloud.com/player/api.js";
    script.onload = () => {
      const iframe = document.getElementById("sc-player");
      scWidget = SC.Widget(iframe);
      scWidget.bind(SC.Widget.Events.PLAY, () => {
        const btn = document.getElementById("repost-btn");
        btn.disabled = false;
        btn.textContent = "✅ Boost & Earn";
        btn.onclick = confirmRepost;
      });
    };
    document.body.appendChild(script);

    document.addEventListener("change", (e) => {
      if (e.target.id === "comment") {
        document.getElementById("commentText").style.display = e.target.checked ? "block" : "none";
      }
      updateEstimatedReward();
    });

    document.addEventListener("input", (e) => {
      if (e.target.id === "commentText") updateEstimatedReward();
    });

  } catch (err) {
    console.error("Error loading campaign:", err);
    document.body.innerHTML = "<p>⚠️ Error loading campaign info.</p>";
  }
});

async function updateEstimatedReward() {
  const userRef = db.collection("users").doc(currentUser.uid);
  const userSnap = await userRef.get();
  const followers = userSnap.data().soundcloud?.followers || 0;
  let total = Math.floor(followers / 100);

  if (document.getElementById("like").checked) total += 1;
  if (document.getElementById("follow").checked) total += 2;
  if (document.getElementById("comment").checked && document.getElementById("commentText").value.trim()) total += 2;

  document.getElementById("reward-estimate").textContent = `Estimated reward: ${total} credits`;
}

async function confirmRepost() {
  const userId = currentUser.uid;
  const liked = document.getElementById("like").checked;
  const followed = document.getElementById("follow").checked;
  const commented = document.getElementById("comment").checked;
  const commentText = document.getElementById("commentText").value.trim();

  try {
    const res = await fetch("https://us-central1-trackrepost-921f8.cloudfunctions.net/repostAndReward", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
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

      // Record the repost so the campaign disappears
      await db.collection("reposts").doc(`${userId}_${campaignId}`).set({
        userId,
        campaignId,
        trackUrl: campaignData.trackUrl,
        liked,
        followed,
        commented,
        comment: commentText,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        prompted: false
      });

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

