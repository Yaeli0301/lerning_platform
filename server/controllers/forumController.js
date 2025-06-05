const Discussion = require('../models/Discussion');
const Comment = require('../models/Comment');
const Joi = require('joi');

// Validation schemas
const discussionSchema = Joi.object({
  title: Joi.string().required(),
  course: Joi.string().required(),
  lesson: Joi.string().required(),
});

const Lesson = require('../models/Lesson');
const Course = require('../models/Course');

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

// Helper function for error response
const handleError = (res, err, message = 'שגיאה בשרת', code = 500) => {
  console.error(message, err);
  return res.status(code).json({ message, error: err.message });
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

const commentSchema = Joi.object({
  content: Joi.string().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  discussionId: Joi.string().required(),
  lessonId: Joi.string().optional(),
});

const mongoose = require('mongoose');

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

    const newComment = new Comment({
      user: userId,
      lesson: value.lessonId || null,
      content: value.content,
      rating: value.rating,
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
    const deletedComment = await Comment.findByIdAndDelete(req.params.id);
    if (!deletedComment) return res.status(404).json({ message: 'תגובה לא נמצאה' });

    await Discussion.updateMany(
      { responses: req.params.id },
      { $pull: { responses: req.params.id } }
    );

    const io = req.app.get('io');
    io.emit('commentDeleted', { commentId: req.params.id });

    res.json({ message: 'תגובה נמחקה בהצלחה' });
  } catch (err) {
    return handleError(res, err, 'Error deleting comment');
  }
};

exports.getCommentsByCourseId = async (req, res) => {
  try {
    const courseId = req.query.courseId;
    if (!courseId) return res.status(400).json({ message: 'Missing courseId query parameter' });

    const discussions = await Discussion.find({ course: courseId }).select('_id').exec();
    const discussionIds = discussions.map(d => d._id);

    const comments = await Comment.find({
      $or: [
        { discussion: { $in: discussionIds } },
        { course: courseId }
      ]
    }).populate('user', 'name').exec();

    res.json(comments);
  } catch (err) {
    return handleError(res, err, 'Error fetching comments by courseId');
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
    const { blocked } = req.body;
    if (typeof blocked !== 'boolean') {
      return res.status(400).json({ message: 'Invalid blocked value' });
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    // Only admin can block comments
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Not authorized to block comments' });
    }
    comment.isBlocked = blocked;
    await comment.save();

    const io = req.app.get('io');
    io.emit('commentBlocked', { commentId, blocked });

    res.json({ message: `Comment ${blocked ? 'blocked' : 'unblocked'} successfully`, comment });
  } catch (err) {
    return handleError(res, err, 'Error blocking/unblocking comment');
  }
};
