import jwt from "jsonwebtoken";
import { config } from "dotenv";
config();

export const verifyToken = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Accept token from Authorization header (Bearer) OR cookie
      let token = null;

      const authHeader = req.headers["authorization"];
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      } else {
        token = req.cookies?.token;
      }

      if (!token) {
        return res.status(401).json({ message: "Unauthorized. Please login" });
      }

      // Verify and decode token
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

      // Check if role is allowed
      if (allowedRoles.length > 0 && !allowedRoles.includes(decodedToken.role)) {
        return res.status(403).json({ message: "Forbidden. You don't have permission" });
      }

      // Attach user info to req for use in routes
      req.user = decodedToken;

      next();
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Session expired. Please login again" });
      }
      if (err.name === "JsonWebTokenError") {
        return res.status(401).json({ message: "Invalid token. Please login again" });
      }
      next(err);
    }
  };
};