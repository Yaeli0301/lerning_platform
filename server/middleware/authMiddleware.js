const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('authenticate middleware - no authorization header');
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    console.log('authenticate middleware - invalid token format');
    return res.status(401).json({ message: 'Unauthorized: Invalid token format' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    console.log('authenticate middleware - decoded token:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.log('authenticate middleware - invalid token error:', err.message);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Unauthorized: Token expired' });
    }
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};

const isAdmin = (req, res, next) => {
  const user = req.user;
  console.log('isAdmin middleware - user:', user);
  if (!user || user.role !== 'admin') {
    console.log('isAdmin middleware - access denied');
    return res.status(403).json({ message: 'גישה נדחתה!' });
  }
  console.log('isAdmin middleware - access granted');
  next();
};

module.exports = { authenticate, isAdmin };
