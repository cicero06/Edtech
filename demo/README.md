# Denge Kasabası — Su Krizi PoC

Uygulama kökü bu `demo/` dizinidir. Frontend ve backend ayrı npm projeleridir; ek veya iç içe bir proje kökü yoktur.

Sekiz ekranlı React uygulaması, anonim session state, tek plan revizyon döngüsü ve gözlenebilir event akışı uygulanmıştır. NestJS REST API, Prisma `Session`/`Event` modelleri ve PostgreSQL persistence mevcuttur. Deployment henüz oluşturulmamıştır.

## Gereksinimler

- Node.js 24.x
- npm 11.x
- Yerel başlangıç iskeletini çalıştırmak için PostgreSQL gerekmez.

Kurulum Node.js 24.20.0 ve npm 11.19.0 ile doğrulanmıştır. İlk bağımlılık çözümlemesinde 3 Eylül 2026 öncesi sürümler kullanılmıştır. Her uygulamanın `package-lock.json` dosyası korunmalıdır.

## Dizin yapısı

```text
demo/
├── frontend/
│   ├── public/
│   ├── src/
│   ├── .env.example
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
├── backend/
│   ├── src/
│   ├── test/
│   ├── .env.example
│   ├── package.json
│   ├── package-lock.json
│   ├── nest-cli.json
│   ├── tsconfig.json
│   ├── tsconfig.build.json
│   ├── vitest.config.ts
│   └── vitest.config.e2e.ts
├── docs/
│   ├── PRODUCT_BRIEF.md
│   ├── USER_FLOW.md
│   ├── SCENARIO_RULES.md
│   ├── DEVELOPMENT_PLAN.md
│   └── DESIGN_SYSTEM.md
├── stitch-export/
│   └── stitch_denge_kasabas_wireframe_continuation/
│       ├── 01_intro_high_fidelity/
│       ├── 02_town_map_high_fidelity/
│       ├── 03_research_high_fidelity/
│       ├── 04_planning_high_fidelity/
│       ├── 05_decision_high_fidelity/
│       ├── 06_outcome_high_fidelity/
│       ├── 07_reflection_high_fidelity/
│       ├── 08_session_summary_high_fidelity/
│       └── eco_balance_quest/
├── .gitignore
└── README.md
```

`../researchdocs/` uygulama dışında kalır. Akademik ve pazar araştırması belgeleri taşınmamış veya değiştirilmemiştir.

## Kurulum

Aşağıdaki komutları `demo/` dizininden çalıştır:

```sh
npm --prefix frontend ci
npm --prefix backend ci
```

Örnek ortam dosyalarını gerektiğinde yerel dosyalara kopyala; mevcut dosyaların üzerine yazma:

```sh
cp -n frontend/.env.example frontend/.env
cp -n backend/.env.example backend/.env
```

- Frontend: `VITE_API_URL=http://localhost:3000`. Tanımlanırsa anonim session ve event'ler REST API'ye gönderilir; tanımlanmazsa uygulama yalnızca localStorage ile çalışır. `VITE_` değişkenleri tarayıcıya açıktır ve gizli bilgi içeremez.
- Backend: `PORT=3000`; başlangıç komutları `.env` dosyasını Node.js üzerinden yükler. Mevcut süreç ortamı önceliklidir.
- `FRONTEND_URL` CORS origin'ini, `DATABASE_URL` Prisma/PostgreSQL bağlantısını belirler. Veritabanı URL'sindeki `USER` ve `PASSWORD` yerel değerlerle değiştirilmesi gereken yer tutuculardır.
- Gerçek `.env` dosyaları Git'e eklenmemelidir; `.env.example` dosyaları sürüm kontrolünde tutulmalıdır.

İlk yerel veritabanı kurulumunda backend dizinindeki `DATABASE_URL` tanımlandıktan sonra:

```sh
npm --prefix backend exec prisma generate
npm --prefix backend exec prisma migrate deploy
```

## Geliştirme

İki ayrı terminalde, `demo/` dizininden:

```sh
npm --prefix frontend run dev
```

Frontend varsayılan adresi: `http://localhost:5173`. Tam anonim oyun akışı Intro'dan Session Summary'ye kadar çalışır.

```sh
npm --prefix backend run start:dev
```

Backend varsayılan adresi: `http://localhost:3000`. `GET /` sağlık kontrolüne ek olarak `/sessions`, `/sessions/:id/events` ve `/sessions/:id/summary` endpoint'leri kullanılabilir.

## Doğrulama

```sh
npm --prefix frontend run typecheck
npm --prefix frontend run build
npm --prefix frontend run lint
npm --prefix frontend test
npm --prefix backend run build
npm --prefix backend run lint
npm --prefix backend test
npm --prefix backend run test:e2e
npm --prefix backend exec prisma validate
```

Build çıktıları uygulamaların kendi `dist/` dizinlerindedir ve Git'e eklenmez.

Derlenmiş uygulamaları yerelde kontrol etmek için:

```sh
npm --prefix frontend run preview
npm --prefix backend run start:prod
```

Vite preview yalnızca yerel build kontrolü içindir; production sunucusu değildir.

## Belgeler ve koruma sınırları

- Senaryo mantığının yetkili kaynağı [SCENARIO_RULES.md](docs/SCENARIO_RULES.md) dosyasıdır.
- Geliştirme planının güncel konumu [docs/DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md) dosyasıdır. İçeriği değiştirilmeden taşınmıştır.
- Kilitli `PRODUCT_BRIEF.md` ve `USER_FLOW.md` içindeki eski `../../DEVELOPMENT_PLAN_Denge_Kasabasi.md` yolları taşıma sonrası geçerli değildir. Bu belgeleri değiştirmeme talimatı nedeniyle yollar korunmuştur; plan için yukarıdaki güncel bağlantı kullanılmalıdır.
- Kilitli `PRODUCT_BRIEF.md`, `USER_FLOW.md` ve `SCENARIO_RULES.md` değiştirilmemiştir.
- Stitch dizini bütün olarak taşınmıştır; tüm HTML, PNG ve `DESIGN.md` içerikleri korunmuştur. Bunlar yalnızca görsel/yerleşim referansıdır.
- `DESIGN_SYSTEM.md` kurulum öncesinde mevcut değildi; tasarım kararı içermeyen bir yer tutucu olarak oluşturulmuştur.
- Geliştirme planındaki eski event ve senaryo veri dosyası önerileri bu görevde düzeltilmemiştir; senaryo mantığında kilitli kurallar esas alınmalıdır.

## Bağımlılık kontrol notları

10 Eylül 2026 kontrolünde frontend audit sonucu temizdir. Backend production audit raporunda NestJS/Multer zinciri ile Prisma CLI yapılandırma bağımlılıklarında toplam yedi yüksek önem dereceli bulgu vardır. Uygulamada dosya yükleme veya MySQL bağlantısı kullanılmaz; yine de production öncesinde upstream güncellemeler değerlendirilmelidir. Breaking downgrade uygulayacak `npm audit fix --force` çalıştırılmamıştır.

NestJS şablonunun `vite-tsconfig-paths` bağımlılığı testlerde Vite'ın yerleşik çözümleyicisine geçiş önerisi gösterir; testleri engellemez. Şablon yapılandırması bu nedenle değiştirilmemiştir.
