// ✅ Firebase compat SDK (loaded in HTML) is already globally available
const auth = firebase.auth();
const db = firebase.firestore();

const form = document.getElementById("campaign-form");
const statusBox = document.getElementById("status");
const creditDisplay = document.getElementById("current-credits");
const genreInput = document.getElementById("genre");
const creditsInput = document.getElementById("credits");

// ✅ Extract Artist from URL (Fallback)
function extractArtistFromUrl(url) {
  try {
    const path = new URL(url).pathname;
    const parts = path.split('/');
    return parts[1] || "Unknown Artist";
  } catch (e) {
    return "Unknown Artist";
  }
}

// ✅ Auto Genre Detection
async function autoDetectGenre(url) {
  const genres = ["Drum & Bass", "Hip-hop", "Trap", "Techno", "House", "Mash-up", "Pop", "Electronic"];
  const lower = url.toLowerCase();
  return genres.find(g => lower.includes(g.toLowerCase())) || "Pop";
}

// ✅ SoundCloud Metadata Scraper
async function fetchSoundCloudMetadata(url) {
  try {
    const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
    const html = await res.text();

    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
    const artistMatch1 = html.match(/<meta name="twitter:audio:artist_name" content="([^"]+)"/);
    const artistMatch2 = html.match(/<meta property="soundcloud:creator" content="([^"]+)"/);
    const artistMatch3 = html.match(/<meta name="twitter:title" content="([^"]+)"/);
    const artworkMatch = html.match(/<meta property="og:image" content="([^"]+)"/);

    const title = titleMatch?.[1] || "Untitled";
    const artist =
      artistMatch1?.[1] ||
      artistMatch2?.[1] ||
      (artistMatch3?.[1]?.includes(" by ") ? artistMatch3[1].split(" by ")[1] : null) ||
      extractArtistFromUrl(url);
    const artworkUrl = artworkMatch?.[1] || "";

    return { title, artist, artworkUrl };
  } catch (err) {
    console.error("❌ Failed to fetch SoundCloud metadata", err);
    return {
      title: "Untitled",
      artist: extractArtistFromUrl(url),
      artworkUrl: ""
    };
  }
}

// ✅ Auth + Credit + Campaign Flow
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    form.style.display = "none";
    statusBox.textContent = "Please log in to submit a campaign.";
    return;
  }

  const userRef = db.collection("users").doc(user.uid);
  const userSnap = await userRef.get();
  const userData = userSnap.exists ? userSnap.data() : {};
  const currentCredits = userData.credits || 0;
  const isPro = userData.isPro || false;

  creditDisplay.textContent = `You currently have ${currentCredits} credits.`;

  const existingCampaigns = await db.collection("campaigns")
    .where("userId", "==", user.uid)
    .get();

  if (!isPro && existingCampaigns.size >= 1) {
    form.style.display = "none";
    statusBox.innerHTML = `⚠️ Free users can only run 1 campaign. <a href="pro-plan.html">Upgrade to Pro</a> to run more.`;
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    statusBox.textContent = "⏳ Submitting your campaign...";

    const trackUrl = form.trackUrl.value.trim();
    const genre = genreInput.value.trim() || await autoDetectGenre(trackUrl);
    const credits = parseInt(creditsInput.value.trim(), 10);

    if (!trackUrl || isNaN(credits) || credits <= 0) {
      statusBox.textContent = "❌ Please enter a valid track URL and credit amount.";
      return;
    }

    if (currentCredits < credits) {
      statusBox.textContent = "❌ You don't have enough credits.";
      return;
    }

    const meta = await fetchSoundCloudMetadata(trackUrl);
    console.log("🎧 Track Meta:", meta);

    const campaignId = `${user.uid}_${Date.now()}`;
    const campaignRef = db.collection("campaigns").doc(campaignId);

    try {
      // Step 1: Create campaign
      await campaignRef.set({
        userId: user.uid,
        trackUrl,
        genre,
        credits,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        title: meta.title,
        artist: meta.artist,
        artworkUrl: meta.artworkUrl
      });
      console.log("✅ Step 1: Campaign added");

      // Step 2: Deduct credits
      await userRef.update({
        credits: firebase.firestore.FieldValue.increment(-credits)
      });
      console.log("✅ Step 2: Credits updated");

      // Step 3: Log transaction
      await db.collection("transactions").add({
        userId: user.uid,
        type: "spent",
        amount: credits,
        reason: `Submitted: ${meta.title}`,
        timestamp: firebase.firestore.Timestamp.now()
      });
      console.log("✅ Step 3: Transaction logged");

      statusBox.textContent = "✅ Campaign submitted successfully!";
      form.reset();
      genreInput.value = "";
    } catch (err) {
      console.error("❌ Firestore submission failed:", err);
      statusBox.textContent = "❌ Error submitting campaign.";
    }
  });
});
