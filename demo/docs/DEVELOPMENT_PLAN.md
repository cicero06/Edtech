# Denge Kasabası — Güncel Ürün ve Geliştirme Planı

**Sürüm:** v1.0  
**Durum:** Tasarım tamamlandı, geliştirme aşamasına geçiliyor  
**Hedef:** Çalışan, canlıya alınmış ETKİM başvuru demosu / PoC  
**Ana teknoloji kararı:** React + Vite + TypeScript frontend, NestJS + TypeScript backend, PostgreSQL + Prisma, REST API

---

## 1. DEVIN İÇİN EN ÜST TALİMAT

Bu projede herhangi bir ürün veya implementasyon kararı vermeden önce aşağıdaki belgeleri oku ve bunların kapsamı dışına çıkma:

1. `PRODUCT_BRIEF.md`
2. `USER_FLOW.md`
3. `DESIGN_SYSTEM.md` (oluşturulacak / Stitch görsellerinden çıkarılacak)
4. Bu dosya: `DEVELOPMENT_PLAN.md`

### Kesin kural
Kullanıcı açıkça onaylamadan:
- yeni özellik ekleme,
- ekran ekleme,
- AI/LLM özelliği ekleme,
- kullanıcı hesabı / login ekleme,
- rozet, skor, leaderboard, streak ekleme,
- mobil uygulama oluşturma,
- 3D / AR / VR ekleme,
- multiplayer ekleme,
- kapsamı büyütme.

Amaç önce çalışan ve güvenilir bir PoC üretmektir.

---

# 2. ÜRÜN ÖZETİ

## Ürün adı
**Denge Kasabası**

## Demo senaryosu
**Su Krizi**

## Hedef yaş
**10–12 yaş**

## Tek cümlelik ürün tanımı
Denge Kasabası, 10–12 yaş öğrencilerin açık uçlu gerçek yaşam problemleri üzerinde bilgi toplama, kanıt değerlendirme, çözüm üretme, karar verme ve stratejilerini gözden geçirme süreçlerini oyun tabanlı bir ortamda destekleyen; bu süreçlerden davranışsal öğrenme göstergeleri üreten bir eğitim teknolojisi prototipidir.

## Demo problemi
Bir kasabanın su kaynakları azalıyor. Öğrenci, kasabanın su ihtiyacını karşılayacak, çevresel zararı azaltacak ve bütçeyi aşmayacak bir çözüm planı geliştirir.

Bu problemde tek bir doğru cevap yoktur. Amaç karar sürecini görünür kılmaktır.

---

# 3. EĞİTSEL / ARAŞTIRMA ODAĞI

Demo üç ana süreci gözlemlemeyi hedefler:

### 1. Problem Solving
- problemi inceleme
- bilgi toplama
- alternatif üretme
- planlama
- karar verme
- sonucu izleme
- gerektiğinde strateji değiştirme

### 2. Critical Thinking & Evidence Evaluation
- farklı kaynakları inceleme
- kaynak türlerini ayırt etme
- kanıtları karşılaştırma
- gerekçe üretme
- yeni kanıt geldiğinde kararı yeniden değerlendirme

### 3. Metacognition / Self-Regulated Learning
- güven düzeyi belirtme
- kendi kararını yeniden düşünme
- yardım / ipucu kullanma
- sonuç ile beklentiyi karşılaştırma
- stratejiyi koruma veya değiştirme

### Supporting concept
**Systems Thinking**

Su, bütçe, tarım ve çevre üzerindeki kısa / uzun vadeli etkiler birlikte gösterilir.

> Önemli metodolojik ilke: Davranışsal iz = yetkinlik puanı değildir.

---

# 4. MVP / PoC KAPSAMI

## Yapılacaklar
- 1 yaş grubu
- 1 senaryo
- 8 ekran
- 2D web arayüzü
- React frontend
- NestJS backend
- PostgreSQL veritabanı
- REST API
- event logging
- rule-based scaffolding
- tek revizyon döngüsü
- session summary
- canlı deployment

