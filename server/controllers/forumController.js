// New imports
const Discussion = require('../models/Discussion');
const Comment = require('../models/Comment');
const Joi = require('joi');
const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');

// Validation schemas
const discussionSchema = Joi.object({
  title: Joi.string().required(),
  course: Joi.string().required(),
  lesson: Joi.string().required(),
});

const commentSchema = Joi.object({
  content: Joi.string().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  discussionId: Joi.string().required(),
  lessonId: Joi.string().optional(),
});

// Helper function for error response
const handleError = (res, err, message = 'שגיאה בשרת', code = 500) => {
  console.error(message, err);
  return res.status(code).json({ message, error: err.message });
};

exports.getLessonsByCourseId = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    if (!courseId) {
      return res.status(400).json({ message: 'Missing courseId parameter' });
    }
    const lessons = await Lesson.find({ course: courseId }).select('_id title').exec();
    res.json(lessons);
  } catch (err) {
    return handleError(res, err, 'Error fetching lessons by courseId');
  }
};

exports.createDiscussion = async (req, res) => {
  try {
    const { error, value } = discussionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const userId = req.user?.id;
    const username = req.user?.name || 'משתמש';
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: User ID missing' });
    }

    const courseDoc = await Course.findById(value.course) || await Course.findOne({ title: value.course });
    if (!courseDoc) {
      return res.status(400).json({ message: 'קורס לא נמצא' });
    }

    const lessonDoc = await Lesson.findById(value.lesson) || await Lesson.findOne({ title: value.lesson });
    if (!lessonDoc) {
      return res.status(400).json({ message: 'שיעור לא נמצא' });
    }
    if (lessonDoc.course.toString() !== courseDoc._id.toString()) {
      return res.status(400).json({ message: 'השיעור לא שייך לקורס שנבחר' });
    }

    const newDiscussion = new Discussion({
      user: userId,
      course: courseDoc._id,
      lesson: lessonDoc._id,
      title: value.title,
      creatorUsername: username,
      content: '',
      responses: [],
    });

    await newDiscussion.save();

    const io = req.app.get('io');
    io.emit('discussionCreated', newDiscussion);

    res.status(201).json({ message: 'דיון נוצר בהצלחה', discussion: newDiscussion });
  } catch (err) {
    return handleError(res, err, 'Error in createDiscussion');
  }
};

exports.getDiscussions = async (req, res) => {
  try {
    const { skip = 0, limit = 10, course, lesson } = req.query;

    const filter = {};
    if (course) {
      if (!mongoose.Types.ObjectId.isValid(course)) {
        return res.status(400).json({ message: 'Invalid course ID' });
      }
      filter.course = course;
    }
    if (lesson) {
      if (!mongoose.Types.ObjectId.isValid(lesson)) {
        return res.status(400).json({ message: 'Invalid lesson ID' });
      }
      filter.lesson = lesson;
    }

    const discussions = await Discussion.find(filter)
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .populate('lesson', 'title')
      .populate({
        path: 'responses',
        populate: { path: 'user', select: 'name' }
      })
      .exec();

    res.json(discussions);
  } catch (err) {
    return handleError(res, err, 'Error in getDiscussions');
  }
};

exports.getDiscussionById = async (req, res) => {
  try {
    const discussionId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(discussionId)) {
      return res.status(400).json({ message: 'Invalid discussion ID' });
    }

    const discussion = await Discussion.findById(discussionId)
      .populate('user', 'name email')
      .populate('lesson', 'title')
      .populate({
        path: 'responses',
        populate: { path: 'user', select: 'name' }
      })
      .exec();

    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    res.json(discussion);
  } catch (err) {
    return handleError(res, err, 'Error fetching discussion by ID');
  }
};

exports.addComment = async (req, res) => {
  try {
    const { error, value } = commentSchema.validate({ ...req.body, discussionId: req.params.id, lessonId: req.body.lessonId });
    if (error) return res.status(400).json({ message: error.details[0].message });

    if (!value.rating || value.rating < 1 || value.rating > 5) {
      return res.status(400).json({ message: 'Rating is required and must be between 1 and 5' });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: User ID missing' });
    }

    // Handle image upload
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => `/uploads/${file.filename}`);
    }

    const newComment = new Comment({
      user: userId,
      lesson: value.lessonId || null,
      content: value.content,
      rating: value.rating,
      images: images, // Save image URLs to the comment
    });

    await newComment.save();

    const io = req.app.get('io');
    io.emit('commentAdded', newComment);

    if (!value.lessonId) {
      const discussion = await Discussion.findById(req.params.id);
      if (!discussion) return res.status(404).json({ message: 'דיון לא נמצא' });

      discussion.responses.push(newComment._id);
      await discussion.save();
    }

    res.status(201).json({ message: 'תגובה נוספה בהצלחה', comment: newComment });
  } catch (err) {
    return handleError(res, err, 'Error adding comment');
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: 'תגובה לא נמצאה' });

    // Only the comment owner or an admin can delete the comment
    if (req.user.id !== comment.user.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Not authorized to delete this comment' });
    }

    await Comment.findByIdAndDelete(commentId);

    await Discussion.updateMany(
      { responses: commentId },
      { $pull: { responses: commentId } }
    );

    const io = req.app.get('io');
    io.emit('commentDeleted', { commentId });

    res.json({ message: 'תגובה נמחקה בהצלחה' });
  } catch (err) {
    return handleError(res, err, 'Error deleting comment');
  }
};

