// verifyToken.js

const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Get token from Authorization header
  if (!token) {
    return res.status(403).send({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'Invalid or expired token' });
    }
    req.user = decoded; // Attach user info to the request
    next();
  });
};

module.exports = verifyToken;
