import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

const STATUS_LABELS = { active: 'Öğreniliyor', review: 'Tekrar', mastered: 'Öğrenildi' };

export default function Quiz() {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/quiz/today')
      .then(({ data }) => { setQuestions(data.questions); setLoading(false); })
      .catch(err => { setError(err.response?.data?.error || 'Quiz yüklenemedi'); setLoading(false); });
  }, []);

  async function handleAnswer(option) {
    if (selected !== null) return;
    setSelected(option.id);

    const q = questions[current];
    const isCorrect = option.isCorrect;

    if (isCorrect) {
      setScore(s => ({ ...s, correct: s.correct + 1 }));
    } else {
      setScore(s => ({ ...s, wrong: s.wrong + 1 }));
    }

    await api.post('/quiz/answer', { wordId: q.wordId, isCorrect });

    setTimeout(() => {
      if (current + 1 >= questions.length) {
        setDone(true);
      } else {
        setCurrent(c => c + 1);
        setSelected(null);
      }
    }, 1000);
  }

  if (loading) return <div className="spinner" />;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (questions.length === 0) return (
    <div className="card text-center" style={{ maxWidth: 500, margin: '2rem auto' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
      <h2 style={{ marginBottom: '0.5rem' }}>Bugünlük quiz yok!</h2>
      <p className="text-muted">Sisteme kelime ekleyerek başlayabilirsiniz.</p>
      <div className="mt-4">
        <Link to="/words" className="btn btn-primary">Kelime Ekle</Link>
      </div>
    </div>
  );

  if (done) {
    const total = score.correct + score.wrong;
    const rate = Math.round((score.correct / total) * 100);
    return (
      <div className="card text-center" style={{ maxWidth: 500, margin: '2rem auto' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{rate >= 70 ? '🏆' : '📚'}</div>
        <h2 style={{ marginBottom: '1rem' }}>Quiz Tamamlandı!</h2>
        <div className="stats-grid" style={{ marginBottom: '1rem' }}>
          <div className="stat-card stat-success">
            <div className="stat-value">{score.correct}</div>
            <div className="stat-label">Doğru</div>
          </div>
          <div className="stat-card" style={{ '--v': 'var(--danger)' }}>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>{score.wrong}</div>
            <div className="stat-label">Yanlış</div>
          </div>
          <div className="stat-card stat-primary">
            <div className="stat-value">{rate}%</div>
            <div className="stat-label">Başarı</div>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Tekrar Quiz Yap
        </button>
      </div>
    );
  }

  const q = questions[current];
  const progress = ((current) / questions.length) * 100;
  const dots = Array.from({ length: 6 }, (_, i) => i < q.consecutiveCorrect);

  return (
    <div className="quiz-container">
      <div className="page-header flex-between">
        <h1 className="page-title">🧠 Quiz</h1>
        <span className="text-muted">{current + 1} / {questions.length}</span>
      </div>

      <div className="quiz-progress">
        <div className="quiz-progress-bar" style={{ width: `${progress}%` }} />
      </div>

      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          <span className="badge badge-active">
            {q.questionType === 'eng_to_tur' ? 'İngilizce → Türkçe' : 'Türkçe → İngilizce'}
          </span>
          <span className="badge" style={{ background: 'var(--gray-100)', color: 'var(--gray-700)', marginLeft: '0.5rem' }}>
            {STATUS_LABELS[q.status]}
          </span>
        </div>

        <div className="quiz-word">{q.question}</div>

        {q.picture && selected !== null && (
          <div className="quiz-picture" style={{ marginTop: '0.75rem' }}>
            <img src={q.picture} alt={q.question} />
          </div>
        )}

        <div className="quiz-options">
          {q.options.map((opt, i) => {
            let cls = 'option-btn';
            if (selected !== null) {
              if (opt.isCorrect) cls += ' correct';
              else if (opt.id === selected && !opt.isCorrect) cls += ' wrong';
            }
            return (
              <button key={opt.id} className={cls} onClick={() => handleAnswer(opt)} disabled={selected !== null}>
                {opt.text}
              </button>
            );
          })}
        </div>

        {q.status === 'active' && (
          <div className="quiz-streak">
            <span>Üst üste doğru: {q.consecutiveCorrect}/6</span>
            <div className="streak-dots">
              {dots.map((filled, i) => (
                <div key={i} className={`streak-dot ${filled ? 'filled' : ''}`} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
