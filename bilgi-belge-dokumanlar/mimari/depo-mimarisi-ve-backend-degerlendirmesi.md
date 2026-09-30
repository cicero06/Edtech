# Depo Mimarisi ve Backend Hazırlık Değerlendirmesi

> Tarih: 30 Eylül 2026 · Kaynak: Devin ile sistem inceleme sohbeti · Durum: kararlar alındı — v2 tamamlanınca v2 backend'i kurulacak

## 1. Gerçek yapı (3 parça + 1 yedek)

```
website/                    Ana site — atlaslearningtech.com, Vercel'de canlı, statik
  ├─ denge-kasabasi-game/   v1 oyun → /denge-kasabasi/oyna/
  └─ denge-game-v2/         v2 ön gösterim → /denge-kasabasi/ongosteri/
demo/
  ├─ frontend/              v1'in ESKİ kopyası (referans olarak kalıyor)
  └─ backend/               Tek gerçek backend: NestJS 12 + Prisma 7 + PostgreSQL
render.yaml                 Render blueprint — yalnız backend servisi
```

Önemli bulgular:

- **Ana site** backend'siz tasarım; `vercel.json`, prerender, 404 hepsi yerli yerinde.
- **v1 oyunun backend kablosu var ama takılı değil:** `src/api/sessionApi.ts`
  `VITE_API_URL` ile session açıp event POST'luyor; Vercel build'inde bu env
  tanımlı olmadığı için canlıda localStorage-only çalışıyor.
- **v2 backend'siz ama bilinçli seam var:** `src/Game/data/session.ts` —
  profil, notebook, kanıt, plan, stats tek arayüzde; başlıkta "DB gelince
  sadece bu fonksiyonlar değişir" notu.
- **demo/frontend drift'i:** website/denge-kasabasi-game ondan evrilmiş ve
  daha yeni (areas, characterDialogues, evidenceSources, ek component'ler).
  Canonical frontend = website/denge-kasabasi-game.

## 2. Alınan kararlar

- `demo/frontend` yerinde kalıyor (referans); yazı modunda README'ye
  "superseded, canonical = website/denge-kasabasi-game" notu eklenecek.
- `demo/backend` yerinde kalıyor — köke taşımaya gerek yok, `render.yaml`
  zaten oraya bakıyor.
- **Sıradaki iş:** v2 tamamen bitecek → sonra sadece v2'ye özel
  veritabanı/backend yapısı kurulacak. v1 backend bağlantısı ertelendi.

## 3. Backend mevcut durumu (demo/backend)

```
main.ts             ValidationPipe (whitelist + forbidNonWhitelisted), CORS: FRONTEND_URL
SessionsController  POST/GET /sessions, POST/GET /sessions/:id/events, GET /sessions/:id/summary
SessionsService     Senaryo kuralları sunucuda doğrulanıyor: 5 bölge, 6 kaynak,
                    5 müdahale + maliyet, bütçe ≤50, max 3 müdahale, metadata reddedilir
PrismaService       PrismaClient + @prisma/adapter-pg; DATABASE_URL yoksa throw
PostgreSQL          Session (1) ──< Event (N); sessionId + eventType index; JSONB value
```

- İlk migration hazır, `prisma migrate deploy` tek komutla kurar.
- E2E test mevcut: session → event → bütçe aşımı 400 → summary türetme.
- `GET /` health check — ama PrismaModule yüzünden DB'siz app ayağa kalkmaz
  (prod health check için iyi, lokal testte DB şart).

## 4. Açık sorunlar (kapanmadan önce listesi)

1. **Postgres hiçbir yerde yok** — `DATABASE_URL` yalnız `.env.example`'da placeholder.
2. **`render.yaml` eksik** — DB servisi tanımlı değil; `DATABASE_URL` `sync: false`
   → panelden ayrıca DB açıp elle bağlamak gerekir. `plan: free` → cold start;
   Render ücretsiz Postgres'i 30 günde silinir.
3. **Deployment hedefi tutarsız** — `DEVELOPMENT_PLAN.md` Railway+Vercel diyor,
   repo `render.yaml` ile Render'a bakıyor. Karar gerekiyor.
4. **Demo frontend deployment config'i yok** — demo/ altında vercel.json yok.
5. **Read path kullanılmıyor** — frontend `/summary` ve `/events` GET'lerini
   çağırmıyor; summary ekranı göstergeleri local state'ten hesaplıyor
   (plan PHASE 7'den bilinçli/bilinçsiz sapma).
6. **Event gönderimi tek atışlık** — ilk POST hatasında `syncFailed` set,
   sonraki event'ler gönderilmiyor; retry kuyruğu yok → oturum ortası veri kaybı.
7. **7 yüksek audit bulgusu** backend bağımlılıklarında (NestJS/Multer zinciri,
   Prisma CLI) — dosya yükleme kullanılmadığı için pratik risk düşük, prod
   öncesi güncelleme değerlendirilmeli.
8. **Rate limit yok** — `POST /sessions` açık uç; PoC'te tolere edilebilir,
   canlıda `@nestjs/throttler` düşünülmeli.

## 5. v2 backend'i için ön notlar (dönünce buradan başlanacak)

1. **Seam hazır:** `denge-game-v2/src/Game/data/session.ts` —
   `loadSession`, `saveSession`, `newSession`, `clearSession` API
   karşılıkları yazılacak; entegrasyonun büyük kısmı bu.
2. **Mevcut şema yetmez:** `Session`/`Event` v1'in event-log mantığı için.
   v2'nin `GameSession`'ı (player, quest stage, completedCards, notebook,
   evidence, plan, announcedNpcIds, posterHung, stats, muted) **state
   persistence** ister → `GameState` modeli ya da session'a `state Json`
   alanı gerekecek. Auth yoksa anonim session id + resume token yaklaşımı.
3. **Gizlilik sınırı:** `PlayerProfile.name` alanı var — "kişisel veri
   toplamama" ilkesiyle çatışabilir. Takma ad zorunluluğu ya da ismi
   sunucuya göndermeme kararı lazım.
4. **Tasarım notu bağlantısı:** [v2 sonrası tasarım notları](../tasarim/v2-sonrasi-tasarim-notlari.md) §4.4 —
   öğretmen/veli paylaşımı için "hafif: indirilebilir rapor" vs
   "ağır: backend + hesap + KVKK yükü" kararı backend kapsamını belirler.
5. İleriye dönük veri ihtiyacı (tasarım notundan): işaretlenen kanıtlar,
   kontrol soruları, seçilen çözümler + gerekçe, ilk vs ikinci plan farkı,
   yansıtma seçimleri — **puan değil, davranış profili**.

## 6. Genel hazırlık tablosu

| Bileşen | Durum |
|---|---|
| Ana site + v1/v2 oyunlar | Canlıda, DB'den bağımsız |
| Backend kodu + DB şeması | ~%95 — eksik sadece canlı DB ve env'ler |
| v1 frontend API entegrasyonu | Kod hazır, env takılı değil |
| v2 backend entegrasyonu | Henüz başlanmadı — seam tasarlı |
| Canlı altyapı (DB + API) | ~%20 — blueprint var, provision yok |
