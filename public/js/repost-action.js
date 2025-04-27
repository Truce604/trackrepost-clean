// After Firebase init and auth-state code…
const functions = firebase.app().functions("us-central1"); // or your region

submitBtn.onclick = async () => {
  const liked = likeEl.checked;
  const comment = commentToggle.checked ? commentBox.value.trim() : null;

  try {
    const { data } = await functions
      .httpsCallable("processRepost")({ campaignId, liked, comment });

    // data.earned holds how many credits the user earned
    messageEl.textContent = `🎉 You earned ${data.earned} credits!`;
    actionsEl.style.display = "none";
    console.log("✅ Repost complete:", data);
  } catch (err) {
    console.error("❌ Repost failed:", err);
    alert(err.message);
  }
};