## Yapılmayacaklar
- login / register
- gerçek öğrenci profili
- gerçek çocuk kişisel verisi
- ebeveyn hesabı
- gerçek yetkinlik puanı
- multiplayer
- chatbot
- LLM
- machine learning
- büyük öğretmen dashboard'u
- leaderboard
- streak
- badge
- payment
- reklam
- mobile app
- 3D
- AR / VR
- ek senaryolar
- farklı oyun modları

---

# 5. ANA KULLANICI AKIŞI

```text
01 Intro
   ↓
02 Town Map
   ↓
03 Research
   ↓
04 Planning
   ↓
05 Decision
   ↓
06 Outcome
   ↓
07 Reflection
   ↓
08 Session Summary
```

Reflection ekranında en fazla **bir revizyon döngüsü** vardır.

```text
Reflection
  ├── Planı koru → Session Summary
  └── Planı değiştir → Planning → Decision → Final Outcome → Session Summary
```

İkinci kez revizyon yapılamaz.

---

# 6. EKRANLAR

## 01 — Intro
Amaç:
- senaryoyu tanıtmak
- problemi açıklamak
- görevi başlatmak

Ana CTA:
`GÖREVE BAŞLA`

---

## 02 — Town Map
Amaç:
- kasabayı keşfetmek
- 5 bölgeyi incelemek

Bölgeler:
- Baraj
- Evler
- Tarım
- Park
- Belediye

Header:
- Su: 42%
- Bütçe: 50

Ana CTA:
`BİLGİLERİ ARAŞTIR`

---

## 03 — Research
Amaç:
- farklı bilgi kaynaklarını incelemek
- kaynak türlerini karşılaştırmak

Kaynaklar:
1. Belediye mühendisi — Uzman görüşü
2. Çiftçi — Paydaş görüşü
3. Çevre uzmanı — Uzman görüşü
4. Su kullanım verisi — Veri / grafik
5. Sosyal medya paylaşımı — Doğrulanmamış iddia
6. Belediye bütçe bilgisi — Resmî veri

Onaylı örnek kanıt:
> Şebekedeki suyun yaklaşık %18'i kaçaklardan kaybediliyor.

Kaynak türü:
`Uzman / ölçüm verisi`

Ana CTA:
`PLAN OLUŞTURMAYA GEÇ`

---

## 04 — Planning
Amaç:
- çözüm seçeneklerini karşılaştırmak
- en fazla 3 müdahale seçmek
- bütçeyi aşmamak

### Müdahaleler

#### 1. Şebeke kaçaklarını onar
- Maliyet: 20
- Su etkisi: yüksek
- Çevresel risk: düşük

#### 2. Tarımsal sulamayı azalt
- Maliyet: 5
- Su etkisi: yüksek
- Tarım etkisi: olumsuz olabilir

#### 3. Park sulamasını azalt
- Maliyet: 2
- Su etkisi: düşük
- Çevresel etki: orta

#### 4. Yağmur suyu toplama sistemi kur
- Maliyet: 25
- Su etkisi: orta
- Uzun vadeli fayda: yüksek

#### 5. Yeni kuyu aç
- Maliyet: 15
- Kısa vadeli su etkisi: yüksek
- Uzun vadeli çevresel sonuç: belirsiz

Kural:
- maksimum 3 müdahale
- toplam bütçe 50

Ana CTA:
`KARAR AŞAMASINA GEÇ`

---

## 05 — Decision
Amaç:
- seçilen planı gözden geçirmek
- gerekçe belirtmek
- güven düzeyi belirtmek

Demo örnek plan:
- Şebeke kaçaklarını onar
- Yağmur suyu toplama sistemi kur
- Park sulamasını azalt

Toplam maliyet:
`47`

Kalan bütçe:
`3`

### Gerekçe seçenekleri
- En fazla su tasarrufu sağladığını düşünüyorum.
- Bütçe ile fayda arasında iyi denge kuruyor.
- Çevreye daha az zarar vereceğini düşünüyorum.
- Birden fazla sorunu aynı anda çözüyor.
- Diğer

### Confidence
1–5 arası.

