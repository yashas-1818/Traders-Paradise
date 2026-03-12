const express = require('express');
const router = express.Router();
const User = require('../models/User');

const ADMIN_SECRET = 'tradersparadise_admin_2026';

const adminAuth = (req, res, next) => {
  const key = req.headers['x-admin-key'];
  if (key !== ADMIN_SECRET) return res.status(401).json({ message: 'Unauthorized' });
  next();
};

router.get('/stats', adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    const totalUsers = users.length;

    const professionMap = {};
    users.forEach(u => {
      const p = u.profession || 'Other';
      professionMap[p] = (professionMap[p] || 0) + 1;
    });

    const incomeMap = {};
    users.forEach(u => {
      const i = u.annualIncome || 'Prefer not to say';
      incomeMap[i] = (incomeMap[i] || 0) + 1;
    });

    res.json({ totalUsers, users, professionBreakdown: professionMap, incomeBreakdown: incomeMap });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;