const express = require("express");
const fs = require("fs");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const DATA_PATH = path.join(__dirname, "snippets.json");

const readData = () => JSON.parse(fs.readFileSync(DATA_PATH));
const writeData = (data) =>
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));

// =====================
// GET ALL
// =====================
app.get("/snippets", (req, res) => {
  const data = readData();

  // ensure backwards compatibility
  const safeData = data.map((s) => ({
    source: "user",
    ...s,
    source: s.source || "user"
  }));

  res.json(safeData);
});

// =====================
// CREATE
// =====================
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

    // 🔥 IMPORTANT: default source
    source: req.body.source || "user"
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
          ...req.body,
          source: s.source || "user"
        }
      : s
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});