const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const db = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

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
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `Aşağıdaki İngilizce kelimeleri kullanarak kısa, ilgi çekici bir Türkçe hikaye yaz. Hikaye 3-5 cümle olsun. Her kelime hikayede geçsin. Kelimeleri kalın yap (** ile).

Kelimeler:
${wordList}

Yanıtı SADECE JSON formatında ver (başka hiçbir şey ekleme):
{
  "story": "Türkçe hikaye buraya",
  "imageDescription": "English image scene description in one sentence"
}`
      }]
    });

    let result;
    try {
      const text = message.content[0].text.trim();
      result = JSON.parse(text);
    } catch {
      result = {
        story: message.content[0].text,
        imageDescription: 'A visual scene from the story'
      };
    }

    const storyRecord = db.prepare(
      'INSERT INTO WordChainStories (UserID, WordIds, Words, Story, ImageDescription) VALUES (?, ?, ?, ?, ?)'
    ).run(
      req.user.userId,
      JSON.stringify(wordIds),
      words.map(w => w.EngWordName).join(', '),
      result.story,
      result.imageDescription
    );

    res.json({
      storyId: storyRecord.lastInsertRowid,
      story: result.story,
      imageDescription: result.imageDescription,
      words: words.map(w => w.EngWordName)
    });
  } catch (err) {
    console.error('Claude API error:', err.message);
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
