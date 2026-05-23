import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [step, setStep] = useState('form'); // 'form' | 'verify'
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
    if (form.password !== form.confirm) return setError('Şifreler eşleşmiyor');
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        username: form.username,
        email: form.email,
        password: form.password
      });
      if (data.token) {
        loginWith(data); // e-posta doğrulaması kapalıysa anında giriş
      } else if (data.needsVerification) {
        setDevCode(data.devCode || '');
        setMsg(`Doğrulama kodu ${form.email} adresine gönderildi.`);
        setStep('verify');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Kayıt başarısız');
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

  async function handleResend() {
    setError(''); setMsg('');
    try {
      const { data } = await api.post('/auth/resend-verification', { email: form.email });
      setDevCode(data.devCode || '');
      setMsg(data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'Kod gönderilemedi');
    }
  }

  const field = (label, key, type = 'text') => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        className="form-control"
        type={type}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        required
      />
    </div>
  );

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1 className="auth-title">📚 Kayıt Ol</h1>
        {error && <div className="alert alert-danger">{error}</div>}
        {msg && <div className="alert alert-info">{msg}</div>}

        {step === 'form' && (
          <>
            <form onSubmit={handleSubmit}>
              {field('Kullanıcı Adı', 'username')}
              {field('E-posta', 'email', 'email')}
              {field('Şifre', 'password', 'password')}
              {field('Şifre Tekrar', 'confirm', 'password')}
              <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
              </button>
            </form>
            <div className="auth-footer">
              Zaten hesabın var mı? <Link to="/login">Giriş yap</Link>
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
              Kod gelmedi mi? <button type="button" className="btn-link" onClick={handleResend}>Tekrar gönder</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
