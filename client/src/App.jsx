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
    category: "",
    description: "",
    tags: "",
    code: ""
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
  // SYNTAX HIGHLIGHT
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

    setForm({
      ...form,
      [name]:
        name === "tags"
          ? value.split(",").map((t) => t.trim()).filter(Boolean)
          : value
    });
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
        source: "user"
      })
    }).then(() => {
      setForm({
        title: "",
        language: "",
        category: "",
        description: "",
        tags: "",
        code: ""
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
      method: "DELETE"
    }).then(loadSnippets);
  };

  // =====================
  // EDIT
  // =====================
  const openEdit = (snippet) => {
    setEditingSnippet({
      ...snippet,
      tags: (snippet.tags || []).join(", ")
    });
    setIsEditOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditingSnippet({
      ...editingSnippet,
      [name]:
        name === "tags"
          ? value.split(",").map((t) => t.trim()).filter(Boolean)
          : value
    });
  };

  const updateSnippet = () => {
    fetch(`${API}/snippets/${editingSnippet.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingSnippet)
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
    ...new Set(snippets.map((s) => s.category).filter(Boolean))
  ];

  const filteredSnippets = snippets.filter((s) => {
    const q = search.toLowerCase();

    const matchesSearch =
      s.title?.toLowerCase().includes(q) ||
      s.language?.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q) ||
      s.code?.toLowerCase().includes(q) ||
      (s.tags || []).some((t) => t.toLowerCase().includes(q));

    const matchesCategory =
      activeCategory === "All" || s.category === activeCategory;

    const matchesSource =
      activeSource === "all" || s.source === activeSource;

    return matchesSearch && matchesCategory && matchesSource;
  });

  return (
    <div className="app">

      {/* TOP */}
      <div className="topbar">
        <h1>Snippet Manager</h1>

        <input
          className="search"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="layout">

        {/* SIDEBAR */}
        <div className="sidebar">

          <button className="button" onClick={() => setIsCreateOpen(true)}>
            + Add Snippet
          </button>

          <hr />

          <h2>Source</h2>

          <button onClick={() => setActiveSource("all")}>All</button>
          <button onClick={() => setActiveSource("user")}>My Snippets</button>
          <button onClick={() => setActiveSource("library")}>Library (empty)</button>

          <hr />

          <h2>Categories</h2>

          {categories.map((cat) => (
            <button
              key={cat}
              className={activeCategory === cat ? "active" : ""}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="content">
          <div className="grid">

            {filteredSnippets.map((s) => (
              <div className="card" key={s.id}>

                <div className="meta">
                  {s.title} • {s.language} • {s.source}
                </div>

                <p className="desc">{s.description}</p>

                <pre>
                  <code className={`language-${s.language?.toLowerCase()}`}>
                    {s.code}
                  </code>
                </pre>

                <div className="tags">
                  {(s.tags || []).map((tag, i) => (
                    <span className="tag" key={i}>
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="actions">
                  <button onClick={() => openEdit(s)}>Edit</button>
                  <button onClick={() => deleteSnippet(s.id)}>Delete</button>
                </div>

              </div>
            ))}

          </div>
        </div>

      </div>

      {/* MODALS unchanged */}
      {isCreateOpen && (
        <div className="modalOverlay">
          <div className="modal">
            <h2>Create Snippet</h2>

            <input name="title" placeholder="Title" onChange={handleChange} />
            <input name="language" placeholder="Language" onChange={handleChange} />
            <input name="category" placeholder="Category" onChange={handleChange} />
            <input name="tags" placeholder="Tags (comma separated)" onChange={handleChange} />
            <textarea name="description" placeholder="Description" onChange={handleChange} />
            <textarea name="code" placeholder="Code" onChange={handleChange} />

            <button onClick={addSnippet}>Create</button>
            <button onClick={() => setIsCreateOpen(false)}>Cancel</button>
          </div>
        </div>
      )}

      {isEditOpen && (
        <div className="modalOverlay">
          <div className="modal">
            <h2>Edit Snippet</h2>

            <input name="title" value={editingSnippet?.title || ""} onChange={handleEditChange} />
            <input name="language" value={editingSnippet?.language || ""} onChange={handleEditChange} />
            <input name="category" value={editingSnippet?.category || ""} onChange={handleEditChange} />
            <input name="tags" value={editingSnippet?.tags || ""} onChange={handleEditChange} />
            <textarea name="description" value={editingSnippet?.description || ""} onChange={handleEditChange} />
            <textarea name="code" value={editingSnippet?.code || ""} onChange={handleEditChange} />

            <button onClick={updateSnippet}>Save</button>
            <button onClick={() => setIsEditOpen(false)}>Cancel</button>
          </div>
        </div>
      )}

    </div>
  );
}