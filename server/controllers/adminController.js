const User = require('../models/User');
const Joi = require('joi');

// Validation schema for user blocking
const blockUserSchema = Joi.object({
  blocked: Joi.boolean().required(),
});

exports.getUsers = async (req, res) => {
  try {
    const { skip = 0, limit = 10 } = req.query;
    const users = await User.find()
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .select('-password')
      .exec();

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'שגיאה בשרת' });
  }
};

exports.blockUser = async (req, res) => {
  try {
    const { error, value } = blockUserSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'משתמש לא נמצא' });

    user.isBlocked = value.blocked;
    await user.save();

    res.json({ message: `משתמש ${value.blocked ? 'חסום' : 'שוחרר'} בהצלחה` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'שגיאה בשרת' });
  }
};
