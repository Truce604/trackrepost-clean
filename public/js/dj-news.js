const feeds = [
  "https://djmag.com/rss.xml",
  "https://mixmag.net/rss",
  "https://www.edmidentity.com/feed/",
  "https://www.dancingastronaut.com/feed/"
];

async function loadNews() {
  const container = document.getElementById("news-container");

  if (!container) {
    console.error("news-container not found");
    return;
  }

  container.innerHTML = "<p>Loading DJ News...</p>";

  let html = "";

  for (const feed of feeds) {
    try {
      const response = await fetch(
        `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed)}`
      );

      const data = await response.json();

      if (!data.items) continue;

      data.items.slice(0, 5).forEach(item => {
        html += `
          <div class="news-card">
            <h3>
              <a href="${item.link}" target="_blank" rel="noopener noreferrer">
                ${item.title}
              </a>
            </h3>
            <p>${(item.description || "")
              .replace(/<[^>]*>/g, "")
              .substring(0, 180)}...</p>
          </div>
        `;
      });
    } catch (error) {
      console.error("Feed failed:", feed, error);
    }
  }

  container.innerHTML =
    html || "<p>No DJ news available right now.</p>";
}

document.addEventListener("DOMContentLoaded", loadNews);