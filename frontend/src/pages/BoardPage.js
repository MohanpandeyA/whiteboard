// src/pages/BoardPage.js
import React, { useEffect, useState, useCallback, useRef, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Board from "../components/Board";
import Toolbar from "../components/Toolbar";
import Toolbox from "../components/Toolbox";
import BoardProvider from "../store/BoardProvider";
import ToolboxProvider from "../store/ToolboxProvider";
import boardContext from "../store/board-context";
import { getCanvasById, updateCanvas } from "../api";
import { useCollaboration } from "../hooks/useCollaboration";
import { useAuth } from "../store/AuthContext";

const AUTO_SAVE_DELAY = 1500;

// Share modal — shows URL with copy button (like Miro)
const ShareModal = ({ onClose }) => {
  const [copied, setCopied] = useState(false);
  const url = window.location.href;

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div style={SM.overlay} onClick={onClose}>
      <div style={SM.modal} onClick={e => e.stopPropagation()}>
        <button style={SM.closeBtn} onClick={onClose}>✕</button>
        <h2 style={SM.title}>Whiteboard is better<br />when you're together</h2>
        <p style={SM.subtitle}>Share this link with other people.</p>
        <div style={SM.linkRow}>
          <input style={SM.linkInput} value={url} readOnly onClick={e => e.target.select()} />
          <button style={copied ? SM.copiedBtn : SM.copyBtn} onClick={handleCopy}>
            {copied ? "✓ Copied!" : "Copy link"}
          </button>
        </div>
        <p style={SM.hint}>Anyone with this link can view and draw on this canvas in real-time.</p>
      </div>
    </div>
  );
};

const SM = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
  },
  modal: {
    background: "#111111", borderRadius: 20, padding: "40px 48px",
    width: "100%", maxWidth: 520, position: "relative",
    border: "1px solid rgba(220,38,38,0.2)",
    boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
    textAlign: "center",
  },
  closeBtn: {
    position: "absolute", top: 16, right: 16,
    background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%",
    width: 32, height: 32, cursor: "pointer", color: "#9ca3af", fontSize: 14,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 24, fontWeight: 800, color: "#ffffff", margin: "0 0 12px", lineHeight: 1.3 },
  subtitle: { fontSize: 15, color: "#9ca3af", margin: "0 0 24px" },
  linkRow: { display: "flex", gap: 8, marginBottom: 20 },
  linkInput: {
    flex: 1, padding: "12px 16px", borderRadius: 10,
    border: "1.5px solid #374151", background: "#1f1f1f",
    color: "#d1d5db", fontSize: 13, outline: "none", cursor: "text",
  },
  copyBtn: {
    padding: "12px 20px", borderRadius: 10, border: "none",
    background: "linear-gradient(135deg, #dc2626, #991b1b)",
    color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
  },
  copiedBtn: {
    padding: "12px 20px", borderRadius: 10, border: "none",
    background: "linear-gradient(135deg, #16a34a, #15803d)",
    color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
  },
  hint: { fontSize: 13, color: "#6b7280", margin: 0 },
};

// Share button — opens the share modal
const ShareButton = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button style={S.shareBtn} onClick={() => setOpen(true)} title="Share canvas">
        🔗 Share
      </button>
      {open && <ShareModal onClose={() => setOpen(false)} />}
    </>
  );
};

// Collaborators indicator
const CollabIndicator = ({ users }) => {
  if (!users || users.length <= 1) return null;
  const others = users.filter((u) => !u.isMe);
  if (others.length === 0) return null;
  return (
    <div style={S.collabRow}>
      {others.slice(0, 5).map((u) => (
        <div key={u.socketId} style={S.avatar} title={u.userName}>
          {u.userName?.[0]?.toUpperCase() || "?"}
        </div>
      ))}
      {others.length > 5 && (
        <div style={S.avatar}>+{others.length - 5}</div>
      )}
    </div>
  );
};

