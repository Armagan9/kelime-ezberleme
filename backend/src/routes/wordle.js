const express = require('express');
const db = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

// In-memory Wordle sessions: userId -> { word, attempts, finished }
const sessions = new Map();

router.post('/start', auth, (req, res) => {
  const userId = req.user.userId;

  // Prefer learned words (review or mastered), fallback to all
  let word = db.prepare(`
    SELECT w.EngWordName FROM Words w
    JOIN UserWordProgress uwp ON uwp.WordID = w.WordID
    WHERE uwp.UserID = ? AND uwp.Status IN ('review','mastered')
      AND LENGTH(w.EngWordName) BETWEEN 4 AND 8
    ORDER BY RANDOM() LIMIT 1
  `).get(userId);

  if (!word) {
    word = db.prepare(
      "SELECT EngWordName FROM Words WHERE LENGTH(EngWordName) BETWEEN 4 AND 8 ORDER BY RANDOM() LIMIT 1"
    ).get();
  }

  if (!word) return res.status(400).json({ error: 'Uygun kelime bulunamadı (4-8 harf)' });

  const target = word.EngWordName.toUpperCase();
  sessions.set(userId, { word: target, attempts: 0, guesses: [], finished: false });

  res.json({ wordLength: target.length, maxAttempts: 6 });
});

router.post('/guess', auth, (req, res) => {
  const userId = req.user.userId;
  const { guess } = req.body;
  const session = sessions.get(userId);

  if (!session) return res.status(400).json({ error: 'Önce oyunu başlatın' });
  if (session.finished) return res.status(400).json({ error: 'Oyun bitti' });

  const target = session.word;
  const guessUpper = guess.toUpperCase().trim();

  if (guessUpper.length !== target.length) {
    return res.status(400).json({ error: `Tahmin ${target.length} harf olmalı` });
  }

  // Build color feedback
  const feedback = Array(target.length).fill('absent');
  const targetArr = target.split('');
  const guessArr = guessUpper.split('');
  const used = Array(target.length).fill(false);

  // First pass: correct positions
  for (let i = 0; i < target.length; i++) {
    if (guessArr[i] === targetArr[i]) {
      feedback[i] = 'correct';
      used[i] = true;
      guessArr[i] = null;
    }
  }

  // Second pass: present but wrong position
  for (let i = 0; i < target.length; i++) {
    if (guessArr[i] === null) continue;
    const idx = targetArr.findIndex((c, j) => !used[j] && c === guessArr[i]);
    if (idx !== -1) {
      feedback[i] = 'present';
      used[idx] = true;
    }
  }

  session.attempts++;
  session.guesses.push({ guess: guessUpper, feedback });

  const won = feedback.every(f => f === 'correct');
  const lost = session.attempts >= 6 && !won;
  session.finished = won || lost;

  res.json({
    feedback,
    attempts: session.attempts,
    finished: session.finished,
    won,
    word: session.finished ? target : undefined
  });
});

router.get('/status', auth, (req, res) => {
  const session = sessions.get(req.user.userId);
  if (!session) return res.json({ active: false });
  res.json({
    active: !session.finished,
    attempts: session.attempts,
    guesses: session.guesses,
    wordLength: session.word.length
  });
});

module.exports = router;
