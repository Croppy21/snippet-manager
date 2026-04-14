import { useEffect, useState } from "react";
import "./App.css";

export default function App() {
  const [snippets, setSnippets] = useState([]);

  const [form, setForm] = useState({
    title: "",
    code: "",
    language: "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState(null);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // =====================
  // LOAD DATA
  // =====================
  const loadSnippets = () => {
    fetch("http://localhost:3000/snippets")
      .then((res) => res.json())
      .then(setSnippets);
  };

  useEffect(() => {
    loadSnippets();
  }, []);

  // =====================
  // CREATE
  // =====================
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

const addSnippet = () => {
  fetch("http://localhost:3000/snippets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form)
  }).then(() => {
    setForm({ title: "", code: "", language: "" });
    loadSnippets();
  });
};

  // =====================
  // DELETE
  // =====================
  const deleteSnippet = (id) => {
    fetch(`http://localhost:3000/snippets/${id}`, {
      method: "DELETE",
    }).then(loadSnippets);
  };

  // =====================
  // EDIT (MODAL)
  // =====================
  const openModal = (snippet) => {
    setEditingSnippet(snippet);
    setIsModalOpen(true);
  };

  const handleEditChange = (e) => {
    setEditingSnippet({
      ...editingSnippet,
      [e.target.name]: e.target.value,
    });
  };

  const updateSnippet = () => {
    fetch(`http://localhost:3000/snippets/${editingSnippet.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingSnippet),
    }).then(() => {
      setIsModalOpen(false);
      setEditingSnippet(null);
      loadSnippets();
    });
  };
  const filteredSnippets = snippets.filter((s) => {
    const query = search.toLowerCase();

    return (
      s.title.toLowerCase().includes(query) ||
      s.language.toLowerCase().includes(query) ||
      s.code.toLowerCase().includes(query)
    );
  });

  // =====================
  // UI
  // =====================
  return (
    <div className="app">
      {/* TOP BAR */}
      <div className="topbar">
        <div>
          <h1>Snippet Manager</h1>
          <div className="subtitle">
            Save, search and manage your code snippets
          </div>
        </div>

        <input
          className="search"
          placeholder="Search snippets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {/* MAIN LAYOUT */}
      <div className="layout">
        {/* LEFT SIDEBAR */}
        <div className="sidebar">
          <h2>Actions</h2>

          <button className="button" onClick={() => setIsCreateOpen(true)}>
            + Add Snippet
          </button>
        </div>

        {/* RIGHT CONTENT */}
        <div className="content">
          <div className="grid">
            {filteredSnippets.map((s) => (
              <div className="card" key={s.id}>
                <h3>{s.title}</h3>
                <div className="lang">{s.language}</div>
                <pre className="code">{s.code}</pre>

                <div className="actions">
                  <button className="editBtn" onClick={() => openModal(s)}>
                    Edit
                  </button>

                  <button
                    className="deleteBtn"
                    onClick={() => deleteSnippet(s.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* MODAL */}
      {isModalOpen && (
        <div className="modalOverlay">
          <div className="modal">
            <h2>Edit Snippet</h2>

            <input
              name="title"
              value={editingSnippet?.title || ""}
              onChange={handleEditChange}
            />

            <input
              name="language"
              value={editingSnippet?.language || ""}
              onChange={handleEditChange}
            />

            <textarea
              name="code"
              value={editingSnippet?.code || ""}
              onChange={handleEditChange}
            />

            <div className="modalActions">
              <button className="saveBtn" onClick={updateSnippet}>
                Save
              </button>

              <button
                className="cancelBtn"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {isCreateOpen && (
        <div className="modalOverlay">
          <div className="modal">
            <h2>Create Snippet</h2>

            <input
              name="title"
              placeholder="Title"
              value={form.title}
              onChange={handleChange}
            />

            <input
              name="language"
              placeholder="Language"
              value={form.language}
              onChange={handleChange}
            />

            <textarea
              name="code"
              placeholder="Code"
              value={form.code}
              onChange={handleChange}
            />

            <div className="modalActions">
              <button
                className="saveBtn"
                onClick={() => {
                  addSnippet();
                  setIsCreateOpen(false);
                }}
              >
                Create
              </button>

              <button
                className="cancelBtn"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
