const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

const uploadsDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/jpeg|jpg|png|gif|webp/.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Sadece resim dosyası yüklenebilir'));
  }
});

router.get('/', auth, (req, res) => {
  const words = db.prepare('SELECT * FROM Words ORDER BY CreatedAt DESC').all();
  const samples = db.prepare('SELECT * FROM WordSamples').all();
  const wordMap = words.map(w => ({
    ...w,
    samples: samples.filter(s => s.WordID === w.WordID).map(s => s.Sample)
  }));
  res.json(wordMap);
});

router.get('/:id', auth, (req, res) => {
  const word = db.prepare('SELECT * FROM Words WHERE WordID = ?').get(req.params.id);
  if (!word) return res.status(404).json({ error: 'Kelime bulunamadı' });
  const samples = db.prepare('SELECT * FROM WordSamples WHERE WordID = ?').all(req.params.id);
  res.json({ ...word, samples: samples.map(s => s.Sample) });
});

router.post('/', auth, upload.single('picture'), (req, res) => {
  const { engWordName, turWordName, samples } = req.body;
  if (!engWordName || !turWordName) {
    return res.status(400).json({ error: 'İngilizce ve Türkçe kelime zorunludur' });
  }
  const picturePath = req.file ? `/uploads/${req.file.filename}` : null;

  const result = db.prepare(
    'INSERT INTO Words (EngWordName, TurWordName, Picture, CreatedBy) VALUES (?, ?, ?, ?)'
  ).run(engWordName.trim(), turWordName.trim(), picturePath, req.user.userId);

  const wordId = result.lastInsertRowid;

  if (samples) {
    const sampleList = Array.isArray(samples) ? samples : JSON.parse(samples);
    const insertSample = db.prepare('INSERT INTO WordSamples (WordID, Sample) VALUES (?, ?)');
    sampleList.filter(s => s.trim()).forEach(s => insertSample.run(wordId, s.trim()));
  }

  res.status(201).json({ message: 'Kelime eklendi', wordId });
});

router.put('/:id', auth, upload.single('picture'), (req, res) => {
  const { engWordName, turWordName, samples } = req.body;
  const word = db.prepare('SELECT * FROM Words WHERE WordID = ?').get(req.params.id);
  if (!word) return res.status(404).json({ error: 'Kelime bulunamadı' });

  let picturePath = word.Picture;
  if (req.file) {
    if (word.Picture) {
      const oldPath = path.join(__dirname, '../../public', word.Picture);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    picturePath = `/uploads/${req.file.filename}`;
  }

  db.prepare(
    'UPDATE Words SET EngWordName = ?, TurWordName = ?, Picture = ? WHERE WordID = ?'
  ).run(
    engWordName?.trim() || word.EngWordName,
    turWordName?.trim() || word.TurWordName,
    picturePath,
    req.params.id
  );

  if (samples !== undefined) {
    db.prepare('DELETE FROM WordSamples WHERE WordID = ?').run(req.params.id);
    const sampleList = Array.isArray(samples) ? samples : JSON.parse(samples);
    const insertSample = db.prepare('INSERT INTO WordSamples (WordID, Sample) VALUES (?, ?)');
    sampleList.filter(s => s.trim()).forEach(s => insertSample.run(req.params.id, s.trim()));
  }

  res.json({ message: 'Kelime güncellendi' });
});

router.delete('/:id', auth, (req, res) => {
  const word = db.prepare('SELECT * FROM Words WHERE WordID = ?').get(req.params.id);
  if (!word) return res.status(404).json({ error: 'Kelime bulunamadı' });

  if (word.Picture) {
    const filePath = path.join(__dirname, '../../public', word.Picture);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  db.prepare('DELETE FROM Words WHERE WordID = ?').run(req.params.id);
  res.json({ message: 'Kelime silindi' });
});

module.exports = router;
