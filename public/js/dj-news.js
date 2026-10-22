// DJ News Feed Widget

const feeds = [
  "https://djmag.com/rss.xml",
  "https://mixmag.net/rss",
  "https://www.edmidentity.com/feed/",
  "https://www.dancingastronaut.com/feed/"
];

async function loadNews() {
  const container = document.getElementById("news-container");

  if (!container) {
    console.error("DJ News: #news-container not found");
    return;
  }

  container.innerHTML = "<p>Loading DJ news...</p>";

  let newsHTML = "";

  for (const feed of feeds) {
    try {
      const response = await fetch(
        `https://api.allorigins.win/get?url=${encodeURIComponent(feed)}`
      );

      const data = await response.json();

      const parser = new DOMParser();
      const xml = parser.parseFromString(
        data.contents,
        "text/xml"
      );

      const items = xml.querySelectorAll("item, entry");

      items.forEach((item) => {
        const title =
          item.querySelector("title")?.textContent ||
          "Untitled Article";

        const link =
          item.querySelector("link")?.textContent ||
          item.querySelector("link")?.getAttribute("href") ||
          "#";

        const description =
          item.querySelector("description")?.textContent ||
          item.querySelector("summary")?.textContent ||
          "";

        newsHTML += `
          <div class="news-card">
            <h3>
              <a href="${link}" target="_blank" rel="noopener noreferrer">
                ${title}
              </a>
            </h3>
            <p>${description.substring(0, 180)}...</p>
          </div>
        `;
      });
    } catch (error) {
      console.error("Feed failed:", feed, error);
    }
  }

  if (newsHTML === "") {
    container.innerHTML =
      "<p>Unable to load DJ news right now.</p>";
  } else {
    container.innerHTML = newsHTML;
  }
}

document.addEventListener("DOMContentLoaded", loadNews);
