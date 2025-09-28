// controllers/canvascontroller.js
import Canvas from "../models/canvasmodel.js"; // matches the actual file name


// Get all canvases for a user
export const getAllCanvas = async (req, res) => {
  try {
    const email = req.user.email; // assuming your auth middleware sets req.user
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

    // the auth middleware should set req.user
    const owner = req.user._id;

    const newCanvas = await Canvas.create({
      owner,
      name,
      elements,
      is_public,
      last_modified_by: owner
    });

    res.status(201).json(newCanvas);
  } catch (err) {
    console.error("Error creating canvas:", err);
    res.status(500).json({ error: err.message });
  }
};

