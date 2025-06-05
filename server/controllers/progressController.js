const User = require('../models/User');

// Helper function for error response
const handleError = (res, err, message = 'שגיאה בשרת', code = 500) => {
  console.error(message, err);
  return res.status(code).json({ message, error: err.message });
};

// Save lesson progress for a user
exports.saveLessonProgress = async (req, res) => {
  try {
    const userId = req.user?.id;
    const courseId = req.params.id;
    const lessonId = req.params.lessonId;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'משתמש לא נמצא' });

    if (!user.lessonProgress) {
      user.lessonProgress = {};
    }

    if (!user.lessonProgress[courseId]) {
      user.lessonProgress[courseId] = {};
    }

    user.lessonProgress[courseId][lessonId] = true;

    await user.save();

    return res.json({ message: 'התקדמות השיעור נשמרה בהצלחה' });
  } catch (err) {
    return handleError(res, err, 'Error saving lesson progress');
  }
};
