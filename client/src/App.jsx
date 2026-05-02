import { useEffect, useState } from "react";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import "./App.css";

export default function App() {
  const API = "http://localhost:5000";

  const [snippets, setSnippets] = useState([]);
  const [search, setSearch] = useState("");
  const [activeSource, setActiveSource] = useState("all");
  const [activeLanguage, setActiveLanguage] = useState("all");
  const [activeType, setActiveType] = useState("all");

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
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const normalizeTags = (tags) =>
    tags
      ? tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

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
      }),
    }).then(() => {
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
  // UPDATE
  // =====================
  const updateSnippet = () => {
    fetch(`${API}/snippets/${editingSnippet.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingSnippet),
    }).then(() => {
      setIsEditOpen(false);
      setEditingSnippet(null);
      loadSnippets();
    });
  };

  // =====================
  // FILTERING (STEP 3 FIX)
  // =====================
  const filtered = snippets.filter((s) => {
    const q = search.toLowerCase();

    const matchesSearch =
      s.title?.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q);

    const matchesSource =
      activeSource === "all" || (s.origin || "user") === activeSource;

    const matchesLanguage =
      activeLanguage === "all" || s.language === activeLanguage;

    const matchesType = activeType === "all" || s.type === activeType;

    return matchesSearch && matchesSource && matchesLanguage && matchesType;
  });

  // =====================
  // GROUP AFTER FILTER
  // =====================
  const groupedSnippets = filtered.reduce((acc, s) => {
    const key = s.origin || "user";

    if (!acc[key]) acc[key] = [];
    acc[key].push(s);

    return acc;
  }, {});

  return (
    <div className="app">
      {/* TOPBAR */}
      <div className="topbar">
        <h1>Snippet Manager</h1>

        <div className="topbar-right">
          <button
            onClick={() => fetch(`${API}/vscode/import`).then(loadSnippets)}
          >
            Import VS Code
          </button>

          <button
            onClick={() => fetch(`${API}/vscode/export`, { method: "POST" })}
          >
            Export VS Code
          </button>

          <button onClick={() => setIsCreateOpen(true)}>+ New</button>

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
          {/* SOURCE FILTER */}
          <h3>Source</h3>

          <button
            className={activeSource === "all" ? "active" : ""}
            onClick={() => setActiveSource("all")}
          >
            All
          </button>

          <button
            className={activeSource === "user" ? "active" : ""}
            onClick={() => setActiveSource("user")}
          >
            User
          </button>

          <button
            className={activeSource === "vscode" ? "active" : ""}
            onClick={() => setActiveSource("vscode")}
          >
            VS Code
          </button>

          <button
            className={activeSource === "core-pack" ? "active" : ""}
            onClick={() => setActiveSource("core-pack")}
          >
            Core Packs
          </button>

          {/* LANGUAGE FILTER */}
          <h3>Language</h3>

          <button
            className={activeLanguage === "all" ? "active" : ""}
            onClick={() => setActiveLanguage("all")}
          >
            All
          </button>

          <button
            className={activeLanguage === "javascript" ? "active" : ""}
            onClick={() => setActiveLanguage("javascript")}
          >
            JavaScript
          </button>

          <button
            className={activeLanguage === "html" ? "active" : ""}
            onClick={() => setActiveLanguage("html")}
          >
            HTML
          </button>

          <button
            className={activeLanguage === "css" ? "active" : ""}
            onClick={() => setActiveLanguage("css")}
          >
            CSS
          </button>

          <button
            className={activeLanguage === "python" ? "active" : ""}
            onClick={() => setActiveLanguage("python")}
          >
            Python
          </button>

          {/* TYPE FILTER */}
          <h3>Type</h3>

          <button
            className={activeType === "all" ? "active" : ""}
            onClick={() => setActiveType("all")}
          >
            All
          </button>

          <button
            className={activeType === "snippet" ? "active" : ""}
            onClick={() => setActiveType("snippet")}
          >
            Snippet
          </button>

          <button
            className={activeType === "template" ? "active" : ""}
            onClick={() => setActiveType("template")}
          >
            Template
          </button>
        </div>

        {/* CONTENT */}
        <div className="content">
          {Object.entries(groupedSnippets)
            .sort(([a], [b]) => {
              const order = {
                user: 1,
                vscode: 2,
                "core-pack": 3,
              };
              return order[a] - order[b];
            })
            .filter(([key]) => activeSource === "all" || activeSource === key)
            .map(([group, items]) => (
              <div key={group}>
                {/* GROUP HEADER */}
                <h2 className="groupHeader">
                  {group.toUpperCase()} ({items.length})
                </h2>

                <div className="grid">
                  {items
                    .filter((s) => {
                      const q = search.toLowerCase();
                      return (
                        s.title?.toLowerCase().includes(q) ||
                        s.code?.toLowerCase().includes(q)
                      );
                    })
                    .map((s) => (
                      <div key={s.id} className="card">
                        {/* META */}
                        <div className="meta">
                          <span className="title">
                            {s.title || "Untitled"}
                          </span>

                          <span className="language">
                          {s.language || "unknown"}
                          </span>
                          <span className={`source ${s.origin}`}>
                            {s.origin}
                          </span>

                          {/* pack badge */}
                          {s.pack && (
                            <span className="packBadge">{s.pack}</span>
                          )}

                          {/* tags */}
                          {s.tags?.length > 0 && (
                            <div className="tags">
                              {s.tags.map((tag, i) => (
                                <span key={i} className="tag">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* CODE */}
                        <pre>
                          <code>{s.code}</code>
                        </pre>

                        {/* ACTIONS */}
                        <div className="actions">
                          <button
                            disabled={s.origin === "core-pack"}
                            onClick={() => {
                              if (s.origin === "core-pack") return;
                              setEditingSnippet(s);
                              setIsEditOpen(true);
                            }}
                          >
                            Edit
                          </button>

                          <button
                            disabled={s.origin === "core-pack"}
                            onClick={() => {
                              if (s.origin === "core-pack") return;
                              deleteSnippet(s.id);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
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
            <input
              name="language"
              placeholder="Language"
              onChange={handleChange}
            />
            <input
              name="category"
              placeholder="Category"
              onChange={handleChange}
            />
            <input name="tags" placeholder="Tags" onChange={handleChange} />

            <textarea
              name="description"
              placeholder="Description"
              onChange={handleChange}
            />
            <textarea name="code" placeholder="Code" onChange={handleChange} />

            <button onClick={addSnippet}>Create</button>
            <button onClick={() => setIsCreateOpen(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditOpen && editingSnippet && (
        <div className="modalOverlay">
          <div className="modal">
            <input
              value={editingSnippet.title}
              placeholder="Title"
              onChange={(e) =>
                setEditingSnippet({ ...editingSnippet, title: e.target.value })
              }
            />

            <input
              value={editingSnippet.prefix || ""}
              placeholder="Prefix (VS Code trigger)"
              onChange={(e) =>
                setEditingSnippet({ ...editingSnippet, prefix: e.target.value })
              }
            />

            <input
              value={editingSnippet.language || ""}
              placeholder="Language"
              onChange={(e) =>
                setEditingSnippet({
                  ...editingSnippet,
                  language: e.target.value,
                })
              }
            />

            <input
              value={editingSnippet.category || ""}
              placeholder="Category"
              onChange={(e) =>
                setEditingSnippet({
                  ...editingSnippet,
                  category: e.target.value,
                })
              }
            />

            <textarea
              value={editingSnippet.description || ""}
              placeholder="Description"
              onChange={(e) =>
                setEditingSnippet({
                  ...editingSnippet,
                  description: e.target.value,
                })
              }
            />

            <textarea
              value={editingSnippet.code}
              placeholder="Code"
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
