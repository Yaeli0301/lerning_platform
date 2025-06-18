const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, isAdmin } = require('../middleware/authMiddleware');

// Admin routes
router.use(authenticate);
router.get('/users', isAdmin, adminController.getUsers);
router.put('/users/:id/block', isAdmin, adminController.blockUser);

module.exports = router;
