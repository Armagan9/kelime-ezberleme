# 6 Sefer Kelime Ezberleme Sistemi

Aralıklı tekrar (spaced repetition) yöntemiyle İngilizce kelime öğrenme uygulaması.

## Kullanılan Teknolojiler

- **Backend:** Node.js, Express.js, SQLite (`node:sqlite` — Node.js 22+ built-in)
- **Frontend:** React 18, Vite, React Router v6
- **Auth:** JWT (JSON Web Token), bcryptjs, e-posta doğrulama (6 haneli kod)
- **LLM:** Google Gemini — Word Chain hikayesi için
- **Görsel Üretimi:** Pollinations (AI) — Word Chain görseli için
- **E-posta:** Nodemailer (Gmail SMTP) — doğrulama ve şifre sıfırlama
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
| Story 7 | Word Chain — Gemini ile hikaye + AI görsel oluştur ve kaydet | 5 |

## Kurulum

### Gereksinimler
- Node.js v18+
- npm

### 1. Backend Kurulumu

```bash
cd backend
npm install
cp .env.example .env
# .env dosyasını düzenle:
#   JWT_SECRET     — rastgele gizli anahtar
#   GEMINI_API_KEY — Word Chain için (aistudio.google.com/apikey)
#   EMAIL_USER / EMAIL_PASS — e-posta için (Gmail App Password) [opsiyonel]
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
POST /api/auth/register             — Kayıt (e-posta doğrulama kodu gönderir)
POST /api/auth/verify-email         — E-posta doğrulama kodunu onayla
POST /api/auth/resend-verification  — Doğrulama kodunu tekrar gönder
POST /api/auth/login                — Giriş
POST /api/auth/forgot-password      — Şifre sıfırlama token'ı (e-posta ile)
POST /api/auth/reset-password       — Şifreyi güncelle

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

POST /api/wordchain/generate  — Gemini ile hikaye + AI görsel oluştur
GET  /api/wordchain/stories   — Kayıtlı hikayeler
DELETE /api/wordchain/stories/:id — Hikaye sil
```

## Veritabanı Şeması

```
Users          → UserID, UserName, Email, Password, ResetToken, EmailVerified, VerifyCode
Words          → WordID, EngWordName, TurWordName, Picture, AudioPath, CreatedBy
WordSamples    → WordSamplesID, WordID, Sample
UserSettings   → SettingsID, UserID, DailyNewWords
UserWordProgress → UserID, WordID, Status, ConsecutiveCorrect, ReviewLevel, NextReviewDate
QuizHistory    → HistoryID, UserID, WordID, IsCorrect, QuizDate
WordChainStories → StoryID, UserID, Words, Story, ImageDescription, ImagePath
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

## Code Smells / KISS için Yapılanlar

Projenin kod kalitesini artırmak için yapılan düzeltmeler:

### Code Smells (SonarQube)
- **`node:` öneki:** Tüm yerleşik modüller `node:fs`, `node:path`, `node:crypto` olarak import edildi (kural S7772).
- **Sürüm sızıntısı:** Express'in sürüm bilgisini açığa çıkaran başlık kapatıldı — `app.disable('x-powered-by')` (kural S5689).
- **Ölü kod:** Quiz bileşeninde hiç okunmayan `feedback` state'i kaldırıldı.
- **Kararlı React key:** Liste render'ında index yerine kararlı `key={opt.id}` kullanıldı (kural S6479).
- **Kullanılmayan bağımlılık:** `@anthropic-ai/sdk` paketi (Gemini'ye geçince gereksiz kaldı) kaldırıldı.

### KISS (Keep It Simple)
- **Katmanlı sade mimari:** `routes/` (HTTP uçları) · `services/` (iş mantığı: spaced-repetition, mail) · `config/` (veritabanı).
- **Küçük, tek sorumluluklu fonksiyonlar:** `processAnswer`, `getDailyQuizWords`, `generateStory`, `sendResetEmail`.
- **Gereksiz soyutlama yok:** Sade Express + `node:sqlite`, fazladan ORM/katman yok.
- **Tek bir kaynaktan akış:** Frontend tek `api/client.js` üzerinden konuşur; token yönetimi tek yerde (interceptor).

## Geliştirici

- Ad Soyad : Armağan Topal
- NO: 222802085
