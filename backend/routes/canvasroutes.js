import { Router } from "express";
import {
  getAllCanvas,
  getCanvasById,
  createCanvas,
  updateCanvas,
  deleteCanvas,
} from "../controllers/canvascontroller.js";
import authenticationMiddleware from "../middleware/authmiddleware.js";

const router = Router();

// Get all canvases for the authenticated user
router.get("/", authenticationMiddleware, getAllCanvas);

// Get a single canvas by ID
router.get("/:canvasId", authenticationMiddleware, getCanvasById);

// Create a new canvas
router.post("/", authenticationMiddleware, createCanvas);

// Update canvas elements / name / visibility
router.put("/:canvasId", authenticationMiddleware, updateCanvas);

// Delete a canvas (owner only)
router.delete("/:canvasId", authenticationMiddleware, deleteCanvas);

export default router;
