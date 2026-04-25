import express from "express";
import {
  importFromVSCode,
  exportToVSCode
} from "../services/vscodeSnippets.js";

const router = express.Router();

// Import into app
router.get("/import", (req, res) => {
  const snippets = importFromVSCode();
  res.json(snippets);
});

// Export from app → VS Code
router.post("/export", (req, res) => {
  const { snippets } = req.body;

  exportToVSCode(snippets);

  res.json({ success: true });
});

export default router;