Ana CTA:
`PLANI UYGULA`

---

## 06 — Outcome
Amaç:
- planın sonuçlarını göstermek
- trade-off'ları görünür kılmak
- yeni kanıt sunmak

Demo örnek sonuç:

### Su
- önce: 42%
- sonra: 64%
- değişim: +22

### Bütçe
- önce: 50
- sonra: 3
- değişim: -47

### Tarım
- belirgin olumsuz etki görülmedi

### Çevre
- su kaybı azaldı
- uzun vadeli su yönetimi iyileşti

### Yeni bilgi
Yeni hava tahmini:

> Önümüzdeki üç ayda yağışların normalin yaklaşık %40 altında kalması bekleniyor.

Sonuç:
Yağmur suyu toplama sisteminin kısa vadede beklenenden daha az su sağlaması mümkün olabilir.

Ana CTA:
`SONUÇLARI DEĞERLENDİR`

---

## 07 — Reflection
Amaç:
- sonucu ve yeni kanıtı yeniden değerlendirmek
- planı koruma / değiştirme kararını almak

Sorular:

### Soru 1
`Beklemediğin bir sonuç veya yeni bilgi oldu mu?`

- Evet
- Hayır

### Soru 2
`Yeni bilgi kararını etkiledi mi?`

- Evet, planımı değiştirmek istiyorum.
- Hayır, mevcut planımı koruyorum.

Ana CTA:
`DEĞERLENDİRMEYİ TAMAMLA`

Kural:
- kullanıcı planı değiştirirse sadece bir kez Planning ekranına dönebilir.

---

## 08 — Session Summary
Amaç:
- oturum boyunca gözlenen süreçleri göstermek
- skor vermemek
- araştırma yaklaşımını görünür kılmak

### Örnek göstergeler
- İncelenen bölgeler: 4/5
- İncelenen bilgi kaynakları: 5/6
- Değerlendirilen çözüm seçenekleri: 5
- Oluşturulan plan sayısı: 2
- Yardım / ipucu kullanımı: 1
- Yeni kanıt görüntülendi: Evet
- Yeni kanıt sonrası strateji değiştirildi: Evet
- Reflection tamamlandı: Evet

### Disclaimer
**Bu göstergeler gözlenen etkileşim süreçlerini tanımlar. Bunlar doğrulanmış yetkinlik puanları değildir.**

Ana CTA:
`DEMOYU TAMAMLA`

---

# 7. STITCH TASARIM DOSYALARI

Stitch export'u aşağıdaki klasörleri içeriyor:

```text
01_intro_high_fidelity/
02_town_map_high_fidelity/
03_research_high_fidelity/
04_planning_high_fidelity/
05_decision_high_fidelity/
06_outcome_high_fidelity/
07_reflection_high_fidelity/
08_session_summary_high_fidelity/
eco_balance_quest/
```

Her ekran için mevcut export:
- `code.html`
- `screen.png`

Ek olarak:
- `eco_balance_quest/DESIGN.md`

## Stitch kullanım kuralı
Stitch kodu final frontend olarak doğrudan kullanılmamalıdır.

Kullanım amacı:
- görsel referans
- spacing / renk / tipografi referansı
- Tailwind / HTML yapısı için referans
- component tasarımı için başlangıç noktası

React uygulaması temiz component yapısı ile yeniden oluşturulmalıdır.

---

# 8. TEKNOLOJİ MİMARİSİ

```text
React + Vite + TypeScript
          │
          │ HTTPS REST API
          ▼
NestJS + TypeScript
          │
        Prisma
          │
          ▼
PostgreSQL
```

## Frontend
- React
- Vite
- TypeScript
- CSS / Tailwind kararı Stitch export incelemesinden sonra
- `fetch` veya Axios
- React state yönetimi: önce built-in hooks / Context
- gereksiz state library ekleme

## Backend
- NestJS
- TypeScript
- REST API
- Prisma ORM
- PostgreSQL
- DTO validation
- CORS configuration
- environment variables

## Database
PostgreSQL

---

# 9. DEPLOYMENT PLANI

