const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
  content: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  images: [{ type: String }],
  isBlocked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

commentSchema.index({ lesson: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