// Inner layout — lives inside BoardProvider so Toolbar/Board/Toolbox share context
const BoardLayout = ({
  canvasName, onNameSave, saving, lastSaved, onBack, onManualSave,
  collaborators, emitDrawUpdate,
}) => {
  const { elements, toolActionType } = useContext(boardContext);
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(canvasName);
  const nameInputRef = useRef();

  // Emit live drawing updates throttled to ~30fps during drawing,
  // plus a final emit on stroke completion to ensure remote canvas is in sync.
  const prevActionTypeRef = useRef(toolActionType);
  const throttleTimerRef = useRef(null);

  useEffect(() => {
    const isDrawing = toolActionType === "DRAWING" || toolActionType === "ERASING";
    const wasDrawing =
      prevActionTypeRef.current === "DRAWING" ||
      prevActionTypeRef.current === "ERASING";
    const isNowIdle = toolActionType === "NONE";

    if (isDrawing) {
      // Throttle live updates to ~30fps (33ms interval)
      if (!throttleTimerRef.current) {
        throttleTimerRef.current = setTimeout(() => {
          emitDrawUpdate(elements);
          throttleTimerRef.current = null;
        }, 33);
      }
    } else if (wasDrawing && isNowIdle) {
      // Stroke completed — clear throttle and emit final state immediately
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
        throttleTimerRef.current = null;
      }
      emitDrawUpdate(elements);
    }

    prevActionTypeRef.current = toolActionType;
  }, [toolActionType, elements, emitDrawUpdate]);

  useEffect(() => { setNameVal(canvasName); }, [canvasName]);

  const startEdit = (e) => {
    e.stopPropagation();
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.select(), 0);
  };

  const commitEdit = () => {
    setEditingName(false);
    const trimmed = nameVal.trim();
    if (trimmed && trimmed !== canvasName) onNameSave(trimmed);
    else setNameVal(canvasName);
  };

  const handleKey = (e) => {
    if (e.key === "Enter") nameInputRef.current?.blur();
    if (e.key === "Escape") { setNameVal(canvasName); setEditingName(false); }
  };

  return (
    <div style={S.wrapper}>
      <div style={S.topBar}>
        <button style={S.backBtn} onClick={onBack}>← Dashboard</button>

        {editingName ? (
          <input
            ref={nameInputRef}
            style={S.nameInput}
            value={nameVal}
            onChange={e => setNameVal(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKey}
            maxLength={60}
          />
        ) : (
          <div style={S.nameRow}>
            <span style={S.canvasName}>{canvasName}</span>
            <button style={S.editBtn} onClick={startEdit} title="Rename">✎</button>
          </div>
        )}

        <CollabIndicator users={collaborators} />

        <div style={S.topRight}>
          <span style={S.saveStatus}>
            {saving ? "⏳ Saving…" : lastSaved ? `✓ ${lastSaved.toLocaleTimeString()}` : ""}
          </span>
          <ShareButton />
          <button style={S.saveBtn} onClick={onManualSave}>💾 Save</button>
        </div>
      </div>

      <div style={S.canvasArea}>
        <ToolboxProvider>
          <Toolbar />
          <Board />
          <Toolbox />
        </ToolboxProvider>
      </div>
    </div>
  );
};

