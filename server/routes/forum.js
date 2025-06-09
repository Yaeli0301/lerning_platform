const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');
const { authenticate, isAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // corrected import

// Public routes
router.get('/discussions', forumController.getDiscussions);
router.get('/discussions/:id', forumController.getDiscussionById);
router.get('/comments', forumController.getCommentsByCourseId);
router.get('/lessons/:courseId', forumController.getLessonsByCourseId);

// Authenticated routes
router.post('/discussions', authenticate, forumController.createDiscussion);
router.post('/discussions/:id/comments', authenticate, forumController.addComment);

// New message and users routes
router.get('/discussions/:id/messages', authenticate, forumController.getMessagesByDiscussionId);
router.get('/discussions/:id/users', authenticate, forumController.getUsersInDiscussion);
router.post('/discussions/:id/messages', authenticate, upload.single('image'), forumController.postMessageToDiscussion);

// Admin routes
router.delete('/comments/:id', authenticate, isAdmin, forumController.deleteComment);

module.exports = router;
