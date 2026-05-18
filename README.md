# 6 Sefer Kelime Ezberleme Sistemi

Aralıklı tekrar (spaced repetition) yöntemiyle İngilizce kelime öğrenme uygulaması.

## Kullanılan Teknolojiler

- **Backend:** Node.js, Express.js, SQLite (`node:sqlite` — Node.js 22+ built-in)
- **Frontend:** React 18, Vite, React Router v6
- **Auth:** JWT (JSON Web Token), bcryptjs
- **LLM:** Claude API (Anthropic) — Word Chain hikayesi için
- **Dosya Yükleme:** Multer

## Özellikler (User Stories)

| Story | Açıklama | Puan |
|-------|----------|------|
| Story 1 | Kullanıcı Kayıt / Giriş / Şifremi Unuttum | 5 |
| Story 2 | Kelime Ekleme (İng, Türkçe, resim, örnek cümleler) | 5 |
| Story 3 | 6 Sefer Quiz Algoritması (spaced repetition) | 10 |
| Story 4 | Ayarlar — günlük yeni kelime sayısını değiştir | 5 |
| Story 5 | Analiz Raporu + yazdırma | 5 |
| Story 6 | Wordle bulmaca oyunu | 15 |
| Story 7 | Word Chain — Claude AI ile hikaye oluştur | 5 |

## Kurulum

### Gereksinimler
- Node.js v18+
- npm

### 1. Backend Kurulumu

```bash
cd backend
npm install
cp .env.example .env
# .env dosyasını düzenle (JWT_SECRET ve ANTHROPIC_API_KEY)
npm run dev
```

### 2. Frontend Kurulumu

```bash
cd frontend
npm install
npm run dev
```

Uygulama `http://localhost:5173` adresinde çalışır.
Backend `http://localhost:5000` adresinde çalışır.

## Algoritma Detayı

### 6 Sefer Öğrenme Prensibi

```
Aktif Öğrenme → 6 ÜST ÜSTE DOĞRU CEVAP → Tekrar Moduna Geç
    ↑                                              ↓
    └──── YANLIŞ CEVAP ←──────────────────────────┘
```

**Tekrar Aralıkları:**
1. +1 gün
2. +1 hafta
3. +1 ay
4. +3 ay
5. +6 ay
6. +1 yıl → **TAM ÖĞRENİLDİ** ✅

### Günlük Quiz Seçimi
1. Bugün tekrar tarihi dolan kelimeler (review)
2. Aktif öğrenme aşamasındaki kelimeler
3. Ayarlardaki limite göre yeni kelimeler (varsayılan: 10/gün)

## API Endpointleri

```
POST /api/auth/register     — Kayıt
POST /api/auth/login        — Giriş
POST /api/auth/forgot-password — Şifre sıfırlama token'ı
POST /api/auth/reset-password  — Şifreyi güncelle

GET  /api/words             — Tüm kelimeler
POST /api/words             — Kelime ekle (multipart/form-data)
PUT  /api/words/:id         — Kelime güncelle
DELETE /api/words/:id       — Kelime sil

GET  /api/quiz/today        — Bugünkü quiz soruları
POST /api/quiz/answer       — Cevap gönder
GET  /api/quiz/progress     — İlerleme özeti

GET  /api/settings          — Ayarları getir
PUT  /api/settings          — Ayarları güncelle

GET  /api/reports/summary   — Genel özet
GET  /api/reports/daily     — Günlük istatistik
GET  /api/reports/words     — Kelime bazlı istatistik

POST /api/wordle/start      — Wordle oyunu başlat
POST /api/wordle/guess      — Tahmin gönder
GET  /api/wordle/status     — Oyun durumu

POST /api/wordchain/generate  — Claude ile hikaye oluştur
GET  /api/wordchain/stories   — Kayıtlı hikayeler
DELETE /api/wordchain/stories/:id — Hikaye sil
```

## Veritabanı Şeması

```
Users          → UserID, UserName, Email, Password, ResetToken
Words          → WordID, EngWordName, TurWordName, Picture, CreatedBy
WordSamples    → WordSamplesID, WordID, Sample
UserSettings   → SettingsID, UserID, DailyNewWords
UserWordProgress → UserID, WordID, Status, ConsecutiveCorrect, ReviewLevel, NextReviewDate
QuizHistory    → HistoryID, UserID, WordID, IsCorrect, QuizDate
WordChainStories → StoryID, UserID, Words, Story, ImageDescription
```

## İster Gerçekleştirme Beyanı

| İster | Gerçekleştirildi mi? |
|-------|---------------------|
| Kullanıcı Kayıt Modülü | ✅ Evet |
| Kelime Ekleme Modülü | ✅ Evet |
| Kelime Sorgulama (Test) Modülü | ✅ Evet |
| Kelime Sıklığı Değiştirme Modülü | ✅ Evet |
| Analiz Rapor Modülü | ✅ Evet |
| Bulmaca (Wordle) Modülü | ✅ Evet |
| Word Chain (LLM) Modülü | ✅ Evet |

## Geliştirici

- **Ad Soyad:** Armağan Topal
- **E-posta:** armagantopaltc@gmail.com
