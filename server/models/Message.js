const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  discussionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Discussion', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String },
  type: { type: String, enum: ['text', 'image'], default: 'text' },
  imageUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Message', messageSchema);
