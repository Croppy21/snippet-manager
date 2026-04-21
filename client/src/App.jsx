import { useEffect, useState } from "react";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import "./App.css";

export default function App() {
  const [snippets, setSnippets] = useState([]);

  const emptyForm = {
    title: "",
    language: "",
    category: "",
    description: "",
    tags: [],
    code: ""
  };

  const [form, setForm] = useState(emptyForm);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState(null);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const API = "http://localhost:5000";

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
    document.querySelectorAll("pre code").forEach((block) => {
      hljs.highlightElement(block);
    });
  }, [snippets]);

  // =====================
  // CREATE
  // =====================
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "tags") {
      setForm({
        ...form,
        tags: value
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const addSnippet = () => {
    fetch(`${API}/snippets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    }).then(() => {
      setForm(emptyForm);
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
  const openModal = (snippet) => {
    setEditingSnippet({
      ...snippet,
      tags: snippet.tags || []
    });
    setIsModalOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    if (name === "tags") {
      setEditingSnippet({
        ...editingSnippet,
        tags: value
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      });
    } else {
      setEditingSnippet({
        ...editingSnippet,
        [name]: value
      });
    }
  };

  const updateSnippet = () => {
    fetch(`${API}/snippets/${editingSnippet.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingSnippet)
    }).then(() => {
      setIsModalOpen(false);
      setEditingSnippet(null);
      loadSnippets();
    });
  };

  // =====================
  // SEARCH
  // =====================
  const filteredSnippets = snippets.filter((s) => {
    const q = search.toLowerCase();

    return (
      s.title?.toLowerCase().includes(q) ||
      s.language?.toLowerCase().includes(q) ||
      s.category?.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q) ||
      s.code?.toLowerCase().includes(q) ||
      (s.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  });

  // =====================
  // UI
  // =====================
  return (
    <div className="app">
      {/* TOP */}
      <div className="topbar">
        <h1>Snippet Manager</h1>

        <input
          className="search"
          placeholder="Search snippets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* CONTENT */}
      <div className="layout">
        <div className="sidebar">
          <button onClick={() => setIsCreateOpen(true)} className="button">
            + Add Snippet
          </button>
        </div>

        <div className="content">
          <div className="grid">
            {filteredSnippets.map((s) => (
              <div className="card" key={s.id}>
                <h3>{s.title}</h3>

                <div className="meta">
                  {s.language} • {s.category}
                </div>

                <p className="desc">{s.description}</p>

                {/* SYNTAX HIGHLIGHT */}
                <pre>
                  <code className={`language-${s.language?.toLowerCase()}`}>
                    {s.code}
                  </code>
                </pre>

                {/* TAGS FIXED */}
                <div className="tags">
                  {(s.tags || []).map((tag, i) => (
                    <span key={i} className="tag">
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="actions">
                  <button onClick={() => openModal(s)}>Edit</button>
                  <button onClick={() => deleteSnippet(s.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CREATE */}
      {isCreateOpen && (
        <div className="modalOverlay">
          <div className="modal">
            <h2>Create Snippet</h2>

            <input name="title" placeholder="Title" onChange={handleChange} />

            <select name="language" onChange={handleChange}>
              <option value="">Language</option>
              <option value="javascript">JavaScript</option>
              <option value="cpp">C++</option>
              <option value="python">Python</option>
            </select>

            <input name="category" placeholder="Category" onChange={handleChange} />
            <textarea name="description" placeholder="Description" onChange={handleChange} />
            <input name="tags" placeholder="loop, array, basics" onChange={handleChange} />
            <textarea name="code" placeholder="Code" onChange={handleChange} />

            <button onClick={addSnippet}>Create</button>
            <button onClick={() => setIsCreateOpen(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* EDIT */}
      {isModalOpen && editingSnippet && (
        <div className="modalOverlay">
          <div className="modal">
            <h2>Edit Snippet</h2>

            <input
              name="title"
              value={editingSnippet.title}
              onChange={handleEditChange}
            />

            <select
              name="language"
              value={editingSnippet.language}
              onChange={handleEditChange}
            >
              <option value="javascript">JavaScript</option>
              <option value="cpp">C++</option>
              <option value="python">Python</option>
            </select>

            <input
              name="category"
              value={editingSnippet.category}
              onChange={handleEditChange}
            />

            <textarea
              name="description"
              value={editingSnippet.description}
              onChange={handleEditChange}
            />

            <input
              name="tags"
              value={editingSnippet.tags.join(", ")}
              onChange={handleEditChange}
            />

            <textarea
              name="code"
              value={editingSnippet.code}
              onChange={handleEditChange}
            />

            <button onClick={updateSnippet}>Save</button>
            <button onClick={() => setIsModalOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}