const IMAGES = [
  { file: "CricketFestive.png", emotion: "Festive" },
  { file: "CricketHappy.png", emotion: "Happy" },
  { file: "CricketHungry.png", emotion: "Hungry" },
  { file: "CricketMean.png", emotion: "Mean" },
  { file: "CricketNervous.png", emotion: "Nervous" },
  { file: "CricketPlayful.png", emotion: "Playful" },
  { file: "CricketSilly.png", emotion: "Silly" },
  { file: "CricketStudious.png", emotion: "Studious" },
  { file: "CricketTeamSpirit.png", emotion: "Team Spirit" }
];

const $ = (sel) => document.querySelector(sel);

const gridEl = $("#grid");
const selectedEl = $("#selected");
const captionEl = $("#caption");
const postButton = $("#postButton");
const refreshButton = $("#refreshButton");
const feedEl = $("#feed");
const statusEl = $("#status");
const charCountEl = $("#charCount");

let selected = null;
let loading = false;

function setStatus(text) {
  statusEl.textContent = text;
}

function setLoading(nextLoading) {
  loading = nextLoading;
  postButton.disabled = loading || !selected || captionEl.value.trim().length === 0;
  refreshButton.disabled = loading;
}

function renderSelected() {
  if (!selected) {
    selectedEl.innerHTML = `<div class="selected__placeholder">Select an image to start.</div>`;
    return;
  }

  selectedEl.innerHTML = `
    <div class="selectedCard">
      <img src="/images/${selected.file}" alt="${selected.emotion}" />
      <div class="selectedCard__meta">
        <div class="selectedCard__emotion">${selected.emotion}</div>
        <div class="selectedCard__file">${selected.file}</div>
      </div>
    </div>
  `;
}

function renderGrid() {
  gridEl.innerHTML = "";

  for (const img of IMAGES) {
    const btn = document.createElement("button");
    btn.className = "tile";
    btn.type = "button";
    btn.setAttribute("aria-pressed", selected?.file === img.file ? "true" : "false");
    btn.innerHTML = `
      <img class="tile__img" src="/images/${img.file}" alt="${img.emotion}" />
      <div class="tile__label">
        <div class="emotion">${img.emotion}</div>
        <div class="filename">${img.file.replace("Cricket", "")}</div>
      </div>
    `;
    btn.addEventListener("click", () => {
      selected = img;
      renderSelected();
      renderGrid();
      setLoading(false);
    });
    gridEl.appendChild(btn);
  }
}

function formatTime(ms) {
  const d = new Date(ms);
  return d.toLocaleString([], { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderFeed(posts) {
  if (!posts.length) {
    feedEl.innerHTML = `<div class="selected__placeholder">No posts yet. Be the first.</div>`;
    return;
  }

  feedEl.innerHTML = posts
    .map((p) => {
      return `
        <article class="post">
          <div class="post__row">
            <img class="post__img" src="/images/${escapeHtml(p.image)}" alt="${escapeHtml(p.emotion)}" />
            <div class="post__meta">
              <div class="post__emotion">
                <strong>${escapeHtml(p.emotion)}</strong>
                <span class="post__time">${formatTime(p.created_at)}</span>
              </div>
              <div class="post__caption">${escapeHtml(p.caption)}</div>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

async function fetchPosts() {
  setLoading(true);
  setStatus("Refreshing feed…");
  try {
    const res = await fetch("/api/posts");
    if (!res.ok) throw new Error(`Failed to fetch (${res.status})`);
    const data = await res.json();
    renderFeed(data.posts ?? []);
    setStatus("Ready");
  } catch (err) {
    feedEl.innerHTML = `<div class="error">Couldn’t load the shared space. ${escapeHtml(
      err?.message ?? String(err)
    )}</div>`;
    setStatus("Error");
  } finally {
    setLoading(false);
  }
}

async function createPost() {
  const caption = captionEl.value.trim();
  if (!selected || !caption) return;

  setLoading(true);
  setStatus("Posting…");

  try {
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: selected.file, emotion: selected.emotion, caption })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error ?? `Post failed (${res.status})`);

    captionEl.value = "";
    updateCharCount();
    await fetchPosts();
    setStatus("Posted");
  } catch (err) {
    setStatus("Error");
    feedEl.insertAdjacentHTML(
      "afterbegin",
      `<div class="error">Couldn’t post. ${escapeHtml(err?.message ?? String(err))}</div>`
    );
  } finally {
    setLoading(false);
  }
}

function updateCharCount() {
  charCountEl.textContent = `${captionEl.value.length} / 280`;
  postButton.disabled = loading || !selected || captionEl.value.trim().length === 0;
}

captionEl.addEventListener("input", updateCharCount);
postButton.addEventListener("click", createPost);
refreshButton.addEventListener("click", fetchPosts);

renderGrid();
renderSelected();
updateCharCount();
await fetchPosts();

