# Atlas / Denge Kasabası — Kavramsal Veri Modeli, Yetki Matrisi ve Olay Sözleşmesi

> Tarih: 1 Ekim 2026 · Kaynak: plan onayı sonrası Faz 0–1 tasarım çalışması · Durum: taslak — açık kararlar §8'de; Prisma taslağı §6, üretim şeması değildir

Bu belge, onaylanan yol haritasının ilk çıktısıdır: tablo yazmadan önce kavramların,
ilişkilerin, erişim sınırlarının ve minimum olay sözleşmesinin kararlaştırılması.
Amaç, 10–15 kişilik gözetimli geliştirme denemesinin gerektirdiği **merkezi kayıt**
altyapısını, ilerideki veli paylaşımı ve analiz katmanını engellemeden kurmaktır.

İlişki belgesi: `depo-mimarisi-ve-backend-degerlendirmesi.md` §5 ve plan dosyası
`~/.devin/plans/plan-5bf693716328635d.md`.

## 1. Temel ayrımlar (plan Faz 0)

| Kavram | Tanım | Değildir |
|---|---|---|
| **Çalışma alanı** (`Workspace`) | Her kaydın bağlandığı en üst erişim sınırı. Okul veya okul dışı pilot grubu. | Okulun kendisi — okul, bir çalışma alanı türüdür |
| **Yetkili kullanıcı** (`AdultUser`) | Giriş yapan yetişkin: Atlas yöneticisi, öğretmen, kolaylaştırıcı | Katılımcı |
| **Üyelik** (`Membership`) | Yetişkinin çalışma alanına rol ve durumla bağlanması | Hesap |
| **Grup** (`Group`) | Katılımcı kümesi: sınıf, atölye grubu, pilot deneme grubu | Etkinliğin kendisi |
| **Katılımcı** (`Participant`) | Oyunu oynayan kişi; tercihen takma ad / katılımcı kodu | Giriş hesabı |
| **Etkinlik** (`ActivitySession`) | Yöneticinin bir grup için açıp kapattığı zaman aralığı | Tek bir oyun denemesi |
| **Senaryo sürümü** (`ScenarioVersion`) | Oynanan içerik/kural kümesinin değişmez referansı | Oyunun build sürümüyle birebir aynı şey |
| **Oyun denemesi** (`GameAttempt`) | Bir katılımcının bir etkinlikteki tek oyun oturumu | Kullanıcı profili |
| **İlerleme** (`AttemptState`) | Denemenin son kabul edilmiş durumu + revizyon sayacı | Rapor |
| **Olay** (`LearningEvent`) | İstemcinin gözlediği, doğrulanmış tekil davranış kaydı | Log satırı |
| **Rapor** (`ReportSnapshot`, Faz 6) | Tamamlanmış denemeden üretilen, onaylı betimleyici çıktı | Ham olay dökümü |
| **Paylaşım** (`ReportShare`, Faz 6) | Tek rapora bağlı, süreli ve iptal edilebilir erişim anahtarı | Veli hesabı |

İki kritik eşleştirme:

- **Aynı etkinlikte katılımcı başına çok deneme olabilir.** "Yeniden oyna" yeni
  `GameAttempt` açar; yenileme/devam aynı denemeyi sürdürür.
- **Alternatif plan yeni deneme değildir.** Aynı `GameAttempt` içindeki ikinci
  turdur; rapor karşılaştırması iki deneme arasında değil, deneme içinde yapılır.

## 2. Hiyerarşi

```text
Workspace                    okul | pilot çalışma alanı (okul dışı grup mümkün)
├── Membership → AdultUser   sahip | kolaylaştırıcı | görüntüleyici
├── Group                    "5-A", "Atölye Grubu B"
│   ├── Participant          takma ad / katılımcı kodu, avatar
│   └── ActivitySession      "3 Ekim sabah oturumu" (open → closed)
│        └── GameAttempt     katılımcı × etkinlik
│             ├── AttemptState       son durum + revision
│             ├── LearningEvent[]    clientEventId ile tekilleştirilmiş
│             └── ReportSnapshot[]   Faz 6: onaylı çıktılar
│                  └── ReportShare   Faz 6: süreli/iptalli erişim
└── ScenarioVersion          içerik + kural manifesti (değişmez)
```

Sınıfın sahibi öğretmen değil, çalışma alanıdır. Öğretmen ayrılırsa veya ikinci
öğretmen eklenirse grup ve kayıtları silinmez; erişim `Membership` üzerinden
yürür. Mock'taki `ClassRoom.teacherId` (tek sahip) bu yüzden üretim modeline
birebir taşınmaz.

