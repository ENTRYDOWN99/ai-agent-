const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Note = require('../models/Note');
const { auth } = require('../middleware/auth');

router.use(auth);

// @route   GET /api/notes
router.get('/', async (req, res) => {
  try {
    if (req.user.isGuest) {
      return res.json({ notes: [], total: 0, page: 1, pages: 0 });
    }

    const { category, search, pinned, sort, page = 1, limit = 20 } = req.query;
    
    let query = { userId: req.user.id };

    if (category) query.category = category;
    if (pinned !== undefined) query.isPinned = pinned === 'true';
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    let sortOption = { isPinned: -1, updatedAt: -1 };
    if (sort === 'title') sortOption = { title: 1 };
    if (sort === 'created') sortOption = { createdAt: -1 };

    const notes = await Note.find(query)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Note.countDocuments(query);

    res.json({ notes, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notes' });
  }
});

// @route   GET /api/notes/:id
router.get('/:id', async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user.id });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json(note);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching note' });
  }
});

// @route   POST /api/notes
router.post('/', [
  body('title').trim().notEmpty().withMessage('Title is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const note = new Note({ ...req.body, userId: req.user.id });
    await note.save();
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ message: 'Error creating note' });
  }
});

// @route   PUT /api/notes/:id
router.put('/:id', async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { ...req.body },
      { new: true, runValidators: true }
    );
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json(note);
  } catch (error) {
    res.status(500).json({ message: 'Error updating note' });
  }
});

// @route   DELETE /api/notes/:id
router.delete('/:id', async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting note' });
  }
});

// @route   PATCH /api/notes/:id/pin
router.patch('/:id/pin', async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user.id });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    
    note.isPinned = !note.isPinned;
    await note.save();
    res.json(note);
  } catch (error) {
    res.status(500).json({ message: 'Error toggling pin' });
  }
});

module.exports = router;
