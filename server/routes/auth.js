const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');

// Register route
router.post('/register', registerUser);

// Login route
router.post('/login', loginUser);

// Profile picture upload route
router.post('/upload-profile-picture', authenticate, userController.uploadProfilePicture);

module.exports = router;
