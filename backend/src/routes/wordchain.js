const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const db = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const uploadsDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Google Gemini (ücretsiz kota) ile hikaye + görsel açıklaması üretir
async function generateStory(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY tanımlı değil');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 0 }
      }
    })
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Gemini ${resp.status}: ${body.slice(0, 200)}`);
  }

  const data = await resp.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini boş yanıt döndü');
  return text.trim();
}

// Pollinations (ücretsiz, anahtarsız) ile görsel üretip app içine kaydeder
async function generateAndSaveImage(prompt) {
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=512&nologo=true`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  try {
    const resp = await fetch(url, { signal: controller.signal });
    if (!resp.ok) throw new Error(`Görsel servisi ${resp.status} döndü`);
    const buffer = Buffer.from(await resp.arrayBuffer());
    const filename = `wordchain-${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
    fs.writeFileSync(path.join(uploadsDir, filename), buffer);
    return `/uploads/${filename}`;
  } finally {
    clearTimeout(timeout);
  }
}

router.post('/generate', auth, async (req, res) => {
  const { wordIds } = req.body;
  if (!Array.isArray(wordIds) || wordIds.length < 2) {
    return res.status(400).json({ error: 'En az 2 kelime seçin' });
  }

  const placeholders = wordIds.map(() => '?').join(',');
  const words = db.prepare(`SELECT WordID, EngWordName, TurWordName FROM Words WHERE WordID IN (${placeholders})`).all(...wordIds);

  if (words.length < 2) return res.status(400).json({ error: 'Kelimeler bulunamadı' });

  const wordList = words.map((w, i) => `${i + 1}. ${w.EngWordName} (${w.TurWordName})`).join('\n');

  try {
    const prompt = `Write a short, engaging story in English using the words below. The story must be 3-5 sentences. Every word must appear in the story. Make those words bold (with **).

Words:
${wordList}

Respond ONLY in JSON format (add nothing else):
{
  "story": "English story here",
  "imageDescription": "English image scene description in one sentence"
}`;

    const text = await generateStory(prompt);

    let result;
    try {
      result = JSON.parse(text);
    } catch {
      result = { story: text, imageDescription: 'A visual scene from the story' };
    }

    // Görseli oluştur ve kaydet; başarısız olursa hikaye yine de kaydedilsin
    let imagePath = null;
    try {
      const imagePrompt = result.imageDescription || words.map(w => w.EngWordName).join(', ');
      imagePath = await generateAndSaveImage(imagePrompt);
    } catch (imgErr) {
      console.error('Görsel oluşturulamadı:', imgErr.message);
    }

    const storyRecord = db.prepare(
      'INSERT INTO WordChainStories (UserID, WordIds, Words, Story, ImageDescription, ImagePath) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(
      req.user.userId,
      JSON.stringify(wordIds),
      words.map(w => w.EngWordName).join(', '),
      result.story,
      result.imageDescription,
      imagePath
    );

    res.json({
      storyId: storyRecord.lastInsertRowid,
      story: result.story,
      imageDescription: result.imageDescription,
      imagePath,
      words: words.map(w => w.EngWordName)
    });
  } catch (err) {
    console.error('Gemini API error:', err.message);
    res.status(500).json({ error: 'Hikaye oluşturulamadı: ' + err.message });
  }
});

router.get('/stories', auth, (req, res) => {
  const stories = db.prepare(
    'SELECT * FROM WordChainStories WHERE UserID = ? ORDER BY CreatedAt DESC'
  ).all(req.user.userId);
  res.json(stories);
});

router.delete('/stories/:id', auth, (req, res) => {
  db.prepare('DELETE FROM WordChainStories WHERE StoryID = ? AND UserID = ?')
    .run(req.params.id, req.user.userId);
  res.json({ message: 'Hikaye silindi' });
});

module.exports = router;
