// src/pages/Dashboard.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext";
import { getAllCanvases, createCanvas, deleteCanvas } from "../api";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [canvases, setCanvases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);

  const fetchCanvases = async () => {
    try {
      setLoading(true);
      const res = await getAllCanvases();
      setCanvases(res.data);
    } catch (err) {
      setError("Failed to load canvases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCanvases(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      setCreating(true);
      const res = await createCanvas(newName.trim());
      setShowModal(false);
      setNewName("");
      navigate(`/board/${res.data._id}`);
    } catch (err) {
      setError("Failed to create canvas");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (canvasId, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this canvas? This cannot be undone.")) return;
    try {
      await deleteCanvas(canvasId);
      setCanvases((prev) => prev.filter((c) => c._id !== canvasId));
    } catch (err) {
      setError("Failed to delete canvas");
    }
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerIcon}>✏️</span>
          <h1 style={styles.logo}>Whiteboard</h1>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.userName}>👤 {user?.name}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* Main */}
      <main style={styles.main}>
        <div style={styles.topRow}>
          <div>
            <h2 style={styles.heading}>My Canvases</h2>
            <p style={styles.subheading}>{canvases.length} canvas{canvases.length !== 1 ? "es" : ""}</p>
          </div>
          <button style={styles.createBtn} onClick={() => setShowModal(true)}>
            + New Canvas
          </button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {loading ? (
          <div style={styles.empty}>Loading…</div>
        ) : canvases.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🎨</div>
            <p style={styles.emptyText}>No canvases yet.</p>
            <button style={styles.createBtn} onClick={() => setShowModal(true)}>
              Create your first canvas
            </button>
          </div>
        ) : (
          <div style={styles.grid}>
            {canvases.map((canvas) => (
              <div
                key={canvas._id}
                style={styles.card}
                onClick={() => navigate(`/board/${canvas._id}`)}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
              >
                <div style={styles.cardPreview}>
                  <span style={styles.cardIcon}>🖼️</span>
                </div>
                <div style={styles.cardBody}>
                  <h3 style={styles.cardTitle}>{canvas.name}</h3>
                  <p style={styles.cardMeta}>
                    {canvas.elements?.length || 0} elements · {new Date(canvas.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  style={styles.deleteBtn}
                  onClick={(e) => handleDelete(canvas._id, e)}
                  title="Delete canvas"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showModal && (
        <div style={styles.overlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>New Canvas</h3>
            <form onSubmit={handleCreate}>
              <input
                style={styles.modalInput}
                type="text"
                placeholder="Canvas name…"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
                required
              />
              <div style={styles.modalActions}>
                <button type="button" style={styles.cancelBtn} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" style={styles.createBtn} disabled={creating}>
                  {creating ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0d0d0d",
    fontFamily: "'Segoe UI', sans-serif",
    color: "#ffffff",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 32px",
    background: "#111111",
    borderBottom: "1px solid rgba(220,38,38,0.25)",
    boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 10 },
  headerIcon: { fontSize: 22 },
  logo: { fontSize: 20, margin: 0, color: "#ffffff", fontWeight: 800, letterSpacing: "-0.02em" },
  headerRight: { display: "flex", alignItems: "center", gap: 16 },
  userName: { fontSize: 14, color: "#9ca3af" },
  logoutBtn: {
    padding: "7px 16px",
    borderRadius: 8,
    border: "1px solid rgba(220,38,38,0.4)",
    background: "transparent",
    cursor: "pointer",
    fontSize: 13,
    color: "#ef4444",
    transition: "background 0.15s",
  },
  main: { maxWidth: 1100, margin: "0 auto", padding: "36px 24px" },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
  },
  heading: { fontSize: 26, margin: "0 0 4px", color: "#ffffff", fontWeight: 800 },
  subheading: { fontSize: 13, color: "#6b7280", margin: 0 },
  createBtn: {
    padding: "10px 22px",
    borderRadius: 8,
    border: "none",
    background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(220,38,38,0.3)",
  },
  error: {
    background: "rgba(220,38,38,0.15)",
    color: "#f87171",
    padding: "10px 14px",
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
    border: "1px solid rgba(220,38,38,0.3)",
  },
  empty: { textAlign: "center", color: "#6b7280", marginTop: 80, fontSize: 16 },
  emptyState: {
    textAlign: "center",
    marginTop: 80,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
  },
  emptyIcon: { fontSize: 56 },
  emptyText: { fontSize: 16, color: "#6b7280", margin: 0 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 20,
  },
  card: {
    background: "#1a1a1a",
    borderRadius: 12,
    border: "1px solid rgba(220,38,38,0.15)",
    cursor: "pointer",
    overflow: "hidden",
    position: "relative",
    transition: "transform 0.2s, box-shadow 0.2s",
    boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
  },
  cardPreview: {
    height: 120,
    background: "linear-gradient(135deg, #1a0000 0%, #3b0000 50%, #1a0000 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderBottom: "1px solid rgba(220,38,38,0.15)",
  },
  cardIcon: { fontSize: 40 },
  cardBody: { padding: "12px 16px" },
  cardTitle: { margin: 0, fontSize: 15, fontWeight: 700, color: "#ffffff" },
  cardMeta: { margin: "4px 0 0", fontSize: 12, color: "#6b7280" },
  deleteBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    background: "rgba(0,0,0,0.6)",
    border: "1px solid rgba(220,38,38,0.3)",
    borderRadius: 6,
    padding: "4px 6px",
    cursor: "pointer",
    fontSize: 13,
    color: "#ef4444",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "#111111",
    borderRadius: 12,
    padding: "32px",
    width: 360,
    boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
    border: "1px solid rgba(220,38,38,0.2)",
  },
  modalTitle: { margin: "0 0 20px", fontSize: 18, color: "#ffffff", fontWeight: 700 },
  modalInput: {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 8,
    border: "1.5px solid #374151",
    background: "#1f1f1f",
    color: "#ffffff",
    fontSize: 15,
    boxSizing: "border-box",
    marginBottom: 16,
    outline: "none",
  },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: 12 },
  cancelBtn: {
    padding: "10px 20px",
    borderRadius: 8,
    border: "1px solid #374151",
    background: "transparent",
    cursor: "pointer",
    fontSize: 14,
    color: "#9ca3af",
  },
};

export default Dashboard;