## Frontend
**Vercel**

Önerilen domain örneği:

```text
https://denge-kasabasi.vercel.app
```

## Backend
**Railway**

Önerilen API örneği:

```text
https://denge-kasabasi-api.up.railway.app
```

## Database
İlk PoC için:
**Railway PostgreSQL**

Bu yapı ilk sürümde operasyonel karmaşıklığı azaltır.

---

# 10. REPOSITORY YAPISI

Tek GitHub repository:

```text
denge-kasabasi/
│
├── frontend/
│   ├── public/
│   │   └── assets/
│   │
│   ├── src/
│   │   ├── components/
│   │   ├── screens/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   ├── data/
│   │   ├── context/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── .env.example
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── sessions/
│   │   ├── events/
│   │   ├── scenarios/
│   │   ├── summary/
│   │   ├── prisma/
│   │   ├── app.module.ts
│   │   └── main.ts
│   │
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   │
│   ├── .env.example
│   └── package.json
│
├── docs/
│   ├── PRODUCT_BRIEF.md
│   ├── USER_FLOW.md
│   ├── DESIGN_SYSTEM.md
│   └── DEVELOPMENT_PLAN.md
│
├── stitch-export/
│
├── .gitignore
└── README.md
```

---

# 11. FRONTEND SCREEN COMPONENTS

Önerilen yapı:

```text
src/screens/
├── IntroScreen.tsx
├── TownMapScreen.tsx
├── ResearchScreen.tsx
├── PlanningScreen.tsx
├── DecisionScreen.tsx
├── OutcomeScreen.tsx
├── ReflectionScreen.tsx
└── SessionSummaryScreen.tsx
```

Shared components:

```text
src/components/
├── AppHeader.tsx
├── TaskPanel.tsx
├── PrimaryButton.tsx
├── StatusChip.tsx
├── SectionCard.tsx
├── HintBox.tsx
├── ProgressBadge.tsx
└── OptionCard.tsx
```

İlk aşamada aşırı component abstraction yapılmamalıdır.

---

# 12. SENARYO VERİ MODELİ

İçerik UI component'lerinin içine hard-code edilmemelidir.

Önerilen:

```text
src/data/scenario.ts
```

veya:

```text
src/data/scenario.json
```

Temel yapı:

```ts
interface Scenario {
  id: string;
  title: string;
  intro: ScenarioIntro;
  locations: Location[];
  evidenceSources: EvidenceSource[];
  interventions: Intervention[];
  outcomes: OutcomeRule[];
  newEvidence: NewEvidence;
  reflectionQuestions: ReflectionQuestion[];
}
```

---

# 13. UYGULAMA STATE MODELİ

Frontend'de temel session state:

```ts
interface GameSessionState {
  sessionId: string | null;

  currentScreen: number;

  exploredLocations: string[];
  viewedSources: string[];

  selectedInterventions: string[];

  selectedReason: string | null;
  confidence: number | null;

  outcomeViewed: boolean;
  newEvidenceViewed: boolean;

  reflectionUnexpectedResult: boolean | null;
  wantsRevision: boolean | null;

  revisionCount: number;

  hintCount: number;

  completed: boolean;
}
```

`revisionCount` maksimum `1`.

---

# 14. EVENT LOGGING

Bu proje için event logging temel Ar-Ge özelliğidir.

## Önerilen event yapısı

```ts
interface SessionEvent {
  id?: string;
  sessionId: string;

  eventType: string;

  timestamp: string;

  screen: string;

  target?: string;

  value?: unknown;

  metadata?: Record<string, unknown>;
}
```

## Ana event'ler

```text
session_started
location_opened
source_opened
source_compared
intervention_viewed
intervention_selected
intervention_removed
reason_selected
confidence_submitted
plan_submitted
outcome_viewed
new_evidence_viewed
hint_requested
reflection_answered
strategy_changed
belief_revised
session_completed
```

---

# 15. BACKEND API

## Session

### Create session

```http
POST /sessions
```

Örnek response:

