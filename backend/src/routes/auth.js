const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/register', (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Tüm alanlar zorunludur' });
  }
  const hash = bcrypt.hashSync(password, 10);
  try {
    const result = db.prepare(
      'INSERT INTO Users (UserName, Email, Password) VALUES (?, ?, ?)'
    ).run(username, email, hash);
    db.prepare('INSERT INTO UserSettings (UserID) VALUES (?)').run(result.lastInsertRowid);
    const token = jwt.sign(
      { userId: result.lastInsertRowid, username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({ token, username });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Kullanıcı adı veya e-posta zaten kullanımda' });
    }
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'E-posta ve şifre zorunludur' });

  const user = db.prepare('SELECT * FROM Users WHERE Email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.Password)) {
    return res.status(401).json({ error: 'Geçersiz e-posta veya şifre' });
  }
  const token = jwt.sign(
    { userId: user.UserID, username: user.UserName },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({ token, username: user.UserName });
});

router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  const user = db.prepare('SELECT * FROM Users WHERE Email = ?').get(email);
  if (!user) return res.status(404).json({ error: 'Bu e-posta ile kayıtlı kullanıcı bulunamadı' });

  const token = crypto.randomBytes(32).toString('hex');
  const expiry = Date.now() + 3600000; // 1 hour
  db.prepare('UPDATE Users SET ResetToken = ?, ResetTokenExpiry = ? WHERE UserID = ?')
    .run(token, expiry, user.UserID);

  res.json({
    message: 'Şifre sıfırlama token\'ı oluşturuldu (gerçek uygulamada e-posta ile gönderilir)',
    resetToken: token
  });
});

router.post('/reset-password', (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: 'Token ve yeni şifre zorunludur' });

  const user = db.prepare(
    'SELECT * FROM Users WHERE ResetToken = ? AND ResetTokenExpiry > ?'
  ).get(token, Date.now());

  if (!user) return res.status(400).json({ error: 'Geçersiz veya süresi dolmuş token' });

  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE Users SET Password = ?, ResetToken = NULL, ResetTokenExpiry = NULL WHERE UserID = ?')
    .run(hash, user.UserID);

  res.json({ message: 'Şifre başarıyla güncellendi' });
});

router.get('/me', auth, (req, res) => {
  const user = db.prepare('SELECT UserID, UserName, Email, CreatedAt FROM Users WHERE UserID = ?')
    .get(req.user.userId);
  res.json(user);
});

module.exports = router;
