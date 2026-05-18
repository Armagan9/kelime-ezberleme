import { useState, useEffect } from 'react';
import api from '../api/client';

export default function Settings() {
  const [dailyNewWords, setDailyNewWords] = useState(10);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/settings').then(({ data }) => {
      setDailyNewWords(data.DailyNewWords || 10);
    });
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setMsg(''); setError(''); setLoading(true);
    try {
      await api.put('/settings', { dailyNewWords: Number(dailyNewWords) });
      setMsg('Ayarlar kaydedildi!');
    } catch (err) {
      setError(err.response?.data?.error || 'Hata oluştu');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">⚙️ Ayarlar</h1>
        <p className="page-subtitle">Öğrenme tercihlerinizi ayarlayın</p>
      </div>

      <div className="card" style={{ maxWidth: 480 }}>
        <h2 className="card-title">Quiz Ayarları</h2>
        {msg && <div className="alert alert-success">{msg}</div>}
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">
              Günlük Yeni Kelime Sayısı
              <span className="text-muted" style={{ marginLeft: '0.5rem' }}>(1–100)</span>
            </label>
            <input
              className="form-control"
              type="number"
              min={1} max={100}
              value={dailyNewWords}
              onChange={e => setDailyNewWords(e.target.value)}
            />
            <p className="text-muted mt-2">
              Her gün quiz'e bu kadar yeni kelime eklenir. Mevcut aktif ve gözden geçirme kelimeleri buna ek olarak gelir.
            </p>
          </div>
          <button className="btn btn-primary" disabled={loading}>
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </form>
      </div>

      <div className="card mt-4" style={{ maxWidth: 480 }}>
        <h2 className="card-title">Algoritma Hakkında</h2>
        <p className="text-muted" style={{ lineHeight: 1.7 }}>
          <strong>6 Sefer Prensibi:</strong> Bir kelimeyi gerçekten öğrenmek için üst üste
          6 kez doğru cevaplamanız gerekir. Yanlış cevap verirseniz sayaç sıfırlanır.
        </p>
        <div style={{ marginTop: '1rem' }}>
          <strong>Tekrar Aralıkları (kelimeyi öğrendikten sonra):</strong>
          <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', lineHeight: 2, color: 'var(--gray-700)' }}>
            <li>1 gün sonra</li>
            <li>1 hafta sonra</li>
            <li>1 ay sonra</li>
            <li>3 ay sonra</li>
            <li>6 ay sonra</li>
            <li>1 yıl sonra → <strong style={{ color: 'var(--success)' }}>Tam Öğrenildi!</strong></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
