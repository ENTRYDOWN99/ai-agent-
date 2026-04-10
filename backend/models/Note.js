const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Note title is required'],
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    default: '',
    maxlength: 10000
  },
  category: {
    type: String,
    default: 'general',
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPinned: {
    type: Boolean,
    default: false
  },
  color: {
    type: String,
    default: '#fbbf24'
  },
  createdBy: {
    type: String,
    enum: ['user', 'agent'],
    default: 'user'
  }
}, {
  timestamps: true
});

noteSchema.index({ title: 'text', content: 'text' });
noteSchema.index({ userId: 1, isPinned: -1 });

module.exports = mongoose.model('Note', noteSchema);
