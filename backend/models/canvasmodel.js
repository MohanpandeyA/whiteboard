// models/canvasmodels.js
import mongoose from "mongoose";

const CanvasSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  elements: {
    type: [{ type: mongoose.Schema.Types.Mixed }],
    default: [],
  },
  shared_with: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  is_public: {
    type: Boolean,
    default: false,
  },
  last_modified_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
}, { timestamps: true });

// Get all canvases for a user by email
CanvasSchema.statics.getAllCanvasForUserByEmail = async function(email) {
  try {
    // Populate owner and shared_with to access email
    const allCanvas = await this.find()
      .populate("owner", "email")
      .populate("shared_with", "email");

    // Filter by email
    return allCanvas.filter(canvas =>
      canvas.owner.email === email ||
      canvas.shared_with.some(u => u.email === email)
    );
  } catch (error) {
    console.error("Error getting all canvas for user by email:", error);
    throw error;
  }
};

export default mongoose.model("Canvas", CanvasSchema);