## 3. Yetki matrisi

| Rol / kimlik | Grup + katılımcı yönetimi | Etkinlik aç/kapa | Deneme okuma | Rapor üret/onayla | Ham olay okuma |
|---|---|---|---|---|---|
| Atlas yöneticisi | tüm çalışma alanları | evet | evet | evet | evet |
| Çalışma alanı sahibi | kendi alanı | evet | kendi alanı | kendi alanı | kendi alanı |
| Kolaylaştırıcı | atandığı gruplar | evet | atandığı gruplar | atandığı gruplar | atandığı gruplar |
| Görüntüleyici | — | — | atandığı gruplar (salt-okunur) | — | tercihen hayır |
| Katılımcı | — | — | yalnız kendi denemesi (yazma: sınırlı) | — | yalnız kendi denemesi |
| Veli (Faz 6) | — | — | yalnız paylaşılan rapor | — | hayır |

Kurallar:

- Yetki **istemcinin gönderdiği alanlardan değil**, sunucudaki üyelik ve
  ilişkilerden türetilir. İstemci `workspaceId` gönderse bile sunucu oturumdaki
  kullanıcının o alana erişimini yeniden doğrular.
- Katılımcı oturumu **tek denemeye kapsamlı**dır: başka katılımcının denemesini
  ne okuyabilir ne yazabilir. Sınıf kodu + isim seçimi tek başına kimlik
  doğrulaması sayılmaz; katılımcı aktivasyonu gözetimli ilk giriş veya
  katılımcıya özel kısa erişim koduyla yapılır (karar §8.2).
- "Veli hesabı yok" kararı korunuyor: veli erişimi ileride yalnızca onaylanmış
  `ReportSnapshot`'a bağlı `ReportShare` ile olur; süre sonu + iptal + kapsam
  dâhildir. Kısa `shareCode` tek başına üretim erişim anahtarı değildir.
- Ham olay okuma, rapor okumadan daha yüksek ayrıcalıktır. Görüntüleyici ve
  veli ham `LearningEvent` akışına erişmez.

## 4. Minimum olay kataloğu (v1 sözleşmesi)

Mevcut oyunda zaten yazılan sekiz anlamlı olay + deneme yaşam döngüsü. API
isimleri İngilizce/snake_case; mevcut `SessionEventType` değerleriyle eşleme:

| API eventType | Mevcut `SessionEventType` | Payload (doğrulanır) |
|---|---|---|
| `attempt_started` | — (yeni) | `{ clientTime }` — senaryo sürümü denemede saklı |
| `choice_made` | `choice` | `{ choiceId, dialogueId? }` |
| `investigation_completed` | `investigation` | `{ cardId }` |
| `evidence_submitted` | `evidence` | `{ confirmedIds: string[] }` |
| `plan_submitted` | `plan` | `{ solutionIds, totalCost, rationale? }` |
| `announcement_submitted` | `announce` | `{ icon, headline, message }` |
| `report_classified` | `report` | `{ workedIds, problemIds }` |
| `alt_plan_submitted` | `alt-plan` | `{ solutionIds, totalCost, rationale? }` |
| `finale_submitted` | `finale` | `{ statement }` |
| `attempt_completed` | — (yeni) | `{ clientTime }` |

Kurallar:

