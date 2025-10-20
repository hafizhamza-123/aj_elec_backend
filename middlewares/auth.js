const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  jwt.verify(
    token,
    process.env.ACCESS_TOKEN_SECRET || "access_secret",
    (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }

      //  Handle all possible token key names
      req.user = decoded;
      req.user._id = decoded._id || decoded.id || decoded.userId;

      next();
    }
  );
}

module.exports = { authMiddleware };
