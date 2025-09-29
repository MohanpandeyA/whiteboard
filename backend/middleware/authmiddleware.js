// middleware/authmiddleware.js
import jwt from 'jsonwebtoken';
import User from '../models/usermodel.js';

const SECRET_KEY = process.env.JWT_SECRET || 'your_jwt_secret_here';

const authenticationMiddleware = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) 
    return res.status(401).json({ error: "Access Denied: No Token Provided" });

  try {
    const decoded = jwt.verify(token.replace("Bearer ", ""), SECRET_KEY);
    req.email = decoded.email; // now accessible in controllers
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid Token" });
  }
};

// ✅ default export for ESM
export default authenticationMiddleware;
