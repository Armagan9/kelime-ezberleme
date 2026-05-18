const REVIEW_INTERVALS_DAYS = [0, 1, 7, 30, 90, 180, 365];

function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function processAnswer(db, userId, wordId, isCorrect) {
  const progress = db.prepare(
    'SELECT * FROM UserWordProgress WHERE UserID = ? AND WordID = ?'
  ).get(userId, wordId);

  if (!progress) return null;

  let newStatus = progress.Status;
  let newConsecutive = progress.ConsecutiveCorrect;
  let newReviewLevel = progress.ReviewLevel;
  let nextReviewDate = progress.NextReviewDate;

  if (isCorrect) {
    if (progress.Status === 'active') {
      newConsecutive = progress.ConsecutiveCorrect + 1;
      if (newConsecutive >= 6) {
        newStatus = 'review';
        newReviewLevel = 1;
        newConsecutive = 0;
        nextReviewDate = addDays(REVIEW_INTERVALS_DAYS[1]);
      }
    } else if (progress.Status === 'review') {
      newReviewLevel = progress.ReviewLevel + 1;
      if (newReviewLevel > 6) {
        newStatus = 'mastered';
        nextReviewDate = null;
      } else {
        nextReviewDate = addDays(REVIEW_INTERVALS_DAYS[newReviewLevel]);
      }
    }
  } else {
    newStatus = 'active';
    newConsecutive = 0;
    newReviewLevel = 0;
    nextReviewDate = null;
  }

  db.prepare(`
    UPDATE UserWordProgress
    SET Status = ?, ConsecutiveCorrect = ?, ReviewLevel = ?,
        NextReviewDate = ?, LastReviewedDate = date('now')
    WHERE UserID = ? AND WordID = ?
  `).run(newStatus, newConsecutive, newReviewLevel, nextReviewDate, userId, wordId);

  db.prepare(
    'INSERT INTO QuizHistory (UserID, WordID, IsCorrect) VALUES (?, ?, ?)'
  ).run(userId, wordId, isCorrect ? 1 : 0);

  return { status: newStatus, consecutiveCorrect: newConsecutive, reviewLevel: newReviewLevel };
}

function getDailyQuizWords(db, userId) {
  const today = new Date().toISOString().split('T')[0];

  const reviewWords = db.prepare(`
    SELECT w.*, uwp.Status, uwp.ConsecutiveCorrect, uwp.ReviewLevel, uwp.NextReviewDate
    FROM UserWordProgress uwp
    JOIN Words w ON w.WordID = uwp.WordID
    WHERE uwp.UserID = ? AND uwp.Status = 'review' AND uwp.NextReviewDate <= ?
  `).all(userId, today);

  const activeWords = db.prepare(`
    SELECT w.*, uwp.Status, uwp.ConsecutiveCorrect, uwp.ReviewLevel, uwp.NextReviewDate
    FROM UserWordProgress uwp
    JOIN Words w ON w.WordID = uwp.WordID
    WHERE uwp.UserID = ? AND uwp.Status = 'active'
  `).all(userId);

  const settings = db.prepare('SELECT DailyNewWords FROM UserSettings WHERE UserID = ?').get(userId);
  const dailyLimit = settings?.DailyNewWords ?? 10;

  const addedToday = db.prepare(
    'SELECT COUNT(*) as cnt FROM UserWordProgress WHERE UserID = ? AND AddedDate = ?'
  ).get(userId, today)?.cnt ?? 0;

  const needed = Math.max(0, dailyLimit - addedToday);

  const newWords = db.prepare(`
    SELECT w.* FROM Words w
    WHERE w.WordID NOT IN (SELECT WordID FROM UserWordProgress WHERE UserID = ?)
    ORDER BY w.WordID ASC LIMIT ?
  `).all(userId, needed);

  const insertProgress = db.prepare(
    'INSERT OR IGNORE INTO UserWordProgress (UserID, WordID, Status, AddedDate) VALUES (?, ?, ?, ?)'
  );
  for (const word of newWords) {
    insertProgress.run(userId, word.WordID, 'active', today);
  }

  return { reviewWords, activeWords, newWords };
}

function getWrongOptions(db, wordId, count = 3) {
  return db.prepare(
    'SELECT WordID, EngWordName, TurWordName FROM Words WHERE WordID != ? ORDER BY RANDOM() LIMIT ?'
  ).all(wordId, count);
}

module.exports = { processAnswer, getDailyQuizWords, getWrongOptions };
