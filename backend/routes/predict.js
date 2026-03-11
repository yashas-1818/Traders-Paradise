const express = require('express');
const router = express.Router();

router.post('/sentiment', async (req, res) => {
  try {
    const { symbol, headlines } = req.body;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Analyze these news headlines for ${symbol} stock and give a sentiment score.

Headlines:
${headlines.join('\n')}

Respond in this exact JSON format only, no other text:
{
  "score": <number 0-100, where 0=very bearish, 50=neutral, 100=very bullish>,
  "label": "<Bullish|Bearish|Neutral>",
  "summary": "<2 sentence analysis>"
}`
        }]
      })
    });

    const data = await response.json();
    const text = data.content[0].text;
    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;