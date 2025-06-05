const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: String, required: true },
});

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  videoUrl: { type: String, required: true },
  imageUrl: { type: String },
  quiz: [quizSchema],
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
}, { timestamps: true });

module.exports = mongoose.model('Lesson', lessonSchema);
