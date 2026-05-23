const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');
const db = require('../config/db');
const auth = require('../middleware/auth');
const { isMailConfigured, sendResetEmail, sendVerificationEmail } = require('../services/mail');

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VERIFY_CODE_TTL = 15 * 60 * 1000; // 15 dakika

function signToken(userId, username) {
  return jwt.sign({ userId, username }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function generateCode() {
  return String(crypto.randomInt(100000, 1000000)); // 6 haneli
}

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Tüm alanlar zorunludur' });
  }
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'Geçerli bir e-posta adresi giriniz' });
  }
  const hash = bcrypt.hashSync(password, 10);
  const mailOn = isMailConfigured();
  const code = generateCode();

  try {
    // E-posta açıksa kullanıcı doğrulanmamış oluşturulur; değilse doğrulanmış kabul edilir
    const result = db.prepare(
      'INSERT INTO Users (UserName, Email, Password, EmailVerified, VerifyCode, VerifyCodeExpiry) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(
      username, email, hash,
      mailOn ? 0 : 1,
      mailOn ? code : null,
      mailOn ? Date.now() + VERIFY_CODE_TTL : null
    );
    db.prepare('INSERT INTO UserSettings (UserID) VALUES (?)').run(result.lastInsertRowid);

    // E-posta yapılandırılmamışsa eski davranış: anında giriş
    if (!mailOn) {
      return res.status(201).json({ token: signToken(result.lastInsertRowid, username), username });
    }

    // Doğrulama kodunu e-posta ile gönder
    try {
      await sendVerificationEmail(email, code);
      return res.status(201).json({ needsVerification: true, email });
    } catch (err) {
      console.error('Doğrulama e-postası gönderilemedi:', err.message);
      // Yedek: gönderilemezse demo kodu döndür (kayıt bloke olmasın)
      return res.status(201).json({ needsVerification: true, email, devCode: code });
    }
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Kullanıcı adı veya e-posta zaten kullanımda' });
    }
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.post('/verify-email', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'E-posta ve kod zorunludur' });

  const user = db.prepare('SELECT * FROM Users WHERE Email = ?').get(email);
  if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
  if (user.EmailVerified) return res.status(400).json({ error: 'Hesap zaten doğrulanmış' });
  if (user.VerifyCode !== String(code) || user.VerifyCodeExpiry < Date.now()) {
    return res.status(400).json({ error: 'Geçersiz veya süresi dolmuş kod' });
  }

  db.prepare('UPDATE Users SET EmailVerified = 1, VerifyCode = NULL, VerifyCodeExpiry = NULL WHERE UserID = ?')
    .run(user.UserID);

  res.json({ token: signToken(user.UserID, user.UserName), username: user.UserName });
});

router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;
  const user = db.prepare('SELECT * FROM Users WHERE Email = ?').get(email);
  if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
  if (user.EmailVerified) return res.status(400).json({ error: 'Hesap zaten doğrulanmış' });

  const code = generateCode();
  db.prepare('UPDATE Users SET VerifyCode = ?, VerifyCodeExpiry = ? WHERE UserID = ?')
    .run(code, Date.now() + VERIFY_CODE_TTL, user.UserID);

  if (isMailConfigured()) {
    try {
      await sendVerificationEmail(user.Email, code);
      return res.json({ message: 'Doğrulama kodu tekrar gönderildi.' });
    } catch (err) {
      console.error('Doğrulama e-postası gönderilemedi:', err.message);
    }
  }
  res.json({ message: 'E-posta gönderilemedi; demo kod aşağıda.', devCode: code });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'E-posta ve şifre zorunludur' });

  const user = db.prepare('SELECT * FROM Users WHERE Email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.Password)) {
    return res.status(401).json({ error: 'Geçersiz e-posta veya şifre' });
  }
  if (!user.EmailVerified) {
    return res.status(403).json({ error: 'Önce e-posta adresinizi doğrulamanız gerekiyor', needsVerification: true, email: user.Email });
  }
  res.json({ token: signToken(user.UserID, user.UserName), username: user.UserName });
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const user = db.prepare('SELECT * FROM Users WHERE Email = ?').get(email);
  if (!user) return res.status(404).json({ error: 'Bu e-posta ile kayıtlı kullanıcı bulunamadı' });

  const token = crypto.randomBytes(32).toString('hex');
  const expiry = Date.now() + 3600000; // 1 hour
  db.prepare('UPDATE Users SET ResetToken = ?, ResetTokenExpiry = ? WHERE UserID = ?')
    .run(token, expiry, user.UserID);

  // E-posta yapılandırılmışsa token'ı gönder; token'ı yanıtta döndürme
  if (isMailConfigured()) {
    try {
      await sendResetEmail(user.Email, token);
      return res.json({ message: 'Şifre sıfırlama token\'ı e-posta adresinize gönderildi.' });
    } catch (err) {
      console.error('E-posta gönderilemedi:', err.message);
    }
  }

  // Yedek: e-posta yapılandırılmamış veya gönderilemediyse demo token'ı döndür
  res.json({
    message: 'E-posta gönderilemedi; demo token aşağıda gösteriliyor.',
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
