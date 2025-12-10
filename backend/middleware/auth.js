import jwt from "jsonwebtoken"; // using JWT tokens 

// Designed to check if the request has a valid JWT token
export function authMiddleware(req, res, next) {
  // reads the header from the incoming HTTP request
  const authHeader = req.headers.authorization;

  // No authorization header / doesnt start with Bearer - no token, returns "401 Unauthorized" ???????????
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  // Extracts the JWT token string 
  const token = authHeader.split(" ")[1];


  try {
    // first try to process.env, if fails goes to dev-secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    req.user = decoded; // { userId, email, iat, exp }
    next();
  } catch (err) {
    console.error("JWT error:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
}
