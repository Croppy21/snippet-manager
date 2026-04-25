import { useEffect, useState } from "react";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import "./App.css";

export default function App() {
  const API = "http://localhost:5000";

  const [snippets, setSnippets] = useState([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSource, setActiveSource] = useState("all");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState(null);

  const [form, setForm] = useState({
    title: "",
    language: "",
    prefix: "",
    type: "snippet",
    category: "",
    description: "",
    tags: "",
    code: "",
  });

  // =====================
  // LOAD
  // =====================
  const loadSnippets = () => {
    fetch(`${API}/snippets`)
      .then((res) => res.json())
      .then(setSnippets);
  };

  useEffect(() => {
    loadSnippets();
  }, []);

  // =====================
  // HIGHLIGHT
  // =====================
  useEffect(() => {
    setTimeout(() => {
      document.querySelectorAll("pre code").forEach((block) => {
        hljs.highlightElement(block);
      });
    }, 0);
  }, [snippets]);

  // =====================
  // FORM
  // =====================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const normalizeTags = (tags) => {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;

    return tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  };

  // =====================
  // CREATE
  // =====================
  const addSnippet = () => {
    fetch(`${API}/snippets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        tags: normalizeTags(form.tags),
        source: "user",
      }),
    }).then(() => {
      setForm({
        title: "",
        language: "",
        prefix: "",
        type: "snippet",
        category: "",
        description: "",
        tags: "",
        code: "",
      });

      setIsCreateOpen(false);
      loadSnippets();
    });
  };

  // =====================
  // DELETE
  // =====================
  const deleteSnippet = (id) => {
    fetch(`${API}/snippets/${id}`, {
      method: "DELETE",
    }).then(loadSnippets);
  };

  // =====================
  // EDIT
  // =====================
  const openEdit = (snippet) => {
    setEditingSnippet({
      ...snippet,
      tags: Array.isArray(snippet.tags)
        ? snippet.tags.join(", ")
        : snippet.tags || "",
    });
    setIsEditOpen(true);
  };

  const updateSnippet = () => {
    fetch(`${API}/snippets/${editingSnippet.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...editingSnippet,
        tags: normalizeTags(editingSnippet.tags),
      }),
    }).then(() => {
      setIsEditOpen(false);
      setEditingSnippet(null);
      loadSnippets();
    });
  };

  // =====================
  // FILTERS
  // =====================
  const categories = [
    "All",
    ...new Set(snippets.map((s) => s.category).filter(Boolean)),
  ];

  const filteredSnippets = snippets.filter((s) => {
    const q = search.toLowerCase();

    return (
      (s.title?.toLowerCase().includes(q) ||
        s.language?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.code?.toLowerCase().includes(q) ||
        (s.tags || []).some((t) =>
          t.toLowerCase().includes(q)
        )) &&
      (activeCategory === "All" ||
        s.category === activeCategory) &&
      (activeSource === "all" ||
        s.source === activeSource)
    );
  });

  return (
    <div className="app">

      {/* TOP BAR */}
      <div className="topbar">
        <h1>Snippet Manager</h1>

        <div className="topbar-right">
          <button onClick={() => fetch(`${API}/vscode/import`).then(loadSnippets)}>
            Import
          </button>

          <button onClick={() => fetch(`${API}/vscode/export`, { method: "POST" })}>
            Export
          </button>

          <input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="layout">

        {/* SIDEBAR */}
        <div className="sidebar">

          <button onClick={() => setIsCreateOpen(true)}>
            + New
          </button>

          <h3>Source</h3>
          <button onClick={() => setActiveSource("all")}>All</button>
          <button onClick={() => setActiveSource("user")}>User</button>
          <button onClick={() => setActiveSource("vscode")}>VS Code</button>

          <h3>Categories</h3>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="content">
          {filteredSnippets.map((s) => (
            <div key={s.id} className="card">

              <div>
                {s.title} • {s.language} • {s.type}
              </div>

              <p>{s.description}</p>

              <pre>
                <code className={`language-${s.language}`}>
                  {s.code}
                </code>
              </pre>

              <div>
                {(Array.isArray(s.tags) ? s.tags : []).map((t, i) => (
                  <span key={i}>#{t}</span>
                ))}
              </div>

              <button onClick={() => openEdit(s)}>Edit</button>
              <button onClick={() => deleteSnippet(s.id)}>Delete</button>

            </div>
          ))}
        </div>

      </div>

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="modalOverlay">
          <div className="modal">

            <input name="title" placeholder="Title" onChange={handleChange} />
            <input name="prefix" placeholder="Prefix" onChange={handleChange} />

            <select name="language" onChange={handleChange}>
              <option value="">Language</option>
              <option value="javascript">JS</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="cpp">C++</option>
              <option value="python">Python</option>
            </select>

            <select name="type" onChange={handleChange}>
              <option value="snippet">Snippet</option>
              <option value="template">Template</option>
            </select>

            <input name="category" placeholder="Category" onChange={handleChange} />
            <input name="tags" placeholder="Tags" onChange={handleChange} />

            <textarea name="description" placeholder="Description" onChange={handleChange} />
            <textarea name="code" placeholder="Code" onChange={handleChange} />

            <button onClick={addSnippet}>Create</button>
            <button onClick={() => setIsCreateOpen(false)}>Cancel</button>

          </div>
        </div>
      )}

      {/* EDIT MODAL (FIXED) */}
      {isEditOpen && editingSnippet && (
        <div className="modalOverlay">
          <div className="modal">

            <input
              value={editingSnippet.title}
              onChange={(e) =>
                setEditingSnippet({ ...editingSnippet, title: e.target.value })
              }
            />

            <input
              value={editingSnippet.prefix}
              onChange={(e) =>
                setEditingSnippet({ ...editingSnippet, prefix: e.target.value })
              }
            />

            <input
              value={editingSnippet.language}
              onChange={(e) =>
                setEditingSnippet({ ...editingSnippet, language: e.target.value })
              }
            />

            <input
              value={editingSnippet.category}
              onChange={(e) =>
                setEditingSnippet({ ...editingSnippet, category: e.target.value })
              }
            />

            <input
              value={editingSnippet.tags}
              onChange={(e) =>
                setEditingSnippet({ ...editingSnippet, tags: e.target.value })
              }
            />

            <textarea
              value={editingSnippet.description}
              onChange={(e) =>
                setEditingSnippet({
                  ...editingSnippet,
                  description: e.target.value,
                })
              }
            />

            <textarea
              value={editingSnippet.code}
              onChange={(e) =>
                setEditingSnippet({ ...editingSnippet, code: e.target.value })
              }
            />

            <button onClick={updateSnippet}>Save</button>
            <button onClick={() => setIsEditOpen(false)}>Cancel</button>

          </div>
        </div>
      )}

    </div>
  );
}