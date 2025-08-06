const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const token = req.headers['authorization'];

  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);

    // Set both for now
    req.user = { id: decoded.id };
    req.userId = decoded.id;

    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
}

module.exports = auth;
