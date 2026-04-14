const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());

const FILE = "./src/snippets.json";

// READ all
app.get("/snippets", (req, res) => {
  const data = fs.readFileSync(FILE);
  res.json(JSON.parse(data));
});

// CREATE
app.post("/snippets", (req, res) => {
  const data = JSON.parse(fs.readFileSync(FILE));

  const newSnippet = {
    id: Date.now(),
    title: req.body.title,
    code: req.body.code,
    language: req.body.language
  };

  data.push(newSnippet);

  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));

  res.json(newSnippet);
});

// DELETE
app.delete("/snippets/:id", (req, res) => {
  let data = JSON.parse(fs.readFileSync(FILE));

  const id = Number(req.params.id);

  data = data.filter(snippet => snippet.id !== id);

  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));

  res.json({ success: true });
});

// UPDATE
app.put("/snippets/:id", (req, res) => {
  let data = JSON.parse(fs.readFileSync(FILE));

  const id = Number(req.params.id);

  data = data.map(snippet => {
    if (snippet.id === id) {
      return {
        ...snippet,
        title: req.body.title,
        code: req.body.code,
        language: req.body.language
      };
    }
    return snippet;
  });

  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));

  res.json({ success: true });
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});