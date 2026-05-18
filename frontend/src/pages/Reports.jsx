import { useState, useEffect } from 'react';
import api from '../api/client';

const STATUS_LABELS = { active: 'Öğreniliyor', review: 'Tekrarda', mastered: 'Öğrenildi' };
const STATUS_CLASS = { active: 'badge-active', review: 'badge-review', mastered: 'badge-mastered' };

function Bar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="report-bar-container">
      <div className="report-bar-label">
        <span>{label}</span>
        <span><strong>{value}</strong> / {max} ({pct}%)</span>
      </div>
      <div className="report-bar-track">
        <div className="report-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [daily, setDaily] = useState([]);
  const [wordProgress, setWordProgress] = useState([]);
  const [tab, setTab] = useState('summary');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/reports/summary'),
      api.get('/reports/daily'),
      api.get('/reports/words')
    ]).then(([s, d, w]) => {
      setSummary(s.data);
      setDaily(d.data);
      setWordProgress(w.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="flex-between page-header no-print">
        <div>
          <h1 className="page-title">📊 Analiz Raporu</h1>
          <p className="page-subtitle">Kelime öğrenme ilerlemeniz</p>
        </div>
        <button className="btn btn-outline no-print" onClick={() => window.print()}>
          🖨️ Yazdır
        </button>
      </div>

      <div className="no-print" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {['summary', 'daily', 'words'].map(t => (
          <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-gray'}`} onClick={() => setTab(t)}>
            {t === 'summary' ? 'Özet' : t === 'daily' ? 'Günlük' : 'Kelimeler'}
          </button>
        ))}
      </div>

      {/* Print header (only visible when printing) */}
      <div style={{ display: 'none' }} className="print-only">
        <h1>6 Sefer Kelime Ezberleme - Analiz Raporu</h1>
        <p>Kullanıcı: {localStorage.getItem('username')} | Tarih: {new Date().toLocaleDateString('tr-TR')}</p>
        <hr />
      </div>

      {(tab === 'summary') && summary && (
        <div className="card">
          <h2 className="card-title">Genel Özet</h2>
          <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="stat-card stat-primary">
              <div className="stat-value">{summary.successRate}%</div>
              <div className="stat-label">Genel Başarı</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--gray-700)' }}>{summary.activeDays}</div>
              <div className="stat-label">Aktif Gün</div>
            </div>
            <div className="stat-card stat-success">
              <div className="stat-value">{summary.masteredWords}</div>
              <div className="stat-label">Öğrenilen</div>
            </div>
          </div>

          <Bar label="Öğrenildi" value={summary.masteredWords} max={summary.totalWords || 1} color="var(--success)" />
          <Bar label="Tekrarda" value={summary.reviewWords} max={summary.totalWords || 1} color="var(--warning)" />
          <Bar label="Öğreniliyor" value={summary.activeWords} max={summary.totalWords || 1} color="var(--primary)" />

          <p className="text-muted mt-4">
            Toplam {summary.totalAnswers} sorudan {summary.correctAnswers} doğru cevap verildi.
          </p>
        </div>
      )}

      {tab === 'daily' && (
        <div className="card">
          <h2 className="card-title">Son 30 Günlük Aktivite</h2>
          {daily.length === 0 ? (
            <p className="text-muted">Henüz quiz çözülmemiş.</p>
          ) : (
            <table className="word-table">
              <thead>
                <tr><th>Tarih</th><th>Toplam Soru</th><th>Doğru</th><th>Başarı Oranı</th></tr>
              </thead>
              <tbody>
                {daily.map(d => (
                  <tr key={d.QuizDate}>
                    <td>{new Date(d.QuizDate).toLocaleDateString('tr-TR')}</td>
                    <td>{d.total}</td>
                    <td style={{ color: 'var(--success)' }}>{d.correct}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, background: 'var(--gray-200)', borderRadius: 99, height: 8 }}>
                          <div style={{ width: `${d.successRate}%`, background: d.successRate >= 70 ? 'var(--success)' : 'var(--warning)', height: '100%', borderRadius: 99 }} />
                        </div>
                        <span>{d.successRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'words' && (
        <div className="card">
          <h2 className="card-title">Kelime Bazlı İlerleme</h2>
          {wordProgress.length === 0 ? (
            <p className="text-muted">Henüz quiz çözülmemiş.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="word-table">
                <thead>
                  <tr>
                    <th>Kelime</th>
                    <th>Durum</th>
                    <th>Doğru/Toplam</th>
                    <th>Başarı</th>
                    <th>Son Tekrar</th>
                  </tr>
                </thead>
                <tbody>
                  {wordProgress.map(w => (
                    <tr key={w.WordID}>
                      <td>
                        <strong>{w.EngWordName}</strong>
                        <br /><span className="text-muted">{w.TurWordName}</span>
                      </td>
                      <td><span className={`badge ${STATUS_CLASS[w.Status]}`}>{STATUS_LABELS[w.Status]}</span></td>
                      <td>{w.correctAttempts}/{w.totalAttempts}</td>
                      <td>
                        <span style={{ color: w.successRate >= 70 ? 'var(--success)' : w.successRate >= 40 ? 'var(--warning)' : 'var(--danger)' }}>
                          {w.successRate}%
                        </span>
                      </td>
                      <td className="text-muted">
                        {w.LastReviewedDate ? new Date(w.LastReviewedDate).toLocaleDateString('tr-TR') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
