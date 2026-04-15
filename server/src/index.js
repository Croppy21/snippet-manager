const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// =====================
// FILE PATH (SAFE)
// =====================
const FILE = path.join(__dirname, "snippets.json");

// =====================
// ENSURE FILE EXISTS
// =====================
if (!fs.existsSync(FILE)) {
  fs.writeFileSync(FILE, "[]");
}

// =====================
// HELPERS
// =====================
const readData = () => {
  try {
    const data = fs.readFileSync(FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading file:", err);
    return [];
  }
};

const writeData = (data) => {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
};

// =====================
// ROUTES
// =====================

app.get("/", (req, res) => {
  res.send("Snippet API is running 🚀");
});

// READ all
app.get("/snippets", (req, res) => {
  res.json(readData());
});

// CREATE
app.post("/snippets", (req, res) => {
  const data = readData();

  const newSnippet = {
    id: Date.now(),
    title: req.body.title,
    code: req.body.code,
    language: req.body.language,
  };

  data.push(newSnippet);
  writeData(data);

  res.json(newSnippet);
});

// DELETE
app.delete("/snippets/:id", (req, res) => {
  const id = Number(req.params.id);
  let data = readData();

  data = data.filter((snippet) => snippet.id !== id);

  writeData(data);

  res.json({ success: true });
});

// UPDATE
app.put("/snippets/:id", (req, res) => {
  const id = Number(req.params.id);
  let data = readData();

  data = data.map((snippet) =>
    snippet.id === id
      ? {
          ...snippet,
          title: req.body.title,
          code: req.body.code,
          language: req.body.language,
        }
      : snippet
  );

  writeData(data);

  res.json({ success: true });
});

// =====================
// START SERVER
// =====================
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});