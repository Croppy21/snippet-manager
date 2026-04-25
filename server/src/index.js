const express = require("express");
const fs = require("fs");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const DATA_PATH = path.join(__dirname, "snippets.json");

// =====================
// VSCODE PATH
// =====================
const SNIPPETS_DIR = path.join(
  process.env.APPDATA,
  "Code",
  "User",
  "snippets"
);

// =====================
// HELPERS
// =====================
function ensureSnippetsDir() {
  if (!fs.existsSync(SNIPPETS_DIR)) {
    fs.mkdirSync(SNIPPETS_DIR, { recursive: true });
  }
}

function normalizeTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;

  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeLanguage(lang) {
  if (!lang) return "global";

  const map = {
    javascript: "javascript",
    js: "javascript",
    html: "html",
    css: "css",
    cpp: "cpp",
    "c++": "cpp",
    python: "python",
    java: "java",
    typescript: "typescript",
    global: "global",
  };

  return map[lang.toLowerCase()] || lang.toLowerCase();
}

function makeKey(s) {
  return `${normalizeLanguage(s.language)}::${s.prefix}`;
}

function readData() {
  return JSON.parse(fs.readFileSync(DATA_PATH));
}

function writeData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

// =====================
// IMPORT FROM VSCODE
// =====================
function importFromVSCode() {
  ensureSnippetsDir();

  const files = fs
    .readdirSync(SNIPPETS_DIR)
    .filter((f) => f.endsWith(".json") || f.endsWith(".code-snippets"));

  let snippets = [];

  for (const file of files) {
    const filePath = path.join(SNIPPETS_DIR, file);

    const language = file.endsWith(".code-snippets")
      ? "global"
      : file.replace(".json", "");

    try {
      const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));

      for (const [name, snip] of Object.entries(raw)) {
        if (!snip?.body) continue;

        snippets.push({
          id: Date.now() + Math.random(),
          title: name,
          language: normalizeLanguage(language),
          category: "vscode",
          description: snip.description || "",
          tags: [],
          type: "snippet",
          code: Array.isArray(snip.body)
            ? snip.body.join("\n")
            : snip.body,
          prefix: snip.prefix || name.toLowerCase().replace(/\s+/g, ""),
          source: "vscode",
        });
      }
    } catch (err) {
      console.log("Skipping bad file:", file);
    }
  }

  return snippets;
}

// =====================
// EXPORT TO VSCODE
// =====================
function exportToVSCode(allSnippets) {
  ensureSnippetsDir();

  const grouped = {};

  for (const s of allSnippets) {
    const lang = normalizeLanguage(s.language);

    if (!grouped[lang]) grouped[lang] = {};

    const key = (s.prefix || s.title)
      .toLowerCase()
      .replace(/\s+/g, "");

    if (grouped[lang][key]) continue;

    grouped[lang][key] = {
      prefix: key,
      body: Array.isArray(s.code)
        ? s.code
        : String(s.code).split("\n"),
      description: s.description || "",
    };
  }

  for (const [lang, data] of Object.entries(grouped)) {
    const fileName =
      lang === "global"
        ? "global.code-snippets"
        : `${lang}.json`;

    const filePath = path.join(SNIPPETS_DIR, fileName);

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
}

// =====================
// API
// =====================

// GET ALL
app.get("/snippets", (req, res) => {
  const data = readData();

  res.json(
    data.map((s) => ({
      ...s,
      language: normalizeLanguage(s.language),
      tags: normalizeTags(s.tags),
      source: s.source || "user",
    }))
  );
});

// CREATE
app.post("/snippets", (req, res) => {
  const data = readData();

  const newSnippet = {
    id: Date.now(),
    title: req.body.title,
    language: normalizeLanguage(req.body.language),
    category: req.body.category,
    description: req.body.description,
    tags: normalizeTags(req.body.tags),
    type: req.body.type || "snippet",
    code: req.body.code,
    prefix:
      req.body.prefix ||
      req.body.title.toLowerCase().replace(/\s+/g, ""),
    source: "user",
  };

  data.push(newSnippet);
  writeData(data);

  res.json(newSnippet);
});

// UPDATE (FIXED — does NOT overwrite source)
app.put("/snippets/:id", (req, res) => {
  let data = readData();
  const id = Number(req.params.id);

  data = data.map((s) =>
    s.id === id
      ? {
          ...s,
          title: req.body.title,
          language: normalizeLanguage(req.body.language),
          prefix: req.body.prefix,
          category: req.body.category,
          description: req.body.description,
          tags: normalizeTags(req.body.tags),
          type: req.body.type || s.type || "snippet",
          code: req.body.code,
          source: s.source || "user",
        }
      : s
  );

  writeData(data);
  res.json({ ok: true });
});

// DELETE
app.delete("/snippets/:id", (req, res) => {
  let data = readData();
  const id = Number(req.params.id);

  data = data.filter((s) => s.id !== id);

  writeData(data);
  res.json({ ok: true });
});

// =====================
// VS CODE IMPORT (DEDUP)
// =====================
app.get("/vscode/import", (req, res) => {
  const vscodeSnippets = importFromVSCode();
  const current = readData();

  const map = new Map();

  for (const s of current) {
    map.set(makeKey(s), s);
  }

  for (const s of vscodeSnippets) {
    const key = makeKey(s);
    if (!map.has(key)) {
      map.set(key, s);
    }
  }

  const merged = Array.from(map.values());
  writeData(merged);

  res.json(vscodeSnippets);
});

// =====================
// VS CODE EXPORT (FIXED — NO SOURCE MUTATION)
// =====================
app.post("/vscode/export", (req, res) => {
  const allSnippets = readData();

  exportToVSCode(allSnippets);

  res.json({ success: true });
});

// =====================
// START
// =====================
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});