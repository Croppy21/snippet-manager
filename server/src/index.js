const express = require("express");
const fs = require("fs");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// =====================
// FILE PATHS
// =====================
const DATA_PATH = path.join(__dirname, "snippets.json");
const PACKS_DIR = path.join(__dirname, "..", "packs");

const SNIPPETS_DIR = path.join(
  process.env.APPDATA || "",
  "Code",
  "User",
  "snippets",
);

// =====================
// HELPERS
// =====================
function readData() {
  if (!fs.existsSync(DATA_PATH)) return [];
  return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
}

function writeData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function normalizeLanguage(lang) {
  if (!lang) return "global";

  const map = {
    javascript: "javascript",
    js: "javascript",
    python: "python",
    cpp: "cpp",
    "c++": "cpp",
    html: "html",
    css: "css",
  };

  return map[lang.toLowerCase()] || lang.toLowerCase();
}

// =====================
// CORE PACK LOADER (FIXED)
// =====================
function loadCorePacks() {
  if (!fs.existsSync(PACKS_DIR)) return [];

  const files = fs.readdirSync(PACKS_DIR);

  let snippets = [];

  for (const file of files) {
    const filePath = path.join(PACKS_DIR, file);

    try {
      const pack = JSON.parse(fs.readFileSync(filePath, "utf-8"));

      for (const snip of pack.snippets || []) {
        snippets.push({
          id: Date.now() + Math.random(),
          title: snip.title,

          // ✅ FIX: language is CLEAN
          language: normalizeLanguage(pack.language),

          // ✅ NEW: pack stored separately
          pack: pack.pack,

          category: "core",
          description: snip.description || "",
          tags: ["core-pack"],
          type: "snippet",
          code: snip.code,
          prefix: snip.prefix,

          origin: "core-pack",
          syncTargets: [],
        });
      }
    } catch (e) {
      console.log("Bad pack file:", file);
    }
  }

  return snippets;
}

// =====================
// VS CODE IMPORT (UNCHANGED)
// =====================
function importFromVSCode() {
  if (!fs.existsSync(SNIPPETS_DIR)) return [];

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

          code: Array.isArray(snip.body) ? snip.body.join("\n") : snip.body,

          prefix: snip.prefix || name.toLowerCase().replace(/\s+/g, ""),

          origin: "vscode",
          syncTargets: [],
        });
      }
    } catch (err) {}
  }

  return snippets;
}

// =====================
// API
// =====================

app.get("/snippets", (req, res) => {
  const user = readData();
  const core = loadCorePacks();
  const vscode = importFromVSCode();

  const all = [...core, ...vscode, ...user];

  res.json(all);
});

// =====================
// CREATE USER SNIPPET (FIXED BUG)
// =====================
app.post("/snippets", (req, res) => {
  const data = readData();

  const newSnippet = {
    id: Date.now(),
    title: req.body.title,
    language: normalizeLanguage(req.body.language),
    category: req.body.category,
    description: req.body.description,
    tags: req.body.tags || [],
    type: req.body.type || "snippet",
    code: req.body.code,
    prefix: req.body.prefix,

    origin: "user",
    syncTargets: ["vscode"],
  };

  data.push(newSnippet);
  writeData(data);

  res.json(newSnippet);
});

// =====================
// UPDATE
// =====================
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
          tags: req.body.tags,
          code: req.body.code,
        }
      : s,
  );

  writeData(data);
  res.json({ ok: true });
});

// =====================
// DELETE
// =====================
app.delete("/snippets/:id", (req, res) => {
  let data = readData();
  const id = Number(req.params.id);

  data = data.filter((s) => s.id !== id);

  writeData(data);
  res.json({ ok: true });
});

// =====================
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});