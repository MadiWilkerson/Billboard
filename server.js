import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import express from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(express.json({ limit: "1mb" }));

const postsPath = path.join(__dirname, "posts.json");

function readPosts() {
  try {
    const raw = fs.readFileSync(postsPath, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writePosts(posts) {
  fs.writeFileSync(postsPath, JSON.stringify(posts, null, 2) + "\n", "utf8");
}

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/posts", (_req, res) => {
  const posts = readPosts().slice(0, 200);
  res.json({ posts });
});

app.post("/api/posts", (req, res) => {
  const image = typeof req.body?.image === "string" ? req.body.image.trim() : "";
  const emotion = typeof req.body?.emotion === "string" ? req.body.emotion.trim() : "";
  const caption = typeof req.body?.caption === "string" ? req.body.caption.trim() : "";

  if (!image || !emotion || !caption) {
    return res.status(400).json({ error: "image, emotion, and caption are required." });
  }

  if (!/^[a-zA-Z0-9_-]+\.png$/.test(image)) {
    return res.status(400).json({ error: "Invalid image filename." });
  }

  if (caption.length > 280) {
    return res.status(400).json({ error: "Caption must be 280 characters or less." });
  }

  const created_at = Date.now();
  const posts = readPosts();
  const id = (posts[0]?.id ?? 0) + 1;

  const post = { id, image, emotion, caption, created_at };
  posts.unshift(post);
  writePosts(posts.slice(0, 500));

  res.status(201).json({ post });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Billboard running at http://localhost:${PORT}`);
});

