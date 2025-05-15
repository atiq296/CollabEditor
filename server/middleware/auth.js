const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const token = req.headers['authorization'];

  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
}

module.exports = auth;


const auth = require('../middleware/auth');

router.get('/protected-route', auth, (req, res) => {
  res.send("This route is protected!");
});