const BoardPage = () => {
  const { canvasId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [canvasName, setCanvasName] = useState("Untitled");
  const [initialElements, setInitialElements] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const currentElementsRef = useRef([]);
  // Ref to the BoardProvider's remote update function
  const remoteUpdateRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await getCanvasById(canvasId);
        if (!cancelled) {
          setCanvasName(res.data.name || "Untitled");
          setInitialElements(res.data.elements || []);
        }
      } catch {
        if (!cancelled) setError("Failed to load canvas.");
      }
    };
    load();
    return () => { cancelled = true; };
  }, [canvasId]);

  const saveElements = useCallback(async (elements) => {
    currentElementsRef.current = elements;
    try {
      setSaving(true);
      await updateCanvas(canvasId, { elements });
      setLastSaved(new Date());
    } catch (err) {
      console.error("Auto-save failed:", err);
    } finally {
      setSaving(false);
    }
  }, [canvasId]);

  const handleNameSave = useCallback(async (newName) => {
    setCanvasName(newName);
    try { await updateCanvas(canvasId, { name: newName }); }
    catch (err) { console.error("Name save failed:", err); }
  }, [canvasId]);

  const handleManualSave = useCallback(async () => {
    await saveElements(currentElementsRef.current);
  }, [saveElements]);

  // Handle remote drawing updates from other users
  const handleRemoteUpdate = useCallback((elements) => {
    remoteUpdateRef.current?.(elements);
  }, []);

  const handleUserJoined = useCallback((u) => {
    setCollaborators(prev => [...prev.filter(x => x.socketId !== u.socketId), u]);
  }, []);

  const handleUserLeft = useCallback((u) => {
    setCollaborators(prev => prev.filter(x => x.socketId !== u.socketId));
  }, []);

  const { emitDrawUpdate } = useCollaboration({
    canvasId,
    userName: user?.name || "Anonymous",
    onRemoteUpdate: handleRemoteUpdate,
    onUserJoined: handleUserJoined,
    onUserLeft: handleUserLeft,
  });

  if (error) {
    return (
      <div style={S.center}>
        <p style={{ color: "#ef4444" }}>{error}</p>
        <button style={S.backBtn} onClick={() => navigate("/dashboard")}>← Dashboard</button>
      </div>
    );
  }

  if (initialElements === null) {
    return <div style={S.center}><span style={{ fontSize: 32 }}>⏳</span><p>Loading…</p></div>;
  }

  return (
    <BoardProvider
      initialElements={initialElements}
      onSave={saveElements}
      autoSaveDelay={AUTO_SAVE_DELAY}
      remoteUpdateRef={remoteUpdateRef}
    >
      <BoardLayout
        canvasName={canvasName}
        onNameSave={handleNameSave}
        saving={saving}
        lastSaved={lastSaved}
        onBack={() => navigate("/dashboard")}
        onManualSave={handleManualSave}
        collaborators={collaborators}
        emitDrawUpdate={emitDrawUpdate}
      />
    </BoardProvider>
  );
};

const S = {
  wrapper: { display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", background: "#fff" },
  topBar: {
    display: "flex", alignItems: "center", gap: 12, padding: "0 16px",
    background: "#111111", borderBottom: "1px solid rgba(220,38,38,0.25)",
    zIndex: 200, flexShrink: 0, height: 50, boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
  },
  backBtn: {
    padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(220,38,38,0.4)",
    background: "transparent", cursor: "pointer", fontSize: 13, color: "#ef4444",
    fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0,
  },
  nameRow: { flex: 1, display: "flex", alignItems: "center", gap: 6, overflow: "hidden" },
  canvasName: {
    fontWeight: 700, fontSize: 15, color: "#ffffff",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  editBtn: {
    background: "transparent", border: "none", color: "#6b7280",
    fontSize: 14, cursor: "pointer", padding: "2px 4px", borderRadius: 4, flexShrink: 0,
  },
  nameInput: {
    flex: 1, background: "#1f1f1f", border: "1.5px solid rgba(220,38,38,0.5)",
    borderRadius: 6, color: "#ffffff", fontSize: 15, fontWeight: 700,
    padding: "4px 10px", outline: "none",
  },
  collabRow: { display: "flex", alignItems: "center", gap: 4, flexShrink: 0 },
  avatar: {
    width: 28, height: 28, borderRadius: "50%",
    background: "linear-gradient(135deg, #dc2626, #991b1b)",
    color: "#fff", fontSize: 12, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
    border: "2px solid #111", cursor: "default",
  },
  topRight: { display: "flex", alignItems: "center", gap: 10, flexShrink: 0 },
  saveStatus: { fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" },
  saveBtn: {
    padding: "5px 12px", borderRadius: 7, border: "1px solid rgba(220,38,38,0.4)",
    background: "rgba(220,38,38,0.1)", color: "#ef4444", fontSize: 12,
    fontWeight: 600, cursor: "pointer",
  },
  shareBtn: {
    padding: "6px 14px", borderRadius: 8,
    border: "none",
    background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
    color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
    whiteSpace: "nowrap", boxShadow: "0 2px 8px rgba(220,38,38,0.3)",
  },
  canvasArea: { flex: 1, position: "relative", overflow: "hidden", background: "#ffffff" },
  center: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", height: "100vh", background: "#0d0d0d",
    color: "#9ca3af", gap: 12, fontSize: 16,
  },
};

export default BoardPage;
