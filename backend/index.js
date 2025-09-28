import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from './routes/userRoutes.js';

import connectToDB from "./db.js";
import canvasRoutes from "./routes/canvasroutes.js"; // ✅ add .js extension

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3030;

// Connect to MongoDB
connectToDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
// Uncomment when these files exist
// import userRoutes from './routes/userRoutes.js';
// import registerRoutes from './routes/registerRoutes.js';
// import postRoutes from './routes/postRoutes.js';

// app.use('/api/register', registerRoutes);
// app.use('/api/post', postRoutes);
app.use('/user', userRoutes);

app.use("/api/canvas", canvasRoutes); // your canvas routes
/**
 * Starts the Express server and listens for incoming connections.
 * 
 * @param {number} PORT - The port number on which the server will listen.
 * @param {Function} callback - A callback function to be executed once the server starts listening.
 *                              In this case, it logs a message to the console.
 * @returns {http.Server} The HTTP server instance.
 */
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
