const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profession: { type: String, default: 'Other' },
  annualIncome: { type: String, default: 'Prefer not to say' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);