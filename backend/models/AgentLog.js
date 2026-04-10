const mongoose = require('mongoose');

const agentLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  agentName: {
    type: String,
    required: true,
    enum: ['orchestrator', 'task-agent', 'calendar-agent', 'notes-agent']
  },
  action: {
    type: String,
    required: true,
    trim: true
  },
  input: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  output: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ['success', 'error', 'pending', 'running'],
    default: 'pending'
  },
  workflowId: {
    type: String,
    default: null
  },
  duration: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

agentLogSchema.index({ userId: 1, createdAt: -1 });
agentLogSchema.index({ workflowId: 1 });

module.exports = mongoose.model('AgentLog', agentLogSchema);
