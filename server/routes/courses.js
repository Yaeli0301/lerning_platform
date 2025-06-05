const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const progressController = require('../controllers/progressController');
const { authenticate } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Multer setup for uploads folder
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Routes for courses
router.get('/', courseController.getCourses);
router.get('/categories', courseController.getCategories);
router.get('/:id', courseController.getCourseById);
router.post('/', authenticate, courseController.createCourse);
router.put('/:id', authenticate, courseController.updateCourse);
router.put('/:id/deactivate', authenticate, courseController.deleteCourse);

// Enrollment status route
router.get('/:id/enrollment-status', authenticate, courseController.getEnrollmentStatus);

// Enroll user in course
router.post('/:id/enroll', authenticate, courseController.enrollCourse);

// Save lesson progress
router.post('/:id/lessons/:lessonId/progress', authenticate, progressController.saveLessonProgress);

const videoUpload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /mp4|mov|avi|wmv|flv|mkv/;
    const extname = filetypes.test(file.originalname.toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'));
    }
  }
});

// Upload course or lesson image
router.post('/upload-image', authenticate, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file uploaded' });
  }
  const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  return res.json({ imageUrl });
});

// Upload lesson video file
router.post('/upload-video', authenticate, videoUpload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No video file uploaded' });
  }
  const videoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  return res.json({ videoUrl });
});

module.exports = router;
