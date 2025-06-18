const User = require('../models/User');
const uploadProfilePicture = require('../middleware/uploadProfilePictureMiddleware');
const path = require('path');

// Update user profile
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const authUserId = req.user?.id;

    if (userId !== authUserId) {
      return res.status(403).json({ message: 'גישה נדחתה' });
    }

    const { name, email, profilePicture } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email, profilePicture },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'משתמש לא נמצא' });
    }

    res.json({ message: 'פרופיל עודכן בהצלחה', user: updatedUser });
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).json({ message: 'שגיאה בשרת' });
  }
};

exports.uploadProfilePicture = [
  uploadProfilePicture.single('profilePicture'),
  async (req, res) => {
    try {
      const userId = req.params.id;
      const authUserId = req.user?.id;

      if (userId !== authUserId) {
        return res.status(403).json({ message: 'גישה נדחתה' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'לא נבחרה תמונה' });
      }

      const profilePicturePath = path.join('/uploads/profile', req.file.filename);

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { profilePicture: profilePicturePath },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ message: 'משתמש לא נמצא' });
      }

      res.json({ message: 'תמונת פרופיל עודכנה בהצלחה', user: updatedUser });
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      res.status(500).json({ message: 'שגיאה בשרת' });
    }
  }
];
