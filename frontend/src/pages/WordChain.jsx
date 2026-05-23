import { useState, useEffect } from 'react';
import api from '../api/client';

export default function WordChain() {
  const [words, setWords] = useState([]);
  const [selected, setSelected] = useState([]);
  const [story, setStory] = useState(null);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('create');

  useEffect(() => {
    api.get('/words').then(({ data }) => setWords(data));
    loadStories();
  }, []);

  async function loadStories() {
    const { data } = await api.get('/wordchain/stories');
    setStories(data);
  }

  function toggleWord(word) {
    setSelected(prev => {
      const exists = prev.find(w => w.WordID === word.WordID);
      if (exists) return prev.filter(w => w.WordID !== word.WordID);
      if (prev.length >= 8) return prev;
      return [...prev, word];
    });
  }

  async function generate() {
    if (selected.length < 2) return setError('En az 2 kelime seçin');
    setError(''); setLoading(true); setStory(null);
    try {
      const { data } = await api.post('/wordchain/generate', {
        wordIds: selected.map(w => w.WordID)
      });
      setStory(data);
      loadStories();
    } catch (err) {
      setError(err.response?.data?.error || 'Hikaye oluşturulamadı');
    } finally {
      setLoading(false);
    }
  }

  async function deleteStory(id) {
    await api.delete(`/wordchain/stories/${id}`);
    loadStories();
  }

  function highlightWords(text, wordList) {
    if (!wordList?.length) return text;
    const escaped = wordList.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
    return text.split(regex).map((part, i) =>
      regex.test(part)
        ? <mark key={i} style={{ background: 'var(--primary-light)', padding: '0 2px', borderRadius: 3, fontWeight: 600 }}>{part}</mark>
        : part
    );
  }

  const filtered = words.filter(w =>
    w.EngWordName.toLowerCase().includes(search.toLowerCase()) ||
    w.TurWordName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🔗 Word Chain</h1>
        <p className="page-subtitle">Kelimelerini seç, AI hikaye oluştursun</p>
      </div>

      <div className="flex gap-2 mb-4 no-print">
        <button className={`btn ${tab === 'create' ? 'btn-primary' : 'btn-gray'}`} onClick={() => setTab('create')}>
          Hikaye Oluştur
        </button>
        <button className={`btn ${tab === 'stories' ? 'btn-primary' : 'btn-gray'}`} onClick={() => setTab('stories')}>
          Kayıtlı Hikayeler ({stories.length})
        </button>
      </div>

      {tab === 'create' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="card">
            <h2 className="card-title">Kelime Seç ({selected.length}/8)</h2>
            <input
              className="form-control mb-4"
              placeholder="Kelime ara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              <div className="word-chips">
                {filtered.map(w => (
                  <button
                    key={w.WordID}
                    className={`word-chip ${selected.find(s => s.WordID === w.WordID) ? 'selected' : ''}`}
                    onClick={() => toggleWord(w)}
                  >
                    {w.EngWordName}
                    <span style={{ fontSize: '0.75rem', opacity: 0.7, marginLeft: 4 }}>({w.TurWordName})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="card" style={{ marginBottom: '1rem' }}>
              <h2 className="card-title">Seçilen Kelimeler</h2>
              {selected.length === 0 ? (
                <p className="text-muted">Soldaki listeden kelime seçin</p>
              ) : (
                <div className="word-chips">
                  {selected.map(w => (
                    <button key={w.WordID} className="word-chip selected" onClick={() => toggleWord(w)}>
                      {w.EngWordName} ✕
                    </button>
                  ))}
                </div>
              )}
              {error && <div className="alert alert-danger mt-3">{error}</div>}
              <button
                className="btn btn-primary mt-4"
                style={{ width: '100%' }}
                onClick={generate}
                disabled={loading || selected.length < 2}
              >
                {loading ? '🤖 Hikaye oluşturuluyor...' : '✨ Hikaye Oluştur'}
              </button>
            </div>

            {story && (
              <div className="card">
                <h2 className="card-title">📖 Oluşturulan Hikaye</h2>
                {story.imagePath && (
                  <img
                    src={story.imagePath}
                    alt="Hikaye görseli"
                    style={{ width: '100%', borderRadius: 8, marginBottom: '0.75rem' }}
                  />
                )}
                <div className="story-card">
                  <p className="story-text">
                    {highlightWords(story.story, story.words)}
                  </p>
                </div>
                {story.imageDescription && (
                  <div className="mt-3">
                    <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                      <strong>Görsel Sahne:</strong> {story.imageDescription}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'stories' && (
        <div>
          {stories.length === 0 ? (
            <div className="card text-center" style={{ padding: '2rem' }}>
              <p className="text-muted">Henüz kaydedilmiş hikaye yok.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {stories.map(s => (
                <div key={s.StoryID} className="card">
                  <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                    <div className="word-chips" style={{ margin: 0 }}>
                      {s.Words.split(', ').map((w, i) => (
                        <span key={i} className="word-chip" style={{ cursor: 'default' }}>{w}</span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <span className="text-muted" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {new Date(s.CreatedAt * 1000).toLocaleDateString('tr-TR')}
                      </span>
                      <button className="btn btn-sm btn-danger" onClick={() => deleteStory(s.StoryID)}>Sil</button>
                    </div>
                  </div>
                  {s.ImagePath && (
                    <img
                      src={s.ImagePath}
                      alt="Hikaye görseli"
                      style={{ width: '100%', maxWidth: 400, borderRadius: 8, marginBottom: '0.75rem' }}
                    />
                  )}
                  <div className="story-card">
                    <p className="story-text">
                      {highlightWords(s.Story, s.Words.split(', '))}
                    </p>
                  </div>
                  {s.ImageDescription && (
                    <p className="text-muted mt-2" style={{ fontSize: '0.85rem' }}>
                      <strong>Görsel:</strong> {s.ImageDescription}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
