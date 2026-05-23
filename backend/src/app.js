require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('node:path');

const app = express();
app.disable('x-powered-by'); // Express sürüm bilgisini gizle

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/words', require('./routes/words'));
app.use('/api/quiz', require('./routes/quiz'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/wordle', require('./routes/wordle'));
app.use('/api/wordchain', require('./routes/wordchain'));

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: err.message || 'Sunucu hatası' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
