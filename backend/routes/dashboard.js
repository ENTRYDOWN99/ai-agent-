const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Task = require('../models/Task');
const Event = require('../models/Event');
const Note = require('../models/Note');
const AgentLog = require('../models/AgentLog');

router.use(auth);

// @route   GET /api/dashboard/summary
// @desc    Get dashboard summary data
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user.id;

    // Guest users have no DB data — return empty dashboard
    if (req.user.isGuest) {
      return res.json({
        stats: {
          tasks: { total: 0, todo: 0, inProgress: 0, done: 0, urgent: 0 },
          events: { total: 0, today: 0 },
          notes: { total: 0, pinned: 0 }
        },
        recentTasks: [],
        todayEvents: [],
        upcomingEvents: [],
        recentNotes: [],
        pinnedNotes: [],
        recentLogs: [],
        tasksDueSoon: []
      });
    }

    // Task stats
    const totalTasks = await Task.countDocuments({ userId });
    const todoTasks = await Task.countDocuments({ userId, status: 'todo' });
    const inProgressTasks = await Task.countDocuments({ userId, status: 'in-progress' });
    const doneTasks = await Task.countDocuments({ userId, status: 'done' });
    const urgentTasks = await Task.countDocuments({ userId, priority: 'urgent' });

    // Recent tasks
    const recentTasks = await Task.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5);

    // Today's events
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayEvents = await Event.find({
      userId,
      startTime: { $gte: today, $lt: tomorrow }
    }).sort({ startTime: 1 });

    // Upcoming events (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const upcomingEvents = await Event.find({
      userId,
      startTime: { $gte: new Date(), $lte: nextWeek }
    }).sort({ startTime: 1 }).limit(5);

    // Total events and notes
    const totalEvents = await Event.countDocuments({ userId });
    const totalNotes = await Note.countDocuments({ userId });

    // Recent notes
    const recentNotes = await Note.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(5);

    // Pinned notes
    const pinnedNotes = await Note.find({ userId, isPinned: true })
      .sort({ updatedAt: -1 })
      .limit(3);

    // Recent agent activity
    const recentLogs = await AgentLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);

    // Tasks due soon (next 3 days)
    const threeDays = new Date();
    threeDays.setDate(threeDays.getDate() + 3);
    const tasksDueSoon = await Task.find({
      userId,
      status: { $ne: 'done' },
      dueDate: { $lte: threeDays, $gte: new Date() }
    }).sort({ dueDate: 1 });

    res.json({
      stats: {
        tasks: { total: totalTasks, todo: todoTasks, inProgress: inProgressTasks, done: doneTasks, urgent: urgentTasks },
        events: { total: totalEvents, today: todayEvents.length },
        notes: { total: totalNotes, pinned: pinnedNotes.length }
      },
      recentTasks,
      todayEvents,
      upcomingEvents,
      recentNotes,
      pinnedNotes,
      recentLogs,
      tasksDueSoon
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
});

module.exports = router;
