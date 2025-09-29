// controllers/canvascontroller.js
import Canvas from "../models/canvasmodel.js"; // matches the actual file name


// Get all canvases for a user
export const getAllCanvas = async (req, res) => {
  try {
    const email = req.email; // assuming your auth middleware sets req.user
    const canvases = await Canvas.getAllCanvasForUserByEmail(email);
    res.status(200).json(canvases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// ✅ Create a new canvas
export const createCanvas = async (req, res) => {
  try {
    const { name, elements, is_public } = req.body;
    const ownerEmail = req.email; // ✅ use req.email here
    const newCanvas = await Canvas.create({
      owner: ownerEmail,
      name,
      elements,
      is_public,
      last_modified_by: ownerEmail
    });
    res.status(201).json(newCanvas);
  } catch (err) {
    console.error("Error creating canvas:", err);
    res.status(500).json({ error: err.message });
  }
};
// 🔹 Delete canvas (only owner allowed)
export const deleteCanvas = async (req, res) => {
  try {
    const email = req.email;
    const { canvasId } = req.params;

    await Canvas.deleteCanvasByOwner(canvasId, email);
    res.status(200).json({ message: "Canvas deleted successfully" });
  } catch (err) {
    if (err.message.includes("Unauthorized")) {
      return res.status(403).json({ error: err.message });
    }
    if (err.message.includes("not found")) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};
