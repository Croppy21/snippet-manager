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

function ensureSnippetsDir() {
  if (!fs.existsSync(SNIPPETS_DIR)) {
    fs.mkdirSync(SNIPPETS_DIR, { recursive: true });
  }
}

// =====================
// LANGUAGE NORMALIZER (🔥 FIX)
// =====================
function normalizeLanguage(lang) {
  if (!lang) return "global";

  const map = {
    javascript: "javascript",
    js: "javascript",

    html: "html",

    css: "css",

    "c++": "cpp",
    cpp: "cpp",

    python: "python",

    java: "java",

    typescript: "typescript",
    ts: "typescript"
  };

  return map[lang.toLowerCase()] || "global";
}

// =====================
// READ / WRITE DB
// =====================
const readData = () => JSON.parse(fs.readFileSync(DATA_PATH));
const writeData = (data) =>
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));

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

        const prefix = Array.isArray(snip.prefix)
          ? snip.prefix[0]
          : snip.prefix || name.toLowerCase().replace(/\s+/g, "");

        snippets.push({
          id: Date.now() + Math.random(),
          title: name,
          language,
          category: "vscode",
          description: snip.description || "",
          tags: [],
          code: Array.isArray(snip.body)
            ? snip.body.join("\n")
            : snip.body,
          prefix,
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
// EXPORT TO VSCODE (🔥 FIXED)
// =====================
function exportToVSCode(allSnippets) {
  ensureSnippetsDir();

  const grouped = {};

  for (const s of allSnippets) {
    const lang = normalizeLanguage(s.language); // ✅ FIX

    if (!grouped[lang]) grouped[lang] = {};

    const key = (s.prefix || s.title)
      .toLowerCase()
      .replace(/\s+/g, "");

    // prevent duplicates
    if (grouped[lang][key]) continue;

    grouped[lang][key] = {
      prefix: key,
      body: Array.isArray(s.code)
        ? s.code
        : s.code.split("\n"),
      description: s.description || ""
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
    language: req.body.language,
    category: req.body.category,
    description: req.body.description,
    tags: req.body.tags || [],
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

// UPDATE
app.put("/snippets/:id", (req, res) => {
  let data = readData();
  const id = Number(req.params.id);

  data = data.map((s) =>
    s.id === id ? { ...s, ...req.body } : s
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
// IMPORT FROM VSCODE
// =====================
app.get("/vscode/import", (req, res) => {
  const vscodeSnippets = importFromVSCode();

  const current = readData();

  const filtered = current.filter(
    (s) => s.source !== "vscode"
  );

  const merged = [...filtered, ...vscodeSnippets];

  writeData(merged);

  res.json(vscodeSnippets);
});

// =====================
// EXPORT TO VSCODE
// =====================
app.post("/vscode/export", (req, res) => {
  const allSnippets = readData();

  exportToVSCode(allSnippets);

  res.json({ success: true });
});

// =====================
// START SERVER
// =====================
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});