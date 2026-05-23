# Öğrenci Beyanı — 6 Sefer ile Kelime Ezberleme Sistemi

## Ekip Bilgileri

| Ad Soyad | Öğrenci No |
|---|---|
| Armağan TOPAL | 222802085 |



> Birden fazla kişiyseniz satır ekleyin.

---

## Modül Beyan Tablosu

| İsterler Gerçekleştirildi | Öğrenci Beyanı |
|---|---|
| Kullanıcı Kayıt Modülü hazırladığınız yazılımda var mı? | **Evet** |
| Kelime ekleme modülü yazılımda var mı? | **Evet** |
| Kelime sorgulama modülü (test modülü) hazırladığınız yazılımda var mı? | **Evet** |
| Kelime sıklığı değiştirme Modülü hazırladığınız yazılımda var mı? | **Evet** |
| Analiz Rapor Modülü hazırladığınız yazılımda var mı? | **Evet** |
| Bulmaca Modülü | **Evet** |
| LLM Modülü | **Evet** |

---

## User Story Gerçekleştirme Durumu

| # | User Story | Puan | Durum |
|---|---|---|---|
| 1 | Kullanıcı Kayıt, Şifremi Unuttum ve Giriş | 5 | ✅ Yapıldı |
| 2 | Kelime Ekleme (İngilizce/Türkçe, resim, örnek cümleler) | 5 | ✅ Yapıldı |
| 3 | Sınav Modülü (6 Sefer tekrar algoritması) | 10 | ✅ Yapıldı |
| 4 | Ayarlar — günlük yeni kelime sayısını değiştirme | 5 | ✅ Yapıldı |
| 5 | Analiz Raporu (yazdırılabilir) | 5 | ✅ Yapıldı |
| 6 | Bulmaca (Wordle) — öğrenilen kelimelerden | 15 | ✅ Yapıldı |
| 7 | Word Chain — LLM hikaye + görsel (app içinde kaydedilir) | 5 | ✅ Yapıldı |

---

## Açıklamalar

- **6 Sefer algoritması:** Bir kelime üst üste 6 kez doğru bilinince "tekrar" havuzuna geçer; ardından 1 gün, 1 hafta, 1 ay, 3 ay, 6 ay ve 1 yıl aralıklarında doğru bilinirse "öğrenildi" havuzuna taşınır. Yanlışta süreç başa döner.
- **LLM Modülü (Word Chain):** Hikaye metni **Google Gemini** ile, ilgili görsel **AI ile (Pollinations)** üretilir ve görsel uygulama içine (`public/uploads`) kaydedilir.
- **Ek özellik — E-posta doğrulama:** Kayıt sırasında e-posta adresine 6 haneli doğrulama kodu gönderilir; doğrulanmayan hesap giriş yapamaz. Şifre sıfırlama token'ı da e-posta ile gönderilir.
- **Çalıştırma notu:** Word Chain (LLM) için `GEMINI_API_KEY`, e-posta özellikleri için `EMAIL_USER`/`EMAIL_PASS` ortam değişkenleri `.env` dosyasına girilmelidir.

---

## Çalıştırma

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (ayrı terminal)
cd frontend
npm install
npm run dev
```
