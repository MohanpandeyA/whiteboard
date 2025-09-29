import { Router } from "express";
import { getAllCanvas, createCanvas } from "../controllers/canvascontroller.js"; // ✅ fixed path
import authenticationMiddleware from "../middleware/authmiddleware.js";

const router = Router();

// Create a new canvas
router.post("/", authenticationMiddleware, createCanvas);
// Get all canvases for a user
router.get("/", authenticationMiddleware, getAllCanvas);

//delete canvas route
router.delete("/delete/:canvasId", authMiddleware, deleteCanvas);
export default router;
