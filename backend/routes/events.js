const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Event = require('../models/Event');
const { auth } = require('../middleware/auth');

router.use(auth);

// @route   GET /api/events/upcoming/today (MUST be before /:id)
router.get('/upcoming/today', async (req, res) => {
  try {
    if (req.user.isGuest) return res.json([]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const events = await Event.find({
      userId: req.user.id,
      startTime: { $gte: today, $lt: tomorrow }
    }).sort({ startTime: 1 });

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching today events' });
  }
});

// @route   GET /api/events
// @desc    Get all events for user
router.get('/', async (req, res) => {
  try {
    if (req.user.isGuest) {
      return res.json({ events: [], total: 0, page: 1, pages: 0 });
    }

    const { type, startDate, endDate, search, page = 1, limit = 50 } = req.query;
    
    let query = { userId: req.user.id };

    if (type) query.type = type;
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const events = await Event.find(query)
      .sort({ startTime: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Event.countDocuments(query);

    res.json({ events, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events' });
  }
});

// @route   GET /api/events/:id
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, userId: req.user.id });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching event' });
  }
});

// @route   POST /api/events
router.post('/', [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('startTime').notEmpty().withMessage('Start time is required'),
  body('endTime').notEmpty().withMessage('End time is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const event = new Event({ ...req.body, userId: req.user.id });
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Error creating event' });
  }
});

// @route   PUT /api/events/:id
router.put('/:id', async (req, res) => {
  try {
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { ...req.body },
      { new: true, runValidators: true }
    );
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Error updating event' });
  }
});

// @route   DELETE /api/events/:id
router.delete('/:id', async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting event' });
  }
});

module.exports = router;
