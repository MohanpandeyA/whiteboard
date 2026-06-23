import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import userRoutes from './routes/userRoutes.js';
import connectToDB from "./db.js";
import canvasRoutes from "./routes/canvasroutes.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3030;

const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ["http://localhost:3000"];

// ── Security headers (helmet) ─────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

// ── Body parsing with size limits (prevent DoS via large payloads) ────────────
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// ── Rate limiting ─────────────────────────────────────────────────────────────
// Auth endpoints: 10 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API: 200 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Connect to MongoDB ────────────────────────────────────────────────────────
connectToDB();

// ── REST Routes ───────────────────────────────────────────────────────────────
app.use('/user/login', authLimiter);
app.use('/user/register', authLimiter);
app.use('/user', userRoutes);
app.use("/api/canvas", apiLimiter, canvasRoutes);

// ── Socket.IO ─────────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  // Limit socket payload size
  maxHttpBufferSize: 2e6, // 2MB
});

io.on("connection", (socket) => {
  // Join a canvas room
  socket.on("join-canvas", ({ canvasId, userName }) => {
    // Sanitize inputs
    const safeCanvasId = String(canvasId || "").slice(0, 100);
    const safeUserName = String(userName || "Anonymous").slice(0, 50);

    if (!safeCanvasId) return;

    socket.join(safeCanvasId);
    socket.data.canvasId = safeCanvasId;
    socket.data.userName = safeUserName;

    socket.to(safeCanvasId).emit("user-joined", {
      socketId: socket.id,
      userName: safeUserName,
    });

    const room = io.sockets.adapter.rooms.get(safeCanvasId);
    const users = room
      ? [...room].map((sid) => {
          const s = io.sockets.sockets.get(sid);
          return { socketId: sid, userName: s?.data?.userName || "Anonymous" };
        })
      : [];
    socket.emit("room-users", users);
  });

  // Broadcast drawing elements to all OTHER users in the same canvas room
  socket.on("draw-update", ({ canvasId, elements }) => {
    const safeCanvasId = String(canvasId || "").slice(0, 100);
    if (!safeCanvasId || !Array.isArray(elements)) return;
    // Limit elements array size to prevent abuse
    if (elements.length > 10000) return;
    socket.to(safeCanvasId).emit("draw-update", { elements, from: socket.id });
  });

  // Broadcast cursor position
  socket.on("cursor-move", ({ canvasId, x, y }) => {
    const safeCanvasId = String(canvasId || "").slice(0, 100);
    if (!safeCanvasId) return;
    socket.to(safeCanvasId).emit("cursor-move", {
      socketId: socket.id,
      userName: socket.data.userName,
      x: Number(x) || 0,
      y: Number(y) || 0,
    });
  });

  socket.on("disconnect", () => {
    const { canvasId, userName } = socket.data;
    if (canvasId) {
      socket.to(canvasId).emit("user-left", { socketId: socket.id, userName });
    }
  });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ message: "CORS: Origin not allowed" });
  }
  console.error("Unhandled error:", err.message);
  res.status(500).json({ message: "Internal server error" });
});

// ── Start server ──────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
