const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    default: '',
    maxlength: 2000
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required']
  },
  location: {
    type: String,
    default: '',
    trim: true
  },
  type: {
    type: String,
    enum: ['meeting', 'reminder', 'deadline', 'personal'],
    default: 'meeting'
  },
  recurring: {
    type: Boolean,
    default: false
  },
  color: {
    type: String,
    default: '#6366f1'
  },
  createdBy: {
    type: String,
    enum: ['user', 'agent'],
    default: 'user'
  }
}, {
  timestamps: true
});

eventSchema.index({ userId: 1, startTime: 1 });
eventSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Event', eventSchema);
