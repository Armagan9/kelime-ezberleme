const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const db = new DatabaseSync(path.join(__dirname, 'data/kelime.db'));
const uploadsDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const EMOJI = {
  apple:'🍎', book:'📚', car:'🚗', dog:'🐕', house:'🏠',
  water:'💧', tree:'🌳', sun:'☀️', moon:'🌙', fire:'🔥',
  time:'⏰', friend:'🤝', school:'🏫', music:'🎵', food:'🍽️',
  sky:'🌤️', city:'🏙️', road:'🛣️', bird:'🐦', fish:'🐟',
  flower:'🌸', river:'🏞️', mountain:'⛰️', ocean:'🌊', wind:'🌬️',
  rain:'🌧️', snow:'❄️', night:'🌃', day:'🌅', morning:'🌄',
  evening:'🌆', week:'📅', month:'📆', year:'🗓️', word:'💬',
  sentence:'✍️', letter:'✉️', number:'🔢', color:'🎨', red:'🔴',
  blue:'🔵', green:'🟢', white:'⬜', black:'⬛', big:'🐘',
  small:'🐭', fast:'⚡', slow:'🐢', hot:'🌡️', cold:'🧊',
  happy:'😊', sad:'😢', angry:'😠', tired:'😴', hungry:'🍕',
  beautiful:'✨', strong:'💪', brave:'🦁', clever:'🦊', kind:'💝',
  honest:'⚖️', dream:'💭', hope:'🌈', love:'❤️', peace:'🕊️',
  freedom:'🦅', power:'⚡', truth:'💡', life:'🌱', death:'💀',
  world:'🌍', nature:'🌿', light:'💡', dark:'🌑', voice:'🎤',
  sound:'🔊', heart:'❤️', mind:'🧠', soul:'✨', memory:'💾',
  knowledge:'📖', language:'🗣️', question:'❓', answer:'✅',
  problem:'⚠️', solution:'🔑', danger:'🚨', success:'🏆',
  failure:'❌', journey:'🗺️', story:'📖', game:'🎮', team:'👥',
  leader:'👑', future:'🚀', past:'⌛', change:'🔄', idea:'💡',
  plan:'📋', goal:'🎯', mouse:'🐭',
};

const GRADIENTS = [
  ['#4F46E5','#7C3AED'], ['#0EA5E9','#0284C7'], ['#10B981','#059669'],
  ['#F59E0B','#D97706'], ['#EF4444','#DC2626'], ['#8B5CF6','#7C3AED'],
  ['#14B8A6','#0D9488'], ['#F97316','#EA580C'], ['#EC4899','#DB2777'],
  ['#6366F1','#4F46E5'], ['#84CC16','#65A30D'], ['#06B6D4','#0891B2'],
];

function safe(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function makeSVG(engWord, turWord, emoji, index) {
  const [c1, c2] = GRADIENTS[index % GRADIENTS.length];
  const hasEmoji = !!emoji;
  const wordY = hasEmoji ? 148 : 108;
  const turY  = hasEmoji ? 178 : 145;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="300" height="200" fill="url(#g)"/>
  <rect x="12" y="12" width="276" height="176" rx="14" fill="rgba(255,255,255,0.13)"/>
  ${hasEmoji ? `<text x="150" y="95" font-size="62" text-anchor="middle" dominant-baseline="middle"
        font-family="Segoe UI Emoji,Apple Color Emoji,Noto Color Emoji,sans-serif">${emoji}</text>` : ''}
  <text x="150" y="${wordY}" font-size="${hasEmoji ? 26 : 38}" font-weight="bold"
        text-anchor="middle" fill="white"
        font-family="Segoe UI,Arial,sans-serif">${safe(engWord)}</text>
  <text x="150" y="${turY}" font-size="17" text-anchor="middle"
        fill="rgba(255,255,255,0.82)"
        font-family="Segoe UI,Arial,sans-serif">${safe(turWord)}</text>
</svg>`;
}

function main() {
  db.exec("UPDATE Words SET Picture = NULL");

  // Eski SVG/img dosyalarını temizle
  if (fs.existsSync(uploadsDir)) {
    fs.readdirSync(uploadsDir)
      .filter(f => f.startsWith('word-'))
      .forEach(f => fs.unlinkSync(path.join(uploadsDir, f)));
  }

  const words = db.prepare('SELECT WordID, EngWordName, TurWordName FROM Words').all();
  console.log(`${words.length} kelime için kart oluşturuluyor...\n`);

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const emoji = EMOJI[w.EngWordName.toLowerCase()] || null;
    const filename = `word-${w.WordID}-${w.EngWordName}.svg`;
    const svgContent = makeSVG(w.EngWordName, w.TurWordName, emoji, i);
    fs.writeFileSync(path.join(uploadsDir, filename), svgContent, 'utf8');
    db.prepare('UPDATE Words SET Picture = ? WHERE WordID = ?').run(`/uploads/${filename}`, w.WordID);
    console.log(`[${i+1}/${words.length}] ${emoji || '—'} ${w.EngWordName}`);
  }

  console.log('\nTüm kartlar oluşturuldu!');
}

main();
