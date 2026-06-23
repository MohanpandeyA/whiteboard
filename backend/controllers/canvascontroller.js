// controllers/canvascontroller.js
import Canvas from "../models/canvasmodel.js";
import mongoose from "mongoose";

// Helper: validate MongoDB ObjectId to prevent injection
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Get all canvases for a user
export const getAllCanvas = async (req, res) => {
  try {
    const email = req.email;
    const canvases = await Canvas.getAllCanvasForUserByEmail(email);
    res.status(200).json(canvases);
  } catch (err) {
    console.error("getAllCanvas error:", err.message);
    res.status(500).json({ error: "Failed to retrieve canvases" });
  }
};

// Get a single canvas by ID
export const getCanvasById = async (req, res) => {
  try {
    const { canvasId } = req.params;

    if (!isValidObjectId(canvasId)) {
      return res.status(400).json({ error: "Invalid canvas ID" });
    }

    const canvas = await Canvas.findById(canvasId);
    if (!canvas) return res.status(404).json({ error: "Canvas not found" });

    // Allow owner or public canvas
    if (!canvas.is_public && canvas.owner !== req.email) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.status(200).json(canvas);
  } catch (err) {
    console.error("getCanvasById error:", err.message);
    res.status(500).json({ error: "Failed to retrieve canvas" });
  }
};

// Create a new canvas
export const createCanvas = async (req, res) => {
  try {
    const { name, elements, is_public } = req.body;
    const ownerEmail = req.email;

    // Sanitize name
    const safeName = typeof name === "string"
      ? name.trim().slice(0, 100)
      : "Untitled";

    // Validate elements is an array
    const safeElements = Array.isArray(elements) ? elements : [];

    // Limit elements size
    if (safeElements.length > 10000) {
      return res.status(400).json({ error: "Too many elements" });
    }

    const newCanvas = await Canvas.create({
      owner: ownerEmail,
      name: safeName || "Untitled",
      elements: safeElements,
      is_public: Boolean(is_public),
      last_modified_by: ownerEmail,
    });

    res.status(201).json(newCanvas);
  } catch (err) {
    console.error("createCanvas error:", err.message);
    res.status(500).json({ error: "Failed to create canvas" });
  }
};

// Update canvas elements (save drawing)
export const updateCanvas = async (req, res) => {
  try {
    const { canvasId } = req.params;
    const { elements, name, is_public } = req.body;
    const email = req.email;

    if (!isValidObjectId(canvasId)) {
      return res.status(400).json({ error: "Invalid canvas ID" });
    }

    const canvas = await Canvas.findById(canvasId);
    if (!canvas) return res.status(404).json({ error: "Canvas not found" });
    if (canvas.owner !== email) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (elements !== undefined) {
      if (!Array.isArray(elements)) {
        return res.status(400).json({ error: "Elements must be an array" });
      }
      if (elements.length > 10000) {
        return res.status(400).json({ error: "Too many elements" });
      }
      canvas.elements = elements;
    }

    if (name !== undefined) {
      canvas.name = String(name).trim().slice(0, 100) || "Untitled";
    }

    if (is_public !== undefined) {
      canvas.is_public = Boolean(is_public);
    }

    canvas.last_modified_by = email;
    await canvas.save();
    res.status(200).json(canvas);
  } catch (err) {
    console.error("updateCanvas error:", err.message);
    res.status(500).json({ error: "Failed to update canvas" });
  }
};

// Delete canvas (only owner allowed)
export const deleteCanvas = async (req, res) => {
  try {
    const email = req.email;
    const { canvasId } = req.params;

    if (!isValidObjectId(canvasId)) {
      return res.status(400).json({ error: "Invalid canvas ID" });
    }

    await Canvas.deleteCanvasByOwner(canvasId, email);
    res.status(200).json({ message: "Canvas deleted successfully" });
  } catch (err) {
    console.error("deleteCanvas error:", err.message);
    if (err.message && err.message.includes("Unauthorized")) {
      return res.status(403).json({ error: "Access denied" });
    }
    if (err.message && err.message.includes("not found")) {
      return res.status(404).json({ error: "Canvas not found" });
    }
    res.status(500).json({ error: "Failed to delete canvas" });
  }
};