```json
{
  "id": "uuid",
  "scenarioId": "water-crisis",
  "createdAt": "..."
}
```

---

### Get session

```http
GET /sessions/:id
```

---

## Events

### Add event

```http
POST /sessions/:id/events
```

Request:

```json
{
  "eventType": "source_opened",
  "screen": "research",
  "target": "municipality_engineer",
  "value": null,
  "metadata": {}
}
```

### Get session events

```http
GET /sessions/:id/events
```

---

## Summary

```http
GET /sessions/:id/summary
```

Örnek response:

```json
{
  "locationsExplored": 4,
  "sourcesViewed": 5,
  "interventionsReviewed": 5,
  "plansCreated": 2,
  "hintsRequested": 1,
  "newEvidenceViewed": true,
  "strategyChanged": true,
  "reflectionCompleted": true
}
```

Bu endpoint **competency score üretmez**.

---

# 16. PRISMA VERİ MODELİ — İLK VERSİYON

Minimum schema:

```prisma
model Session {
  id          String   @id @default(uuid())
  scenarioId  String
  startedAt   DateTime @default(now())
  completedAt DateTime?

  events      Event[]
}

model Event {
  id        String   @id @default(uuid())
  sessionId String

  eventType String
  screen    String
  target    String?
  value     Json?
  metadata  Json?

  createdAt DateTime @default(now())

  session Session @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([sessionId])
  @@index([eventType])
}
```

Bu PoC için yeterlidir.

User tablosu eklenmemelidir.

---

# 17. RULE-BASED SCAFFOLDING

V0.1'de AI kullanılmayacak.

### Rule 1
Kullanıcı Decision aşamasına geçmek isterken 2'den az bilgi kaynağı incelemişse:

```text
Karar vermeden önce birkaç farklı bilgi kaynağını daha incelemek ister misin?
```

Bu zorunlu engel olmak zorunda değildir; formative prompt olabilir.

### Rule 2
İlk sonuçtan sonra kullanıcı yeni kanıtı gördüğü halde herhangi bir değerlendirme yapmadan devam etmeye çalışırsa:

```text
Yeni bilginin planındaki hangi seçeneği etkileyebileceğini düşün.
```

### Rule 3
Revision en fazla bir defa.

---

# 18. SESSION SUMMARY HESAPLAMA

Summary verileri event log'dan türetilmelidir.

Örneğin:

```text
locationsExplored
= unique(location_opened.target)

sourcesViewed
= unique(source_opened.target)

interventionsReviewed
= unique(intervention_viewed.target)

plansCreated
= count(plan_submitted)

hintsRequested
= count(hint_requested)

newEvidenceViewed
= exists(new_evidence_viewed)

strategyChanged
= exists(strategy_changed)

reflectionCompleted
= exists(reflection_answered)
```

UI'da bunlar skor değil, **Observed Process Indicators / Gözlenen Süreç Göstergeleri** olarak sunulmalıdır.

---

# 19. GİZLİLİK / ÇOCUK GÜVENLİĞİ

PoC sırasında:
- isim alınmayacak
- e-posta alınmayacak
- doğum tarihi alınmayacak
- telefon alınmayacak
- lokasyon alınmayacak
- gerçek çocuk profili oluşturulmayacak

Session anonim UUID ile tutulacak.

Database'e mümkün olan minimum davranışsal event yazılacak.

---

# 20. FRONTEND ↔ BACKEND BAĞLANTISI

Frontend env:

```env
VITE_API_URL=http://localhost:3000
```

Production:

```env
VITE_API_URL=https://denge-kasabasi-api.up.railway.app
```

Backend env:

```env
DATABASE_URL=postgresql://...
FRONTEND_URL=http://localhost:5173
PORT=3000
```

Production:

```env
FRONTEND_URL=https://denge-kasabasi.vercel.app
```

NestJS CORS:

```ts
app.enableCors({
  origin: process.env.FRONTEND_URL,
  credentials: false,
});
```

PoC için authentication yoktur.

---

# 21. GELİŞTİRME SIRASI

## PHASE 0 — Repository
Amaç:
Monorepo iskeleti ve Git.

