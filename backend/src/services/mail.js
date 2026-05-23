const nodemailer = require('nodemailer');

// Gmail SMTP transporter; EMAIL_USER/EMAIL_PASS tanımlı değilse null döner
function getTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });
}

function isMailConfigured() {
  return getTransporter() !== null;
}

async function sendResetEmail(to, token) {
  const transporter = getTransporter();
  if (!transporter) throw new Error('E-posta yapılandırılmamış (EMAIL_USER/EMAIL_PASS)');

  await transporter.sendMail({
    from: `"6 Sefer Kelime Ezberleme" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Şifre Sıfırlama Token\'ı',
    text: `Şifre sıfırlama token'ınız: ${token}\n\nBu token 1 saat geçerlidir. Bu talebi siz yapmadıysanız bu e-postayı yok sayın.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>🔒 Şifre Sıfırlama</h2>
        <p>Şifre sıfırlama token'ınız aşağıdadır. Uygulamadaki sıfırlama ekranına yapıştırın:</p>
        <p style="font-size: 16px; font-weight: bold; font-family: monospace; word-break: break-all; background: #f3f4f6; padding: 12px; border-radius: 6px;">${token}</p>
        <p style="color: #6b7280; font-size: 13px;">Bu token 1 saat geçerlidir. Bu talebi siz yapmadıysanız bu e-postayı yok sayabilirsiniz.</p>
      </div>
    `
  });
}

async function sendVerificationEmail(to, code) {
  const transporter = getTransporter();
  if (!transporter) throw new Error('E-posta yapılandırılmamış (EMAIL_USER/EMAIL_PASS)');

  await transporter.sendMail({
    from: `"6 Sefer Kelime Ezberleme" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'E-posta Doğrulama Kodu',
    text: `Hesabınızı doğrulamak için kodunuz: ${code}\n\nBu kod 15 dakika geçerlidir.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>📚 E-posta Doğrulama</h2>
        <p>Hesabınızı doğrulamak için aşağıdaki kodu uygulamaya girin:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; font-family: monospace; background: #f3f4f6; padding: 16px; border-radius: 6px; text-align: center;">${code}</p>
        <p style="color: #6b7280; font-size: 13px;">Bu kod 15 dakika geçerlidir. Bu kaydı siz yapmadıysanız bu e-postayı yok sayabilirsiniz.</p>
      </div>
    `
  });
}

module.exports = { isMailConfigured, sendResetEmail, sendVerificationEmail };
