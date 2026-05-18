import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function Dashboard() {
  const [progress, setProgress] = useState(null);
  const [quizStats, setQuizStats] = useState(null);
  const username = localStorage.getItem('username');

  useEffect(() => {
    api.get('/quiz/progress').then(({ data }) => setProgress(data));
    api.get('/reports/summary').then(({ data }) => setQuizStats(data));
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Merhaba, {username}! 👋</h1>
        <p className="page-subtitle">6 Sefer Kelime Ezberleme Sistemi</p>
      </div>

      {progress && (
        <div className="stats-grid">
          <div className="stat-card stat-gray">
            <div className="stat-value">{progress.total}</div>
            <div className="stat-label">Toplam Kelime</div>
          </div>
          <div className="stat-card stat-primary">
            <div className="stat-value">{progress.active}</div>
            <div className="stat-label">Öğreniliyor</div>
          </div>
          <div className="stat-card stat-warning">
            <div className="stat-value">{progress.review}</div>
            <div className="stat-label">Tekrarda</div>
          </div>
          <div className="stat-card stat-success">
            <div className="stat-value">{progress.mastered}</div>
            <div className="stat-label">Öğrenildi</div>
          </div>
        </div>
      )}

      {quizStats && (
        <div className="stats-grid" style={{ marginTop: 0 }}>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--primary)' }}>{quizStats.successRate}%</div>
            <div className="stat-label">Başarı Oranı</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--gray-700)' }}>{quizStats.activeDays}</div>
            <div className="stat-label">Aktif Gün</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--gray-700)' }}>{quizStats.totalAnswers}</div>
            <div className="stat-label">Toplam Cevap</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--success)' }}>{quizStats.totalWordsInSystem}</div>
            <div className="stat-label">Sistemdeki Kelime</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
        <Link to="/quiz" className="card" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer', border: '2px solid var(--primary-light)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🧠</div>
          <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Günlük Quiz</h3>
          <p className="text-muted">Bugünkü kelimelerini çöz</p>
        </Link>
        <Link to="/words" className="card" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer', border: '2px solid var(--primary-light)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📝</div>
          <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Kelimeler</h3>
          <p className="text-muted">Kelime ekle ve yönet</p>
        </Link>
        <Link to="/wordle" className="card" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer', border: '2px solid var(--primary-light)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🟩</div>
          <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Wordle</h3>
          <p className="text-muted">Kelime bulmaca oyunu</p>
        </Link>
        <Link to="/wordchain" className="card" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer', border: '2px solid var(--primary-light)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔗</div>
          <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Word Chain</h3>
          <p className="text-muted">AI ile hikaye oluştur</p>
        </Link>
        <Link to="/reports" className="card" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer', border: '2px solid var(--primary-light)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📊</div>
          <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Raporlar</h3>
          <p className="text-muted">İlerleme analizin</p>
        </Link>
        <Link to="/settings" className="card" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer', border: '2px solid var(--primary-light)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚙️</div>
          <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Ayarlar</h3>
          <p className="text-muted">Tercihlerini düzenle</p>
        </Link>
      </div>
    </div>
  );
}
