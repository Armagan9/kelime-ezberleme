import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Kayıt başarısız');
    } finally {
      setLoading(false);
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
      </div>
    </div>
  );
}
