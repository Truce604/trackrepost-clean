// ✅ Select DOM Elements
const submitBtn = document.getElementById("submitRepost");
const likeEl = document.getElementById("likeTrack");
const commentToggle = document.getElementById("commentBoxToggle");
const commentBox = document.getElementById("commentText");
const messageEl = document.getElementById("message");
const actionsEl = document.getElementById("repostActions");
const radioLoading = document.getElementById("radioLoading"); // 🎛️ Dial div
const radioSound = document.getElementById("radioSound"); // 🎶 Static sound

// ✅ Initialize Firebase Functions
const functions = firebase.app().functions("us-central1");

// ✅ Handle submit click
submitBtn.onclick = async () => {
  const liked = likeEl.checked;
  const comment = commentToggle.checked ? commentBox.value.trim() : null;

  // 🔥 Show radio dial + play static sound
  radioLoading.style.display = "block";
  radioSound.currentTime = 0; // Reset to start
  radioSound.play(); // Start static sound
  messageEl.textContent = ""; // Clear message

  try {
    const { data } = await functions
      .httpsCallable("processRepost")({ campaignId, liked, comment });

    messageEl.textContent = `🎉 You earned ${data.earned} credits!`;
    actionsEl.style.display = "none";
    console.log("✅ Repost complete:", data);
  } catch (err) {
    console.error("❌ Repost failed:", err);
    alert(err.message);
  } finally {
    // 🔥 Hide radio dial + stop sound
    radioLoading.style.display = "none";
    radioSound.pause(); // Stop static sound
  }
};

// ✅ Show/Hide comment box if toggle checked
commentToggle.addEventListener("change", () => {
  commentBox.style.display = commentToggle.checked ? "block" : "none";
});
