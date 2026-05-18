import { useState, useEffect } from 'react';
import api from '../api/client';

function WordModal({ word, onClose, onSaved }) {
  const [form, setForm] = useState({
    engWordName: word?.EngWordName || '',
    turWordName: word?.TurWordName || '',
    samples: word?.samples?.join('\n') || ''
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(word?.Picture ? `/uploads/${word.Picture.split('/').pop()}` : null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleFileChange(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const fd = new FormData();
      fd.append('engWordName', form.engWordName);
      fd.append('turWordName', form.turWordName);
      const sampleList = form.samples.split('\n').filter(s => s.trim());
      fd.append('samples', JSON.stringify(sampleList));
      if (file) fd.append('picture', file);

      if (word) {
        await api.put(`/words/${word.WordID}`, fd);
      } else {
        await api.post('/words', fd);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Hata oluştu');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">{word ? 'Kelime Düzenle' : 'Yeni Kelime Ekle'}</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">İngilizce Kelime *</label>
            <input className="form-control" value={form.engWordName}
              onChange={e => setForm(f => ({ ...f, engWordName: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Türkçe Karşılığı *</label>
            <input className="form-control" value={form.turWordName}
              onChange={e => setForm(f => ({ ...f, turWordName: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Örnek Cümleler (her satıra bir tane)</label>
            <textarea className="form-control" rows={4} value={form.samples}
              onChange={e => setForm(f => ({ ...f, samples: e.target.value }))}
              placeholder="The apple is red.&#10;I eat an apple every day." />
          </div>
          <div className="form-group">
            <label className="form-label">Resim (opsiyonel)</label>
            <input type="file" className="form-control" accept="image/*" onChange={handleFileChange} />
            {preview && (
              <img src={preview} alt="preview" style={{ marginTop: '0.5rem', maxHeight: 120, borderRadius: 8 }} />
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-gray" onClick={onClose}>İptal</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Words() {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editWord, setEditWord] = useState(null);
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);
    const { data } = await api.get('/words');
    setWords(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id) {
    if (!confirm('Bu kelimeyi silmek istediğinize emin misiniz?')) return;
    await api.delete(`/words/${id}`);
    load();
  }

  function openAdd() { setEditWord(null); setShowModal(true); }
  function openEdit(w) { setEditWord(w); setShowModal(true); }
  function handleSaved() { setShowModal(false); load(); }

  const filtered = words.filter(w =>
    w.EngWordName.toLowerCase().includes(search.toLowerCase()) ||
    w.TurWordName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex-between page-header">
        <div>
          <h1 className="page-title">📝 Kelimeler</h1>
          <p className="page-subtitle">{words.length} kelime</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Kelime Ekle</button>
      </div>

      <div className="card">
        <input
          className="form-control mb-4"
          placeholder="Kelime ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />

        {loading ? <div className="spinner" /> : filtered.length === 0 ? (
          <p className="text-muted text-center" style={{ padding: '2rem' }}>
            {search ? 'Kelime bulunamadı' : 'Henüz kelime eklenmemiş'}
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="word-table">
              <thead>
                <tr>
                  <th>Resim</th>
                  <th>İngilizce</th>
                  <th>Türkçe</th>
                  <th>Örnek Cümleler</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(w => (
                  <tr key={w.WordID}>
                    <td>
                      {w.Picture
                        ? <img src={w.Picture} alt={w.EngWordName} className="word-thumb" />
                        : <div style={{ width: 48, height: 48, background: 'var(--gray-100)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>📷</div>
                      }
                    </td>
                    <td><strong>{w.EngWordName}</strong></td>
                    <td>{w.TurWordName}</td>
                    <td>
                      {w.samples?.length > 0
                        ? <span className="text-muted">{w.samples[0].substring(0, 50)}{w.samples[0].length > 50 ? '...' : ''}</span>
                        : <span className="text-muted">—</span>
                      }
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-sm btn-outline" onClick={() => openEdit(w)}>Düzenle</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(w.WordID)}>Sil</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <WordModal
          word={editWord}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
