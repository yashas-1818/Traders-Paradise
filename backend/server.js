require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// Yahoo Finance proxy
app.use('/yahoo-finance', async (req, res) => {
  try {
    const targetPath = req.url;
    const url = `https://query1.finance.yahoo.com/v8/finance${targetPath}`;
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Yahoo Finance fetch failed' });
  }
});

app.get('/', (req, res) => res.json({ message: 'Traders Paradise API running!' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/predict', require('./routes/predict'));
app.use('/api/holdings', require('./routes/holdings'));
app.use('/api/admin', require('./routes/admin'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('🚀 Server running on port ' + PORT));