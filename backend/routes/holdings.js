const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Holding = require('../models/Holding');

// All routes require authentication
router.use(auth);

// ── Get all holdings for the current user ────────────
router.get('/', async (req, res) => {
  try {
    const holdings = await Holding.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(holdings);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── Add a new holding ────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { symbol, shares, avgBuyPrice } = req.body;

    if (!symbol || shares == null || avgBuyPrice == null) {
      return res.status(400).json({ message: 'symbol, shares, and avgBuyPrice are required' });
    }

    const holding = new Holding({
      userId: req.user.id,
      symbol,
      shares,
      avgBuyPrice,
    });
    await holding.save();

    res.status(201).json(holding);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── Delete a holding ─────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const holding = await Holding.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!holding) {
      return res.status(404).json({ message: 'Holding not found' });
    }

    res.json({ message: 'Holding deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
