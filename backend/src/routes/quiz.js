const express = require('express');
const db = require('../config/db');
const auth = require('../middleware/auth');
const { processAnswer, getDailyQuizWords, getWrongOptions } = require('../services/spaced-repetition');

const router = express.Router();

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildQuestion(word, wrongOptions) {
  const type = Math.random() > 0.5 ? 'eng_to_tur' : 'tur_to_eng';
  const correct = type === 'eng_to_tur'
    ? { id: word.WordID, text: word.TurWordName }
    : { id: word.WordID, text: word.EngWordName };

  const wrongs = wrongOptions.map(w => ({
    id: w.WordID,
    text: type === 'eng_to_tur' ? w.TurWordName : w.EngWordName
  }));

  const options = shuffle([{ ...correct, isCorrect: true }, ...wrongs.map(w => ({ ...w, isCorrect: false }))]);

  return {
    wordId: word.WordID,
    questionType: type,
    question: type === 'eng_to_tur' ? word.EngWordName : word.TurWordName,
    picture: word.Picture,
    status: word.Status,
    consecutiveCorrect: word.ConsecutiveCorrect,
    reviewLevel: word.ReviewLevel,
    options
  };
}

router.get('/today', auth, (req, res) => {
  const totalWords = db.prepare('SELECT COUNT(*) as cnt FROM Words').get().cnt;
  if (totalWords < 4) {
    return res.status(400).json({ error: 'Quiz için en az 4 kelime gereklidir' });
  }

  const { reviewWords, activeWords, newWords } = getDailyQuizWords(db, req.user.userId);
  const allWords = [...reviewWords, ...activeWords, ...newWords];

  const questions = allWords.map(word => {
    const wrong = getWrongOptions(db, word.WordID, 3);
    return buildQuestion(word, wrong);
  });

  res.json({ questions, total: questions.length });
});

router.post('/answer', auth, (req, res) => {
  const { wordId, isCorrect } = req.body;
  if (wordId === undefined || isCorrect === undefined) {
    return res.status(400).json({ error: 'wordId ve isCorrect zorunludur' });
  }

  const progress = processAnswer(db, req.user.userId, wordId, !!isCorrect);
  if (!progress) return res.status(404).json({ error: 'Kelime bulunamadı' });

  res.json({ progress });
});

router.get('/progress', auth, (req, res) => {
  const summary = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN Status = 'active' THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN Status = 'review' THEN 1 ELSE 0 END) as review,
      SUM(CASE WHEN Status = 'mastered' THEN 1 ELSE 0 END) as mastered
    FROM UserWordProgress WHERE UserID = ?
  `).get(req.user.userId);

  res.json(summary);
});

module.exports = router;
