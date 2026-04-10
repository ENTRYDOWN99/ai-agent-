/**
 * MCP Tool Definitions
 * Registers all available tools into the MCP registry
 */

const registry = require('./registry');
const Task = require('../models/Task');
const Event = require('../models/Event');
const Note = require('../models/Note');

function registerAllTools() {
  // ========== TASK TOOLS ==========
  
  registry.registerTool('task.create', {
    description: 'Create a new task',
    parameters: {
      title: 'string (required)',
      description: 'string',
      priority: 'low|medium|high|urgent',
      status: 'todo|in-progress|done',
      category: 'string',
      dueDate: 'ISO date string',
      tags: 'array of strings'
    }
  }, async (params, context) => {
    const task = new Task({
      ...params,
      userId: context.userId,
      createdBy: 'agent'
    });
    await task.save();
    return task;
  });

  registry.registerTool('task.list', {
    description: 'List tasks with optional filters',
    parameters: {
      status: 'todo|in-progress|done',
      priority: 'low|medium|high|urgent',
      limit: 'number'
    }
  }, async (params, context) => {
    let query = { userId: context.userId };
    if (params.status) query.status = params.status;
    if (params.priority) query.priority = params.priority;
    
    const tasks = await Task.find(query)
      .sort({ createdAt: -1 })
      .limit(params.limit || 10);
    return tasks;
  });

  registry.registerTool('task.update', {
    description: 'Update an existing task',
    parameters: {
      taskId: 'string (required)',
      updates: 'object with fields to update'
    }
  }, async (params, context) => {
    const task = await Task.findOneAndUpdate(
      { _id: params.taskId, userId: context.userId },
      params.updates,
      { new: true }
    );
    if (!task) throw new Error('Task not found');
    return task;
  });

  registry.registerTool('task.delete', {
    description: 'Delete a task',
    parameters: { taskId: 'string (required)' }
  }, async (params, context) => {
    const task = await Task.findOneAndDelete({
      _id: params.taskId,
      userId: context.userId
    });
    if (!task) throw new Error('Task not found');
    return { deleted: true, taskId: params.taskId };
  });

  registry.registerTool('task.stats', {
    description: 'Get task statistics for the user',
    parameters: {}
  }, async (params, context) => {
    const total = await Task.countDocuments({ userId: context.userId });
    const todo = await Task.countDocuments({ userId: context.userId, status: 'todo' });
    const inProgress = await Task.countDocuments({ userId: context.userId, status: 'in-progress' });
    const done = await Task.countDocuments({ userId: context.userId, status: 'done' });
    const urgent = await Task.countDocuments({ userId: context.userId, priority: 'urgent' });
    
    return { total, todo, inProgress, done, urgent };
  });

  // ========== CALENDAR TOOLS ==========

  registry.registerTool('calendar.create', {
    description: 'Create a new calendar event',
    parameters: {
      title: 'string (required)',
      startTime: 'ISO date string (required)',
      endTime: 'ISO date string (required)',
      description: 'string',
      location: 'string',
      type: 'meeting|reminder|deadline|personal'
    }
  }, async (params, context) => {
    const event = new Event({
      ...params,
      userId: context.userId,
      createdBy: 'agent'
    });
    await event.save();
    return event;
  });

  registry.registerTool('calendar.list', {
    description: 'List calendar events',
    parameters: {
      startDate: 'ISO date string',
      endDate: 'ISO date string',
      type: 'string'
    }
  }, async (params, context) => {
    let query = { userId: context.userId };
    if (params.startDate || params.endDate) {
      query.startTime = {};
      if (params.startDate) query.startTime.$gte = new Date(params.startDate);
      if (params.endDate) query.startTime.$lte = new Date(params.endDate);
    }
    if (params.type) query.type = params.type;

    const events = await Event.find(query).sort({ startTime: 1 }).limit(20);
    return events;
  });

  registry.registerTool('calendar.today', {
    description: 'Get today\'s events',
    parameters: {}
  }, async (params, context) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const events = await Event.find({
      userId: context.userId,
      startTime: { $gte: today, $lt: tomorrow }
    }).sort({ startTime: 1 });
    return events;
  });

  registry.registerTool('calendar.upcoming', {
    description: 'Get upcoming events in the next N days',
    parameters: { days: 'number (default: 7)' }
  }, async (params, context) => {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + (params.days || 7));

    const events = await Event.find({
      userId: context.userId,
      startTime: { $gte: now, $lte: future }
    }).sort({ startTime: 1 });
    return events;
  });

  registry.registerTool('calendar.delete', {
    description: 'Delete a calendar event',
    parameters: { eventId: 'string (required)' }
  }, async (params, context) => {
    const event = await Event.findOneAndDelete({
      _id: params.eventId,
      userId: context.userId
    });
    if (!event) throw new Error('Event not found');
    return { deleted: true, eventId: params.eventId };
  });

  // ========== NOTES TOOLS ==========

  registry.registerTool('notes.create', {
    description: 'Create a new note',
    parameters: {
      title: 'string (required)',
      content: 'string',
      category: 'string',
      tags: 'array of strings',
      isPinned: 'boolean'
    }
  }, async (params, context) => {
    const note = new Note({
      ...params,
      userId: context.userId,
      createdBy: 'agent'
    });
    await note.save();
    return note;
  });

  registry.registerTool('notes.list', {
    description: 'List notes',
    parameters: {
      category: 'string',
      search: 'string',
      pinned: 'boolean'
    }
  }, async (params, context) => {
    let query = { userId: context.userId };
    if (params.category) query.category = params.category;
    if (params.pinned !== undefined) query.isPinned = params.pinned;
    if (params.search) {
      query.$or = [
        { title: { $regex: params.search, $options: 'i' } },
        { content: { $regex: params.search, $options: 'i' } }
      ];
    }

    const notes = await Note.find(query)
      .sort({ isPinned: -1, updatedAt: -1 })
      .limit(20);
    return notes;
  });

  registry.registerTool('notes.search', {
    description: 'Search through notes by keyword',
    parameters: { keyword: 'string (required)' }
  }, async (params, context) => {
    const notes = await Note.find({
      userId: context.userId,
      $or: [
        { title: { $regex: params.keyword, $options: 'i' } },
        { content: { $regex: params.keyword, $options: 'i' } },
        { tags: { $in: [new RegExp(params.keyword, 'i')] } }
      ]
    }).sort({ updatedAt: -1 }).limit(10);
    return notes;
  });

  registry.registerTool('notes.delete', {
    description: 'Delete a note',
    parameters: { noteId: 'string (required)' }
  }, async (params, context) => {
    const note = await Note.findOneAndDelete({
      _id: params.noteId,
      userId: context.userId
    });
    if (!note) throw new Error('Note not found');
    return { deleted: true, noteId: params.noteId };
  });

  console.log(`📋 Total MCP Tools Registered: ${registry.getToolSchemas().length}`);
}

module.exports = { registerAllTools };
