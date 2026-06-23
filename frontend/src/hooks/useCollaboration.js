// src/hooks/useCollaboration.js
// Real-time multi-user collaboration via Socket.IO
import { useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = process.env.REACT_APP_API_URL || "http://localhost:3030";

export const useCollaboration = ({
  canvasId,
  userName,
  onRemoteUpdate,   // callback(elements) — called when another user draws
  onUserJoined,     // callback(user) — optional
  onUserLeft,       // callback(user) — optional
  onCursorMove,     // callback({socketId, userName, x, y}) — optional
}) => {
  const socketRef = useRef(null);
  const isRemoteUpdateRef = useRef(false);

  useEffect(() => {
    if (!canvasId) return;

    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      socket.emit("join-canvas", { canvasId, userName });
    });

    socket.on("room-users", (users) => {
      console.log("Users in room:", users.map(u => u.userName).join(", "));
    });

    socket.on("user-joined", (user) => {
      console.log(`${user.userName} joined`);
      onUserJoined?.(user);
    });

    socket.on("user-left", (user) => {
      console.log(`${user.userName} left`);
      onUserLeft?.(user);
    });

    // Receive drawing updates from other users
    socket.on("draw-update", ({ elements }) => {
      isRemoteUpdateRef.current = true;
      onRemoteUpdate?.(elements);
      isRemoteUpdateRef.current = false;
    });

    socket.on("cursor-move", (data) => {
      onCursorMove?.(data);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [canvasId, userName]); // eslint-disable-line react-hooks/exhaustive-deps

  // Emit drawing update to other users (call this after every draw action)
  const emitDrawUpdate = useCallback((elements) => {
    if (socketRef.current?.connected && !isRemoteUpdateRef.current) {
      // Serialize — strip non-serializable roughEle/path
      const serializable = elements.map(({ roughEle, path, ...rest }) => rest);
      socketRef.current.emit("draw-update", { canvasId, elements: serializable });
    }
  }, [canvasId]);

  // Emit cursor position
  const emitCursorMove = useCallback((x, y) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("cursor-move", { canvasId, x, y });
    }
  }, [canvasId]);

  return { emitDrawUpdate, emitCursorMove, isRemoteUpdateRef };
};
