import User from "../models/usermodel.js";
import jwt from "jsonwebtoken";

// Safe user projection — never return password hash
const safeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// Register
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }
    if (typeof name !== "string" || name.length > 50) {
      return res.status(400).json({ message: "Invalid name" });
    }

    const newUser = await User.register(name.trim(), email.toLowerCase().trim(), password);
    return res.status(201).json({
      success: true,
      data: safeUser(newUser),
    });
  } catch (error) {
    if (error.code === 11000 || (error.message && error.message.includes("duplicate"))) {
      return res.status(409).json({ message: "Email already registered" });
    }
    return res.status(400).json({ message: error.message });
  }
};

// Login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error("JWT_SECRET is not set");
      return res.status(500).json({ message: "Server configuration error" });
    }

    const user = await User.login(email.toLowerCase().trim(), password);

    const token = jwt.sign({ email: user.email, id: user._id }, JWT_SECRET, {
      expiresIn: "24h",
    });

    return res.status(200).json({
      message: "Login successful",
      user: safeUser(user),
      token,
    });
  } catch (error) {
    // Always return the same message for auth failures (prevents user enumeration)
    return res.status(401).json({ message: "Invalid email or password" });
  }
};

// Get profile — uses auth middleware (req.email is set by middleware)
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.getUser(req.email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({
      message: "User profile retrieved successfully",
      user: safeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};
