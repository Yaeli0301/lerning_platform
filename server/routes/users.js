const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');

// Update user profile
router.put('/:id', authenticate, userController.updateUserProfile);

// Upload profile picture
router.post('/:id/profile-picture', authenticate, userController.uploadProfilePicture);


module.exports = router;
