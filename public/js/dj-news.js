// Load DJ News from Firestore
document.addEventListener("DOMContentLoaded", loadDJNews);

async function loadDJNews() {
  const db = firebase.firestore();
  const container = document.getElementById("news-container");

  container.innerHTML = "<p style='text-align:center;'>Fetching news...</p>";

  try {
    const snap = await db.collection("dj_news")
      .orderBy("date", "desc")
      .limit(50)
      .get();

    if (snap.empty) {
      container.innerHTML = "<p>No news found.</p>";
      return;
    }

    container.innerHTML = "";

    snap.forEach(doc => {
      const d = doc.data();

      const card = `
        <div class="news-card">
          ${d.image ? `<img src="${d.image}" alt="News Image">` : ""}
          <h2>${d.title}</h2>
          <p>${d.excerpt || ""}</p>
          <a href="${d.url}" target="_blank">Read full article →</a>
          <br><br>
          <span class="source">${d.source} • ${formatDate(d.date)}</span>
        </div>
      `;

      container.innerHTML += card;
    });

  } catch (err) {
    console.error("Error loading news:", err);
    container.innerHTML = "<p>Error loading news. Try again later.</p>";
  }
}

function formatDate(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}
