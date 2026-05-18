// Node.js 22.5+ built-in SQLite — no native compilation needed
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../../data/kelime.db');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS Users (
    UserID INTEGER PRIMARY KEY AUTOINCREMENT,
    UserName TEXT NOT NULL UNIQUE,
    Email TEXT NOT NULL UNIQUE,
    Password TEXT NOT NULL,
    ResetToken TEXT,
    ResetTokenExpiry INTEGER,
    CreatedAt INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS Words (
    WordID INTEGER PRIMARY KEY AUTOINCREMENT,
    EngWordName TEXT NOT NULL,
    TurWordName TEXT NOT NULL,
    Picture TEXT,
    AudioPath TEXT,
    CreatedBy INTEGER,
    CreatedAt INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserID)
  );

  CREATE TABLE IF NOT EXISTS WordSamples (
    WordSamplesID INTEGER PRIMARY KEY AUTOINCREMENT,
    WordID INTEGER NOT NULL,
    Sample TEXT NOT NULL,
    FOREIGN KEY (WordID) REFERENCES Words(WordID) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS UserSettings (
    SettingsID INTEGER PRIMARY KEY AUTOINCREMENT,
    UserID INTEGER NOT NULL UNIQUE,
    DailyNewWords INTEGER DEFAULT 10,
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
  );

  CREATE TABLE IF NOT EXISTS UserWordProgress (
    ProgressID INTEGER PRIMARY KEY AUTOINCREMENT,
    UserID INTEGER NOT NULL,
    WordID INTEGER NOT NULL,
    Status TEXT DEFAULT 'active',
    ConsecutiveCorrect INTEGER DEFAULT 0,
    ReviewLevel INTEGER DEFAULT 0,
    NextReviewDate TEXT,
    LastReviewedDate TEXT,
    AddedDate TEXT DEFAULT (date('now')),
    UNIQUE(UserID, WordID),
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (WordID) REFERENCES Words(WordID)
  );

  CREATE TABLE IF NOT EXISTS QuizHistory (
    HistoryID INTEGER PRIMARY KEY AUTOINCREMENT,
    UserID INTEGER NOT NULL,
    WordID INTEGER NOT NULL,
    IsCorrect INTEGER NOT NULL,
    QuizDate TEXT DEFAULT (date('now')),
    QuizDateTime INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (WordID) REFERENCES Words(WordID)
  );

  CREATE TABLE IF NOT EXISTS WordChainStories (
    StoryID INTEGER PRIMARY KEY AUTOINCREMENT,
    UserID INTEGER NOT NULL,
    WordIds TEXT NOT NULL,
    Words TEXT NOT NULL,
    Story TEXT NOT NULL,
    ImageDescription TEXT,
    CreatedAt INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
  );
`);

module.exports = db;