- Her olay `payloadSchemaVersion` taşır (v1'de `1`). Yeni alan eklemek geriye
  uyumluysa aynı sürüm; anlam değişikliği yeni sürüm ister.
- Payload'lar olay türü başına allowlist + uzunluk sınırıyla doğrulanır
  (`rationale`, `message`, `statement` serbest metin → uzunluk üst sınırı +
  içerik envanterinde kayıtlı). JSONB sınırsız metadata torbası değildir.
- `solutionIds`, `cardId` vb. kimlikler **senaryo sürümü manifestinde** olmalı;
  maliyet toplamı sunucuda o sürümün kurallarıyla yeniden hesaplanır.
- Bugün kaydedilmeyen kontrol sorusu/hipotez cevapları (bkz.
  `InvestigationCard.tsx` geçici state) ayrı `answer_submitted` olayı olarak
  sonradan eklenebilir. Geriye dönük üretilemez → eski denemelerde "kayıt
  kapsamı yok" olarak görünür, "öğrenci cevap vermedi" değil.

## 5. Kayıt, tekrar gönderim ve sürümleme kuralları

### 5.1 Olay zarfı

```jsonc
{
  "clientEventId": "uuid",        // istemcide bir kez üretilir; retry'da değişmez
  "attemptId": "uuid",            // sunucu yetkisini ayrıca doğrular
  "type": "plan_submitted",
  "payloadSchemaVersion": 1,
  "sequence": 42,                 // istemci outbox sırası, attempt bazında tek
  "occurredAt": "ISO-8601",       // istemci saati (bilgilendirici)
  "payload": { "...": "..." }
}
```

- Sunucu `receivedAt`'i kendisi yazar; sıralama `sequence` + `receivedAt` ile
  yapılır. İstemci saati tek gerçek kabul edilmez.
- Benzersizlik: `(attemptId, clientEventId)` ve `(attemptId, sequence)`.
  Aynı `clientEventId` + aynı payload → tekrar, yeni satır yok (idempotent
  kabul). Aynı kimlik + **farklı** payload → `409` çatışma.
- Olay + ilişkili `AttemptState` revizyonu tek DB transaction'ında yazılır;
  yarım durum (event var, state yok) oluşmaz.

### 5.2 İstemci senkronizasyonu (Faz 3 hedefi)

1. Olay önce **kalıcı yerel kuyruğa** (IndexedDB önerilen) yazılır, sonra gönderilir.
2. Yalnız sunucu ACK'i kuyruktan düşürür; "sunucuya kaydedildi" göstergesi
   ACK'ten önce gösterilmez.
3. Ağ hatası/5xx → geri çekilme + jitter ile yeniden deneme (aynı
   `clientEventId`). `429` → `Retry-After` onurlandırılır. `401/403`/şema
   reddi → kuyruk durur, görünür "müdahale gerekiyor" durumu; sessiz düşürme
   yok.
4. Kuyruk deneme ve katılımcı bazında izole; katılımcı değişiminde eski
   kuyruk yeni katılımcıya gönderilmez.
5. Deneme oluşturma da idempotent: timeout sonrası tekrar istek ikinci deneme
   açmaz (istemci üretimli `attemptClientId` veya idempotency-key).
6. Etkinlik kapandıktan sonra gelen gecikmiş kayıtlar: sınırlı bir kapanış
   tolerans penceresi tanımlanır; kapanış sessiz veri kaybına yol açmaz.

### 5.3 Tek yazıcı politikası

Bir denemeye aynı anda tek cihaz/sekme yazar. İkinci oturum tespitinde sessiz
last-write-wins yok: kontrollü devralma ("bu deneme başka cihazda açık —
devral?") veya yeniden yükleme. İlk deneme kapsamında tek cihaz varsayımı +
devralma onayı yeterli.

### 5.4 Sürümler — üç ayrı şey

| Sürüm | Bağlandığı yer | Değişince |
|---|---|---|
| `ScenarioVersion` | `GameAttempt.scenarioVersionId` | Eski denemeler eski kural setiyle okunur |
| `payloadSchemaVersion` | Her `LearningEvent` | Okuyucular sürüme göre çözer |
| Rapor/analiz sürümü | `ReportSnapshot` / `AnalysisRun` | Eski rapor sessizce yeniden yazılmaz |

## 6. Prisma model taslağı (öneri — henüz migration yok)

```prisma
enum WorkspaceKind { SCHOOL PILOT }
enum MemberRole    { OWNER FACILITATOR VIEWER }
enum MemberStatus  { ACTIVE SUSPENDED }
enum ActivityStatus { DRAFT OPEN CLOSED }
enum AttemptStatus  { ACTIVE COMPLETED ABANDONED }

model Workspace {
  id        String   @id @default(uuid())
  kind      WorkspaceKind
  name      String
  province  String?
  district  String?
  mebCode   String?  @unique          // okulsa; tekil resmî kod
  createdAt DateTime @default(now())
  members   Membership[]
  groups    Group[]
}

model AdultUser {
  id          String   @id @default(uuid())
  authSubject String   @unique        // auth sağlayıcısının sub claim'i
  displayName String
  email       String?  @unique
  createdAt   DateTime @default(now())
  memberships Membership[]
}

model Membership {
  id          String   @id @default(uuid())
  workspaceId String
  userId      String
  role        MemberRole
  status      MemberStatus @default(ACTIVE)
  createdAt   DateTime @default(now())
  workspace   Workspace  @relation(fields: [workspaceId], references: [id])
  user        AdultUser  @relation(fields: [userId], references: [id])
  @@unique([workspaceId, userId])
  @@index([userId])
}

model Group {
  id          String   @id @default(uuid())
  workspaceId String
  name        String
  joinCode    String   @unique        // kısa giriş kodu; erişim anahtarı değil
  createdAt   DateTime @default(now())
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  participants Participant[]
  activities   ActivitySession[]
}

model Participant {
  id            String   @id @default(uuid())
  groupId       String
  displayName   String                // takma ad / katılımcı kodu; §8.3 kararı
  studentNo     String?               // pilotta kullanılmaz, okul senaryosu için
  avatar        String?
  createdAt     DateTime @default(now())
  group         Group @relation(fields: [groupId], references: [id])
  attempts      GameAttempt[]
  tokens        ParticipantToken[]
  @@index([groupId])
}

// §8.2 kararı: yönetici onaylı ilk giriş sonrası cihaza verilen sınırlı token.
// Düz token istemcide tutulur, DB'de yalnız hash saklanır.
model ParticipantToken {
  id            String   @id @default(uuid())
  participantId String
  tokenHash     String   @unique
  label         String?               // "tablet-3" gibi yönetici notu
  expiresAt     DateTime?
  revokedAt     DateTime?
  createdAt     DateTime @default(now())
  participant   Participant @relation(fields: [participantId], references: [id], onDelete: Cascade)
  @@index([participantId])
}

model ActivitySession {
  id          String   @id @default(uuid())
  groupId     String
  title       String
  status      ActivityStatus @default(DRAFT)
  openedAt    DateTime?
  closedAt    DateTime?
  createdById String
  createdAt   DateTime @default(now())
  group       Group @relation(fields: [groupId], references: [id])
  attempts    GameAttempt[]
  @@index([groupId, status])
}

model ScenarioVersion {
  id        String   @id @default(uuid())
  scenario  String                    // 'denge-kasabasi'
  version   String                    // semver veya içerik etiketi
  manifest  Json                      // kart/çözüm/kural kimlikleri + maliyetler
  createdAt DateTime @default(now())
  attempts  GameAttempt[]
  @@unique([scenario, version])
}

model GameAttempt {
  id                String   @id @default(uuid())
  participantId     String
  activityId        String
  scenarioVersionId String
  clientAttemptId   String            // idempotent oluşturma anahtarı
  status            AttemptStatus @default(ACTIVE)
  revision          Int      @default(0)   // AttemptState için optimistic lock
  startedAt         DateTime @default(now())
  completedAt       DateTime?
  participant   Participant    @relation(fields: [participantId], references: [id])
  activity      ActivitySession @relation(fields: [activityId], references: [id])
  scenarioVersion ScenarioVersion @relation(fields: [scenarioVersionId], references: [id])
  state         AttemptState?
  events        LearningEvent[]
  @@unique([activityId, clientAttemptId])
  @@index([participantId])
  @@index([activityId])
}

model AttemptState {
  attemptId String   @id
  state     Json                      // mevcut GameSession alanlarının karşılığı
  updatedAt DateTime @updatedAt
  attempt   GameAttempt @relation(fields: [attemptId], references: [id], onDelete: Cascade)
}

model LearningEvent {
  id                   String   @id @default(uuid())
  attemptId            String
  clientEventId        String
  sequence             Int
  type                 String
  payloadSchemaVersion Int
  payload              Json
  occurredAt           DateTime
  receivedAt           DateTime @default(now())
  attempt   GameAttempt @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  @@unique([attemptId, clientEventId])
  @@unique([attemptId, sequence])
  @@index([attemptId, occurredAt])
  @@index([type])
}

// Faz 6 — taslağın dışında bırakılanlar, imza önizlemesi:
// model ReportSnapshot { attemptId, reportVersion, payload Json, status, approvedById, approvedAt }
// model ReportShare    { reportId, tokenHash, expiresAt, revokedAt, createdById }
// Faz 7 — model AnalysisRun { attemptId|reportId, analysisVersion, provider?, model?, promptVersion?, output Json }
```

Notlar:

- Yeni modeller mevcut `Session`/`Event` tablolarına dokunmadan eklenir; v1
  anonim uçları v2 veri alanına erişemez (ayrı prefix + ayrı yetki katmanı).
- `ParticipantToken` §8.2 kararının ürünü: cihaz başına token, hash saklanır,
  iptal/süre sonu var. Deneme erişimi token → katılımcı → deneme sahipliği
  zinciriyle doğrulanır.
- `manifest` içeriği build sürecinden üretilir; senaryo değişince yeni
  `ScenarioVersion` satırı açılır, eski satır değişmez.

## 7. Minimum veri envanteri (ilk deneme)

| Alan | Neden | Kişisel veri notu |
|---|---|---|
| `Participant.displayName` | Listede ayırt etme | Takma ad tercihli; gerçek ad opsiyonel karar |
| `Participant.studentNo` | Okulda aynı isimleri ayırt etme | Opsiyonel; pilot grupta gereksiz |
| Yetişkin `displayName`/`email` | Giriş + yetki | Yetişkin verisi; saklama sürecine dâhil |
| Olay payload'larındaki serbest metin (`rationale`, `message`, `statement`, `announcement`) | Rapor + analiz hammaddesi | Çocuğun yazdığı metin → en hassas alan; uzunluk sınırı + paylaşım onayı |
| İstemci zamanları | Sıralama/ipucu | Kesinlik gerektirmez; `receivedAt` asıl |
| Avatar | UI | Kimliksizleştirilmiş sembol |

Saklama/silme: deneme sonrası kayıtların saklanma süresi ve silme prosedürü
§8.4'te kararlaştırılacak; rapor/paylaşım/backup kapsamıyla birlikte.

## 8. Kararlar

1. **Yetişkin auth — KARAR (1 Eki 2026):** **Supabase Auth**. Backend JWT'yi
   proje JWKS uç noktasından doğrular (`SUPABASE_URL`), `sub` claim'i
   `AdultUser.authSubject` ile eşleşir, yetkiler yine sunucuda uygulanır.
   `x-atlas-user` dev header'ı sadece `NODE_ENV ≠ production`'da çalışır —
   personel arayüzü gerçek Supabase oturumu bağlanana dek geliştirme aracıdır.
2. **Katılımcı girişi — KARAR (1 Eki 2026):** Yönetici onaylı ilk giriş.
   Çocuk grup kodu + adını/takma adını yazar; kayıt yöneticinin listesinde
   zaten varsa eşleşir, etkinlik açıkken cihaza katılımcıya kapsamlı token
   verilir (`ParticipantToken`). Yönetici listesinde olmayan ad reddedilir —
   "kimse kendini rastgele ekleyemez".
3. **Katılımcı adı — KARAR (1 Eki 2026):** Takma ad / katılımcı kodu
   (örn. `P-07`). Pilot grupta gerçek ad tutulmaz; `displayName` rumuzdur.
   `studentNo` alanı şemada opsiyonel kalır ama pilotta kullanılmaz.
4. **Saklama/silme — ERTElendi:** Otomatik silme kuralı yok; kayıtlar elle
   yönetilir, silme yönetici komutuyla yapılır. Kalıcı kural hukuki/ihtiyaç
   netleşince yazılır. Rapor ve paylaşım kayıtları da aynı ilkeye tabi.
5. **Hosting/bölge — AÇIK:** Türkiye şartı bugün yok ama gelecekte olabilir →
   taşınabilirlik kriterleri (standart Postgres, export/import, bölge
   seçimi) sağlayıcı seçiminde puanlanır.
6. **Özel pedagojik belgeler — AÇIK:** DOCX/PDF içerikleri okunamadı; metin
   kopyaları sağlanınca §4 olay kataloğu ve §7 envanter gözden geçirilir.

## 9. Faz 1 çıkış ölçütüne karşı durum

- [x] Kavram ilişkileri: §1–2 — okul dışı pilot sahte okul gerektirmiyor.
- [x] Yetki matrisi: §3 — görüntüleyici/veli ham olaya erişmiyor.
- [x] Minimum olay kataloğu: §4 — mevcut sekiz olay + yaşam döngüsü.
- [x] Kayıt/tekrar/sürümleme kuralları: §5 — idempotent, transaction'lı,
  üç ayrı sürüm.
- [x] Prisma taslağı: §6 — eklemeli, v1 tablolarına dokunmuyor.
- [x] Kararlar: §8 — auth sağlayıcısı, yönetici onaylı katılımcı girişi ve
  takma ad politikası kararlaştırıldı (1 Eki 2026). Saklama ertelendi;
  hosting ve pedagojik belgeler açık ama şema yazımını engellemiyor.

## 10. Sıradaki dar kapsamlı iş

§8'deki kararlarla birlikte:

1. `demo/backend` içine `v2` modül iskeleti + `schema.prisma`'ya §6
   modellerinin eklenmesi (mevcut `Session`/`Event` korunarak) + ilk
   migration'ın sentetik DB'de provası.
2. Olay zarfı + olay kataloğu doğrulayıcısının yazılması (DTO +
   manifest-doğrulama) ve E2E: idempotent event, transaction bütünlüğü,
   yetkisiz erişim reddi.
3. `denge-game-v2` tarafında outbox + hydrate akışının tasarım detayına
   geçilmesi (Faz 3 planı ayrıca).
