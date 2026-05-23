import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [step, setStep] = useState('login'); // 'login' | 'verify'
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function loginWith(data) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username);
    navigate('/');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setMsg('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      loginWith(data);
    } catch (err) {
      const data = err.response?.data;
      if (data?.needsVerification) {
        // Doğrulanmamış hesap: kod gönder ve doğrulama adımına geç
        setStep('verify');
        setMsg('Hesabınız doğrulanmamış. E-postanıza bir kod gönderildi.');
        try {
          const r = await api.post('/auth/resend-verification', { email: form.email });
          setDevCode(r.data.devCode || '');
        } catch { /* yoksay */ }
      } else {
        setError(data?.error || 'Giriş başarısız');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-email', { email: form.email, code });
      loginWith(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Doğrulama başarısız');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1 className="auth-title">📚 6 Sefer Giriş</h1>
        {error && <div className="alert alert-danger">{error}</div>}
        {msg && <div className="alert alert-info">{msg}</div>}

        {step === 'login' && (
          <>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">E-posta</label>
                <input
                  className="form-control"
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Şifre</label>
                <input
                  className="form-control"
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
              </button>
            </form>
            <div className="auth-footer">
              <Link to="/forgot-password">Şifremi unuttum</Link>
              {' · '}
              <Link to="/register">Kayıt ol</Link>
            </div>
          </>
        )}

        {step === 'verify' && (
          <form onSubmit={handleVerify}>
            {devCode && (
              <div className="alert alert-warning">
                <strong>Demo Kod:</strong> <code>{devCode}</code>
                <br /><small>(E-posta gönderilemedi; gerçekte e-posta ile gelir)</small>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">E-postanıza gelen 6 haneli kod</label>
              <input
                className="form-control"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={e => setCode(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Doğrulanıyor...' : 'Doğrula ve Giriş Yap'}
            </button>
            <div className="auth-footer">
              <button type="button" className="btn-link" onClick={() => setStep('login')}>← Geri dön</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
