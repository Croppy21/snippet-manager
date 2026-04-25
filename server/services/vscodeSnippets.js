import fs from "fs";
import path from "path";

const SNIPPETS_DIR = path.join(process.env.APPDATA, "Code", "User", "snippets");

// Ensure folder exists
export function ensureSnippetsDir() {
  if (!fs.existsSync(SNIPPETS_DIR)) {
    fs.mkdirSync(SNIPPETS_DIR, { recursive: true });
  }
}

// Detect language
function getLanguageFromFile(file) {
  if (file.endsWith(".code-snippets")) return "global";
  return file.replace(".json", "");
}

// Normalize snippet
function normalizeSnippet(name, snippet, language) {
  return {
    name,
    prefix: Array.isArray(snippet.prefix)
      ? snippet.prefix.join(", ")
      : snippet.prefix || "",
    body: Array.isArray(snippet.body)
      ? snippet.body.join("\n")
      : snippet.body || "",
    description: snippet.description || "",
    language,
    source: "vscode",
  };
}

// 🔽 IMPORT FROM VSCODE
export function importFromVSCode() {
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

      // IMPORTANT: skip file-level metadata, only extract entries
      for (const [name, snip] of Object.entries(raw)) {
        // Skip invalid structures (extra safety)
        if (!snip || !snip.body) continue;

        snippets.push({
          id: Date.now() + Math.random(),
          title: name, // "For Loop"
          language,
          category: "vscode",
          description: snip.description || "",
          tags: [],

          // flatten body properly
          code: Array.isArray(snip.body) ? snip.body.join("\n") : snip.body,

          source: "vscode",
        });
      }
    } catch (err) {
      console.log("Skipping invalid snippet file:", file);
    }
  }

  return snippets;
}

// 🔼 EXPORT TO VSCODE
export function exportToVSCode(allSnippets) {
  ensureSnippetsDir();

  const grouped = {};

  for (const s of allSnippets) {
    const lang = s.language || "global";

    if (!grouped[lang]) grouped[lang] = {};

    const key = s.prefix || s.title.toLowerCase().replace(/\s+/g, "");

    grouped[lang][s.title] = {
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