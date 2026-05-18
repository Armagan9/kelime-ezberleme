import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleForgot(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setResetToken(data.resetToken);
      setMsg(data.message);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Hata oluştu');
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      setMsg('Şifre başarıyla güncellendi! Giriş yapabilirsiniz.');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Hata oluştu');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1 className="auth-title">🔒 Şifremi Unuttum</h1>
        {error && <div className="alert alert-danger">{error}</div>}
        {msg && <div className="alert alert-info">{msg}</div>}

        {step === 1 && (
          <form onSubmit={handleForgot}>
            <div className="form-group">
              <label className="form-label">E-posta adresiniz</label>
              <input className="form-control" type="email" value={email}
                onChange={e => setEmail(e.target.value)} required />
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Gönderiliyor...' : 'Sıfırlama Token\'ı Al'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleReset}>
            {resetToken && (
              <div className="alert alert-warning">
                <strong>Demo Token:</strong> <code>{resetToken}</code>
                <br /><small>(Gerçek uygulamada e-posta ile gönderilir)</small>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Sıfırlama Token'ı</label>
              <input className="form-control" type="text" value={token}
                onChange={e => setToken(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Yeni Şifre</label>
              <input className="form-control" type="password" value={newPassword}
                onChange={e => setNewPassword(e.target.value)} required />
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="text-center">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          </div>
        )}

        <div className="auth-footer"><Link to="/login">← Giriş sayfasına dön</Link></div>
      </div>
    </div>
  );
}
