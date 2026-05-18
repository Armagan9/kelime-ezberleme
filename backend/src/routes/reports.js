const express = require('express');
const db = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/summary', auth, (req, res) => {
  const userId = req.user.userId;

  const progress = db.prepare(`
    SELECT
      COUNT(*) as totalWords,
      SUM(CASE WHEN Status = 'active' THEN 1 ELSE 0 END) as activeWords,
      SUM(CASE WHEN Status = 'review' THEN 1 ELSE 0 END) as reviewWords,
      SUM(CASE WHEN Status = 'mastered' THEN 1 ELSE 0 END) as masteredWords
    FROM UserWordProgress WHERE UserID = ?
  `).get(userId);

  const quizStats = db.prepare(`
    SELECT
      COUNT(*) as totalAnswers,
      SUM(IsCorrect) as correctAnswers,
      COUNT(DISTINCT QuizDate) as activeDays
    FROM QuizHistory WHERE UserID = ?
  `).get(userId);

  const totalWords = db.prepare('SELECT COUNT(*) as cnt FROM Words').get().cnt;

  res.json({
    ...progress,
    totalWordsInSystem: totalWords,
    ...quizStats,
    successRate: quizStats.totalAnswers > 0
      ? Math.round((quizStats.correctAnswers / quizStats.totalAnswers) * 100)
      : 0
  });
});

router.get('/daily', auth, (req, res) => {
  const daily = db.prepare(`
    SELECT
      QuizDate,
      COUNT(*) as total,
      SUM(IsCorrect) as correct
    FROM QuizHistory WHERE UserID = ?
    GROUP BY QuizDate
    ORDER BY QuizDate DESC
    LIMIT 30
  `).all(req.user.userId);

  res.json(daily.map(d => ({
    ...d,
    successRate: d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0
  })));
});

router.get('/words', auth, (req, res) => {
  const wordProgress = db.prepare(`
    SELECT
      w.WordID, w.EngWordName, w.TurWordName,
      uwp.Status, uwp.ConsecutiveCorrect, uwp.ReviewLevel,
      uwp.AddedDate, uwp.LastReviewedDate, uwp.NextReviewDate,
      COUNT(qh.HistoryID) as totalAttempts,
      SUM(qh.IsCorrect) as correctAttempts
    FROM UserWordProgress uwp
    JOIN Words w ON w.WordID = uwp.WordID
    LEFT JOIN QuizHistory qh ON qh.WordID = uwp.WordID AND qh.UserID = uwp.UserID
    WHERE uwp.UserID = ?
    GROUP BY uwp.WordID
    ORDER BY uwp.LastReviewedDate DESC
  `).all(req.user.userId);

  res.json(wordProgress.map(w => ({
    ...w,
    successRate: w.totalAttempts > 0
      ? Math.round((w.correctAttempts / w.totalAttempts) * 100)
      : 0
  })));
});

module.exports = router;
