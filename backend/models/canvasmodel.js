import mongoose from "mongoose";

const CanvasSchema = new mongoose.Schema({
  owner: { 
    type: String,          // ✅ store email instead of ObjectId
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  elements: { 
    type: Array, 
    default: [] 
  },
  is_public: { 
    type: Boolean, 
    default: false 
  },
  last_modified_by: { 
    type: String,          // ✅ store email instead of ObjectId
    required: true 
  }
}, { timestamps: true });

// Get all canvases for a user by email
CanvasSchema.statics.getAllCanvasForUserByEmail = async function (email) {
  try {
    // Directly query canvases where owner OR shared_with contains the email
    const allCanvas = await this.find({
      $or: [
        { owner: email },
        { shared_with: email }
      ]
    });
    return allCanvas;
  } catch (error) {
    console.error("Error getting all canvas for user by email:", error);
    throw error;
  }
};


//create a canvas for a user with  given email and name
CanvasSchema.statics.createCanvasForUser = async function (email, name) {
  try {
    const User = mongoose.model("users");
    const user = await User.getUser(email); // assumes you have a static getUser on User model

    if (!user) {
      // ❌ don't return new Error, just throw
      throw new Error("User not found");
    }

    // create a new canvas
    const canvas = await this.create({
      owner: email,
      name,
      elements: [],   // start with an empty elements array
      shared_with: [], // default empty array if you want sharing later
      last_modified_by: email
    });

    return canvas; // ✅ return the created document
  } catch (err) {
    console.error("Error creating canvas for user:", err);
    throw err; // ❗ rethrow so controller can catch and respond
  }
};
CanvasSchema.statics.deleteCanvasByOwner = async function (canvasId, email) {
  const canvas = await this.findById(canvasId);
  if (!canvas) {
    throw new Error("Canvas not found");
  }
  if (canvas.owner !== email) {
    throw new Error("Unauthorized: Only owner can delete this canvas");
  }
  return await canvas.deleteOne();
};



export default mongoose.model("Canvas", CanvasSchema);
