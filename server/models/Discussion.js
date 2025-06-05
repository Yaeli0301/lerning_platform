const mongoose = require('mongoose');

const discussionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
  title: { type: String, required: true },
  creatorUsername: { type: String, required: true },
  content: { type: String, required: false },
  images: [{ type: String }],
  responses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  isBlocked: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Discussion', discussionSchema);
