const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const { auth } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// @route   GET /api/tasks/stats/summary
// @desc    Get task statistics (MUST be before /:id to avoid route conflict)
router.get('/stats/summary', async (req, res) => {
  try {
    // Guest users have no DB data
    if (req.user.isGuest) {
      return res.json({ statusStats: [], priorityStats: [] });
    }

    const stats = await Task.aggregate([
      { $match: { userId: req.user.id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const priorityStats = await Task.aggregate([
      { $match: { userId: req.user.id } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    res.json({ statusStats: stats, priorityStats });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

// @route   GET /api/tasks
// @desc    Get all tasks for user (with filters)
router.get('/', async (req, res) => {
  try {
    // Guest users have no DB data
    if (req.user.isGuest) {
      return res.json({ tasks: [], total: 0, page: 1, pages: 0 });
    }

    const { status, priority, category, search, sort, page = 1, limit = 20 } = req.query;
    
    let query = { userId: req.user.id };

    // Filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Sort options
    let sortOption = { createdAt: -1 };
    if (sort === 'priority') sortOption = { priority: -1 };
    if (sort === 'dueDate') sortOption = { dueDate: 1 };
    if (sort === 'title') sortOption = { title: 1 };

    const tasks = await Task.find(query)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(query);

    res.json({
      tasks,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks' });
  }
});

// @route   GET /api/tasks/:id
// @desc    Get single task
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user.id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching task' });
  }
});

// @route   POST /api/tasks
// @desc    Create a task
router.post('/', [
  body('title').trim().notEmpty().withMessage('Title is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const task = new Task({
      ...req.body,
      userId: req.user.id
    });
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Error creating task' });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update a task
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { ...req.body },
      { new: true, runValidators: true }
    );
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Error updating task' });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting task' });
  }
});

module.exports = router;
