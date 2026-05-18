const express = require('express');
const db = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, (req, res) => {
  const settings = db.prepare('SELECT * FROM UserSettings WHERE UserID = ?').get(req.user.userId);
  res.json(settings || { DailyNewWords: 10 });
});

router.put('/', auth, (req, res) => {
  const { dailyNewWords } = req.body;
  if (!dailyNewWords || dailyNewWords < 1 || dailyNewWords > 100) {
    return res.status(400).json({ error: 'Günlük kelime sayısı 1-100 arasında olmalıdır' });
  }
  db.prepare(
    'INSERT OR REPLACE INTO UserSettings (UserID, DailyNewWords) VALUES (?, ?)'
  ).run(req.user.userId, dailyNewWords);
  res.json({ message: 'Ayarlar güncellendi', dailyNewWords });
});

module.exports = router;
