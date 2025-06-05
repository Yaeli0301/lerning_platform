const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, isAdmin } = require('../middleware/authMiddleware');

// Admin routes
router.use(authenticate);
router.get('/users', isAdmin, adminController.getUsers);
router.put('/users/:id/block', isAdmin, adminController.blockUser);
const forumController = require('../controllers/forumController');
router.put('/discussions/:id/block', isAdmin, forumController.blockDiscussion);

module.exports = router;
