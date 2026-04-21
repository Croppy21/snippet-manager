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

app.get("/", (req, res) => {
  res.send("API running");
});

app.get("/snippets", (req, res) => {
  res.json(readData());
});

app.post("/snippets", (req, res) => {
  const data = readData();

  let tags = req.body.tags;

  // ensure tags ALWAYS becomes array
  if (typeof tags === "string") {
    tags = tags.split(",").map((t) => t.trim());
  }

  const newSnippet = {
    id: Date.now(),
    ...req.body,
    tags: tags || []
  };

  data.push(newSnippet);
  writeData(data);

  res.json(newSnippet);
});

app.put("/snippets/:id", (req, res) => {
  let data = readData();
  const id = Number(req.params.id);

  let tags = req.body.tags;

  if (typeof tags === "string") {
    tags = tags.split(",").map((t) => t.trim());
  }

  data = data.map((s) =>
    s.id === id
      ? {
          ...s,
          ...req.body,
          tags: tags || []
        }
      : s
  );

  writeData(data);
  res.json({ ok: true });
});

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