Çıktı:
- `/frontend`
- `/backend`
- `/docs`
- `/stitch-export`

---

## PHASE 1 — Frontend Skeleton
Amaç:
8 ekranın routing/state ile çalışması.

Önce stil mükemmel olmak zorunda değildir.

Tamamlanma kriteri:
Intro'dan Summary'ye kadar ekran değişimi çalışıyor.

---

## PHASE 2 — Stitch UI Transfer
Her ekran sırayla React'e çevrilecek:

1. Intro
2. Town Map
3. Research
4. Planning
5. Decision
6. Outcome
7. Reflection
8. Session Summary

Stitch `screen.png` görsel referans,
`code.html` implementasyon referansı olarak kullanılacak.

---

## PHASE 3 — Scenario State
Amaç:
hard-coded screenshot yerine gerçek etkileşim.

Eklenir:
- location selection
- source selection
- intervention selection
- budget calculation
- reason selection
- confidence
- reflection choices
- revision cycle

---

## PHASE 4 — NestJS Backend
Eklenir:
- sessions module
- events module
- summary module
- prisma module

Endpoint'ler oluşturulur.

---

## PHASE 5 — PostgreSQL
Prisma migration.

Minimum tablolar:
- Session
- Event

---

## PHASE 6 — Event Logging
Frontend event'leri API üzerinden backend'e yollar.

UI davranışı API başarısız olursa tamamen bozulmamalı.
PoC için kullanıcıya sade hata mesajı gösterilebilir.

---

## PHASE 7 — Summary
Session Summary endpoint'i event'lerden gerçek veriyi hesaplar.

Frontend ekran 08 API'den summary alır.

---

## PHASE 8 — Polish
- responsive sanity check
- spacing
- hover
- selected states
- error handling
- loading
- text consistency
- accessibility
- exact Stitch visual alignment

---

## PHASE 9 — Deployment

### Backend
Railway:
- NestJS
- PostgreSQL
- DATABASE_URL
- FRONTEND_URL

### Frontend
Vercel:
- VITE_API_URL
- GitHub auto-deployment

---

## PHASE 10 — Final Demo Validation

Test:

```text
New session
→ Intro
→ Town Map
→ Research
→ Planning
→ Decision
→ Outcome
→ Reflection
→ Summary
```

Kontrol:
- event'ler DB'ye yazılıyor mu?
- revision maksimum 1 mi?
- budget doğru mu?
- outcome doğru mu?
- summary gerçek event verisini gösteriyor mu?
- refresh sonrası kritik hata var mı?
- production frontend API'ye erişiyor mu?
- CORS doğru mu?

---

# 22. KODLAMA ÖNCELİKLERİ

Öncelik sırası:

```text
1. Çalışan akış
2. Doğru state
3. Backend bağlantısı
4. Event logging
5. Summary
6. Visual fidelity
7. Minor polish
```

Önce pixel-perfect tasarım yapıp işlevselliği geciktirme.

---

# 23. DEVIN ÇALIŞMA KURALLARI

Devin her görevin başında:

1. İlgili dosyaları oku.
2. Mevcut kodu incele.
3. Scope dışı değişiklik yapma.
4. Gerekmedikçe dependency ekleme.
5. Çalışan kodu gereksiz refactor etme.
6. Her değişiklik sonrası build/test çalıştır.
7. TypeScript hatalarını bırakma.
8. Console error bırakma.
9. Hard-coded örnek metinleri PRODUCT_BRIEF ile uyumlu tut.
10. Commit'leri küçük ve açıklayıcı tut.

---

# 24. DEVIN'E VERİLEBİLECEK İLK ANA PROMPT

