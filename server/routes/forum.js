const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');
const { authenticate, isAdmin } = require('../middleware/authMiddleware');

// Public routes
router.get('/discussions', forumController.getDiscussions);
router.get('/discussions/:id', forumController.getDiscussionById);
router.get('/comments', forumController.getCommentsByCourseId);
router.get('/lessons/:courseId', forumController.getLessonsByCourseId);

// Authenticated routes
router.post('/discussions', authenticate, forumController.createDiscussion);
router.post('/discussions/:id/comments', authenticate, forumController.addComment);

// Admin routes
router.delete('/comments/:id', authenticate, isAdmin, forumController.deleteComment);

module.exports = router;
