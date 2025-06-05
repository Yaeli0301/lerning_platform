const Joi = require('joi');
const User = require('../models/User');

const ADMIN_CODES = ['admin123', 'secureCode456']; // Allowed admin codes

// Joi validation schemas
const registerSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('user', 'admin').required(),
  adminCode: Joi.string().optional().allow(''),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  adminCode: Joi.string().optional().allow(''),
});

exports.registerUser = async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { name, email, password, role, adminCode } = value;

    if (role === 'admin') {
      // Check if an admin already exists
      const existingAdmin = await User.findOne({ role: 'admin' });
      if (existingAdmin) {
        return res.status(403).json({ message: 'כבר קיים מנהל מערכת. לא ניתן להוסיף מנהל נוסף.' });
      }
      if (!ADMIN_CODES.includes(adminCode)) {
        return res.status(403).json({ message: 'קוד מנהל שגוי!' });
      }
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'אימייל כבר קיים' });

    const newUser = new User({ name, email, password, role, adminCode: role === 'admin' ? adminCode : undefined });
    await newUser.save();

    res.status(201).json({ message: 'משתמש נרשם בהצלחה!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'שגיאה בשרת' });
  }
};

const jwt = require('jsonwebtoken');

exports.loginUser = async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { email, password, adminCode } = value;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'אימייל או סיסמה שגויים' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'אימייל או סיסמה שגויים' });

    if (user.isBlocked) {
      return res.status(403).json({ message: 'המשתמש חסום. נא לפנות למנהל המערכת.' });
    }

    if (user.role === 'admin') {
      if (!ADMIN_CODES.includes(adminCode)) {
        return res.status(403).json({ message: 'קוד מנהל שגוי!' });
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '1d' }
    );

    // For simplicity, return user info without password and token
    const userInfo = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    res.json({ message: 'התחברות הצליחה', user: userInfo, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'שגיאה בשרת' });
  }
};
