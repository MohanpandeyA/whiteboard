// src/api.js — centralised API calls
import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3030";

const api = axios.create({
  baseURL: BASE_URL,
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auth ──────────────────────────────────────────────
export const registerUser = (name, email, password) =>
  api.post("/user/register", { name, email, password });

export const loginUser = (email, password) =>
  api.post("/user/login", { email, password });

export const getUserProfile = () => api.get("/user/profile");

// ── Canvas ────────────────────────────────────────────
export const getAllCanvases = () => api.get("/api/canvas");

export const getCanvasById = (canvasId) =>
  api.get(`/api/canvas/${canvasId}`);

export const createCanvas = (name) =>
  api.post("/api/canvas", { name, elements: [], is_public: false });

export const updateCanvas = (canvasId, data) =>
  api.put(`/api/canvas/${canvasId}`, data);

export const deleteCanvas = (canvasId) =>
  api.delete(`/api/canvas/${canvasId}`);
