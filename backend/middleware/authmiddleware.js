// middleware/authmiddleware.js
import jwt from 'jsonwebtoken';

const authenticationMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Access denied: No token provided" });
  }

  const token = authHeader.slice(7); // Remove "Bearer "

  const SECRET_KEY = process.env.JWT_SECRET;
  if (!SECRET_KEY) {
    console.error("JWT_SECRET is not configured");
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    if (!decoded.email) {
      return res.status(401).json({ error: "Invalid token payload" });
    }
    req.email = decoded.email;
    req.userId = decoded.id;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "Token expired, please login again" });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
};

export default authenticationMiddleware;
