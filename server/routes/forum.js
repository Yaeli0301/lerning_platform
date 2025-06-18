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
router.post('/comments/:id', authenticate, upload.array('images', 5), forumController.addComment);

// New message and users routes
router.get('/discussions/:id/messages', authenticate, forumController.getMessagesByDiscussionId);
router.get('/discussions/:id/users', authenticate, forumController.getUsersInDiscussion);
router.post('/discussions/:id/messages', authenticate, upload.single('image'), forumController.postMessageToDiscussion);

// Admin routes
router.delete('/comments/:id', authenticate, isAdmin, forumController.deleteComment);
router.post('/comments/:id/block', authenticate, isAdmin, forumController.blockComment);
router.post('/discussions/:id/block', authenticate, isAdmin, forumController.blockDiscussion);

module.exports = router;