```text
You are implementing the Denge Kasabası educational game PoC.

Before making any implementation or product decision, read:

- docs/PRODUCT_BRIEF.md
- docs/USER_FLOW.md
- docs/DESIGN_SYSTEM.md
- docs/DEVELOPMENT_PLAN.md

Also inspect the Stitch export under /stitch-export.

Important constraints:

- Frontend: React + Vite + TypeScript
- Backend: NestJS + TypeScript
- Database: PostgreSQL
- ORM: Prisma
- API: REST
- Frontend deployment target: Vercel
- Backend deployment target: Railway
- Database deployment target: Railway PostgreSQL
- No authentication in v0.1
- No AI/LLM in v0.1
- No competency scoring
- No extra screens or features
- Maximum one revision cycle

Stitch HTML is reference code, not the final application architecture.
Build clean reusable React components while matching the Stitch screen PNGs visually.

Do not expand product scope without explicit approval.

First task:
Create the repository/application skeleton with:

/frontend
/backend
/docs
/stitch-export

Initialize:
- React + Vite + TypeScript inside /frontend
- NestJS + TypeScript inside /backend

Do not implement product screens yet.

Add appropriate .gitignore and .env.example files.

Confirm both applications build successfully before proceeding.
```

---

# 25. DEFINITION OF DONE — PoC

Proje PoC olarak tamamlanmış sayılırsa:

- [ ] 8 ekran React'te çalışıyor
- [ ] Stitch tasarımına yeterince yakın
- [ ] kullanıcı gerçek bir session başlatabiliyor
- [ ] map locations seçilebiliyor
- [ ] sources görüntülenebiliyor
- [ ] intervention seçimi çalışıyor
- [ ] max 3 kuralı çalışıyor
- [ ] budget hesaplanıyor
- [ ] reason seçiliyor
- [ ] confidence seçiliyor
- [ ] outcome gösteriliyor
- [ ] new evidence gösteriliyor
- [ ] reflection çalışıyor
- [ ] max 1 revision uygulanıyor
- [ ] event'ler NestJS API'ye gönderiliyor
- [ ] event'ler PostgreSQL'de saklanıyor
- [ ] summary gerçek event'lerden hesaplanıyor
- [ ] competency score üretilmiyor
- [ ] Vercel frontend canlı
- [ ] Railway API canlı
- [ ] production DB çalışıyor
- [ ] frontend ↔ backend CORS doğru
- [ ] demo baştan sona kritik hata olmadan tamamlanıyor

---

# 26. GELECEK SÜRÜMLER — ŞİMDİ YAPILMAYACAK

PoC sonrasında değerlendirilebilir:

- öğretmen dashboard'u
- çoklu senaryo
- farklı yaş grupları
- adaptive scaffolding
- learner modeling
- AI destekli feedback
- doğal dil gerekçe analizi
- competency validation study
- longitudinal data
- school pilot
- accessibility personalization
- dashboard analytics
- MEB / TYMM içerik eşlemeleri

Bunlar **v0.1 kapsamı değildir**.

---

# 27. SON MİMARİ KARAR

```text
                ┌──────────────────────┐
                │       VERCEL         │
                │ React + Vite + TS    │
                │     Frontend         │
                └──────────┬───────────┘
                           │
                           │ REST / HTTPS
                           ▼
                ┌──────────────────────┐
                │      RAILWAY         │
                │ NestJS + TypeScript  │
                │       API            │
                └──────────┬───────────┘
                           │
                           │ Prisma
                           ▼
                ┌──────────────────────┐
                │      RAILWAY         │
                │     PostgreSQL       │
                └──────────────────────┘
```

Source control:

```text
GitHub
   │
   ├── Vercel automatic frontend deployment
   └── Railway automatic backend deployment
```

---

# 28. UYGULAMA FELSEFESİ

Denge Kasabası'nın değeri öğrencinin yalnızca hangi cevabı verdiğini görmek değildir.

Temel soru:

> **Öğrenci o karara nasıl ulaştı?**

Sistem bu nedenle şu süreçleri görünür hale getirir:

```text
Keşif
→ Bilgi toplama
→ Kanıt değerlendirme
→ Alternatifleri karşılaştırma
→ Planlama
→ Karar verme
→ Sonuçları gözlemleme
→ Yeni kanıtı değerlendirme
→ Stratejiyi yeniden düşünme
```

Ve bu verileri yalnızca **gözlenen süreç göstergeleri** olarak sunar.

