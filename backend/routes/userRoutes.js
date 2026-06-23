import express from "express";
import { registerUser, loginUser, getUserProfile } from "../controllers/usercontroller.js";
import authenticationMiddleware from "../middleware/authmiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
// Profile now uses the auth middleware (no manual JWT re-verification in controller)
router.get("/profile", authenticationMiddleware, getUserProfile);

export default router;
