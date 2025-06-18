const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
  category: { type: String, required: true },
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  difficultyLevel: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true },
  rating: { type: Number, default: 0 },
  isBlocked: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  imageUrl: { type: String, default: 'https://example.com/default-course-image.jpg' },
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