exports.blockDiscussion = async (req, res) => {
  try {
    const discussionId = req.params.id;
    const { blocked } = req.body;
    if (typeof blocked !== 'boolean') {
      return res.status(400).json({ message: 'Invalid blocked value' });
    }
    const discussion = await Discussion.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }
    discussion.isBlocked = blocked;
    await discussion.save();
    res.json({ message: `Discussion ${blocked ? 'blocked' : 'unblocked'} successfully`, discussion });
  } catch (err) {
    return handleError(res, err, 'Error blocking/unblocking discussion');
  }
};

exports.getCommentsByCourseId = async (req, res) => {
  try {
    const courseId = req.query.courseId;
    if (!courseId) return res.status(400).json({ message: 'Missing courseId query parameter' });

    // Find comments directly associated with the course or in discussions related to the course
    const comments = await Comment.find({ course: courseId })
      .populate('user', 'name')
      .exec();

    res.json(comments);
  } catch (err) {
    return handleError(res, err, 'Error fetching comments by courseId');
  }
};

// exports.blockDiscussion = async (req, res) => {
//   try {
//     const discussionId = req.params.id;
//     const { blocked } = req.body;
//     if (typeof blocked !== 'boolean') {
//       return res.status(400).json({ message: 'Invalid blocked value' });
//     }
//     const discussion = await Discussion.findById(discussionId);
//     if (!discussion) {
//       return res.status(404).json({ message: 'Discussion not found' });
//     }
//     discussion.isBlocked = blocked;
//     await discussion.save();
//     res.json({ message: `Discussion ${blocked ? 'blocked' : 'unblocked'} successfully`, discussion });
//   } catch (err) {
//     return handleError(res, err, 'Error blocking/unblocking discussion');
//   }
// };

exports.editComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const { content, rating } = req.body;
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return res.status(400).json({ message: 'Content is required' });
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating is required and must be between 1 and 5' });
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    // Check if user is owner or admin
    if (req.user.id !== comment.user.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Not authorized to edit this comment' });
    }
    comment.content = content;
    comment.rating = rating;
    await comment.save();

    const io = req.app.get('io');
    io.emit('commentEdited', comment);

    res.json({ message: 'Comment updated successfully', comment });
  } catch (err) {
    return handleError(res, err, 'Error editing comment');
  }
};

exports.blockComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Only admin can block comments
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Not authorized to block comments' });
    }

    comment.isBlocked = !comment.isBlocked; // Toggle the isBlocked status
    await comment.save();

    const io = req.app.get('io');
    io.emit('commentBlocked', { commentId, blocked: comment.isBlocked });

    res.json({ message: `Comment ${comment.isBlocked ? 'blocked' : 'unblocked'} successfully`, comment });
  } catch (err) {
    return handleError(res, err, 'Error blocking/unblocking comment');
  }
};

// Get messages by discussion ID
exports.getMessagesByDiscussionId = async (req, res) => {
  try {
    const discussionId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(discussionId)) {
      return res.status(400).json({ message: 'Invalid discussion ID' });
    }
    const messages = await Message.find({ discussionId })
      .populate('senderId', 'name profilePic')
      .sort({ createdAt: 1 })
      .exec();
    res.json(messages);
  } catch (err) {
    return handleError(res, err, 'Error fetching messages by discussion ID');
  }
};

// Get users in discussion by discussion ID
exports.getUsersInDiscussion = async (req, res) => {
  try {
    const discussionId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(discussionId)) {
      return res.status(400).json({ message: 'Invalid discussion ID' });
    }
    // Find distinct senderIds from messages in the discussion, including all senders
    const userIds = await Message.distinct('senderId', { discussionId });
    // Also include the discussion creator user id
    const discussion = await Discussion.findById(discussionId).select('user').exec();
    if (discussion && discussion.user) {
      userIds.push(discussion.user.toString());
    }
    // Remove duplicates
    const uniqueUserIds = [...new Set(userIds)];
    const users = await User.find({ _id: { $in: uniqueUserIds } }).select('name profilePicture').exec();
    res.json(users);
  } catch (err) {
    return handleError(res, err, 'Error fetching users in discussion');
  }
};

// Post a new message to a discussion
exports.postMessageToDiscussion = async (req, res) => {
  try {
    const discussionId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(discussionId)) {
      return res.status(400).json({ message: 'Invalid discussion ID' });
    }
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: User ID missing' });
    }

    let { text, type } = req.body;
    let imageUrl = null;

    if (type === 'image' && req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    if (!text && !imageUrl) {
      return res.status(400).json({ message: 'Message text or image is required' });
    }

    const newMessage = new Message({
      discussionId,
      senderId: userId,
      text: text || '',
      type: type || 'text',
      imageUrl,
    });

    await newMessage.save();

    const io = req.app.get('io');
    io.emit('messageCreated', newMessage);

    res.status(201).json({ message: 'Message sent successfully', newMessage });
  } catch (err) {
    return handleError(res, err, 'Error posting message to discussion');
  }
};
