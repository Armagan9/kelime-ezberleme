import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const EMPTY = '';
const MAX_ATTEMPTS = 6;

const KEYBOARD_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['ENTER','Z','X','C','V','B','N','M','⌫']
];

export default function Wordle() {
  const [wordLength, setWordLength] = useState(5);
  const [guesses, setGuesses] = useState([]);
  const [current, setCurrent] = useState('');
  const [gameState, setGameState] = useState('idle'); // idle, playing, won, lost
  const [resultWord, setResultWord] = useState('');
  const [keyColors, setKeyColors] = useState({});
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  async function startGame() {
    setError('');
    try {
      const { data } = await api.post('/wordle/start');
      setWordLength(data.wordLength);
      setGuesses([]);
      setCurrent('');
      setKeyColors({});
      setResultWord('');
      setMsg('');
      setGameState('playing');
    } catch (err) {
      setError(err.response?.data?.error || 'Oyun başlatılamadı');
    }
  }

  const submitGuess = useCallback(async () => {
    if (current.length !== wordLength) {
      setMsg(`Tahmin ${wordLength} harf olmalı!`);
      return;
    }
    setMsg('');
    try {
      const { data } = await api.post('/wordle/guess', { guess: current });
      const newGuess = { word: current.toUpperCase(), feedback: data.feedback };
      setGuesses(g => [...g, newGuess]);
      setCurrent('');

      // Update key colors
      setKeyColors(prev => {
        const updated = { ...prev };
        current.toUpperCase().split('').forEach((letter, i) => {
          const fb = data.feedback[i];
          const priority = { correct: 3, present: 2, absent: 1 };
          if (!updated[letter] || priority[fb] > priority[updated[letter]]) {
            updated[letter] = fb;
          }
        });
        return updated;
      });

      if (data.won) {
        setGameState('won');
        setResultWord(data.word);
      } else if (data.finished) {
        setGameState('lost');
        setResultWord(data.word);
      }
    } catch (err) {
      setMsg(err.response?.data?.error || 'Hata oluştu');
    }
  }, [current, wordLength]);

  const handleKey = useCallback((key) => {
    if (gameState !== 'playing') return;
    if (key === 'ENTER') { submitGuess(); return; }
    if (key === '⌫' || key === 'BACKSPACE') {
      setCurrent(c => c.slice(0, -1));
      return;
    }
    if (/^[A-Z]$/.test(key) && current.length < wordLength) {
      setCurrent(c => c + key);
    }
  }, [gameState, current, wordLength, submitGuess]);

  useEffect(() => {
    function onKey(e) {
      const k = e.key.toUpperCase();
      if (k === 'ENTER') handleKey('ENTER');
      else if (k === 'BACKSPACE') handleKey('⌫');
      else if (/^[A-Z]$/.test(k)) handleKey(k);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleKey]);

  function renderGrid() {
    const rows = [];
    for (let r = 0; r < MAX_ATTEMPTS; r++) {
      const guess = guesses[r];
      const isCurrent = r === guesses.length && gameState === 'playing';
      const cells = [];
      for (let c = 0; c < wordLength; c++) {
        let letter = '';
        let cls = 'wordle-cell';
        if (guess) {
          letter = guess.word[c] || '';
          cls += ` ${guess.feedback[c]}`;
        } else if (isCurrent) {
          letter = current[c] || '';
        }
        cells.push(<div key={c} className={cls}>{letter}</div>);
      }
      rows.push(<div key={r} className="wordle-row">{cells}</div>);
    }
    return rows;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🟩 Wordle</h1>
        <p className="page-subtitle">Öğrendiğin kelimelerden oluşan bulmaca</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {gameState === 'idle' && (
        <div className="card text-center" style={{ maxWidth: 400, margin: '2rem auto' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🟩🟨⬛</div>
          <h2 style={{ marginBottom: '0.5rem' }}>Wordle'a Hoş Geldin!</h2>
          <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
            Öğrendiğin kelimelerden biri seçilir. 6 hakkında doğru kelimeyi bul!
          </p>
          <button className="btn btn-primary btn-lg" onClick={startGame}>Oyunu Başlat</button>
        </div>
      )}

      {(gameState === 'playing' || gameState === 'won' || gameState === 'lost') && (
        <div style={{ maxWidth: 400, margin: '0 auto' }}>
          {msg && <div className="alert alert-warning text-center">{msg}</div>}

          {gameState === 'won' && (
            <div className="alert alert-success text-center">
              🎉 Tebrikler! Kelime: <strong>{resultWord}</strong>
            </div>
          )}
          {gameState === 'lost' && (
            <div className="alert alert-danger text-center">
              Kelime: <strong>{resultWord}</strong>
            </div>
          )}

          <div className="wordle-grid" style={{ margin: '1rem 0' }}>
            {renderGrid()}
          </div>

          <div className="wordle-keyboard">
            {KEYBOARD_ROWS.map((row, ri) => (
              <div key={ri} className="wordle-keyboard-row">
                {row.map(key => (
                  <button
                    key={key}
                    className={`wordle-key ${keyColors[key] || ''}`}
                    style={key.length > 1 ? { minWidth: 56, fontSize: '0.7rem' } : {}}
                    onClick={() => handleKey(key)}
                  >
                    {key}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {(gameState === 'won' || gameState === 'lost') && (
            <div className="text-center mt-4">
              <button className="btn btn-primary" onClick={startGame}>Yeni Oyun</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
