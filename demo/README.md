# Denge Kasabası — Başlangıç İskeleti

Uygulama kökü bu `demo/` dizinidir. Frontend ve backend ayrı npm projeleridir; ek veya iç içe bir proje kökü yoktur.

Bu aşamada yalnızca React + Vite + TypeScript ve NestJS + TypeScript başlangıç iskeletleri vardır. Ürün ekranı, oyun mantığı, senaryo veri dosyası, Prisma modeli, veritabanı bağlantısı veya deployment oluşturulmamıştır.

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

- Frontend: `VITE_API_URL=http://localhost:3000`. İskelet henüz API isteği yapmaz. `VITE_` değişkenleri tarayıcıya açıktır; gizli bilgi içeremez.
- Backend: `PORT=3000`; başlangıç komutları varsa `.env` dosyasını Node.js üzerinden yükler. Mevcut süreç ortamı önceliklidir.
- `FRONTEND_URL` ve `DATABASE_URL` sonraki entegrasyon fazları için örnektir; henüz kullanılmaz. Veritabanı URL'sindeki `USER` ve `PASSWORD` gerçek kimlik bilgileri değildir.
- Gerçek `.env` dosyaları Git'e eklenmemelidir; `.env.example` dosyaları sürüm kontrolünde tutulmalıdır.

## Geliştirme

İki ayrı terminalde, `demo/` dizininden:

```sh
npm --prefix frontend run dev
```

Frontend varsayılan adresi: `http://localhost:5173`. Yalnızca kurulumun hazır olduğunu belirten teknik bir yer tutucu gösterir.

```sh
npm --prefix backend run start:dev
```

Backend varsayılan adresi: `http://localhost:3000`. Standart NestJS `GET /` endpoint'i `Hello World!` döndürür; ürün API'si değildir.

## Doğrulama

```sh
npm --prefix frontend run build
npm --prefix frontend run lint
npm --prefix backend run build
npm --prefix backend run lint
npm --prefix backend test
npm --prefix backend run test:e2e
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

10 Eylül 2026 kurulum kontrolünde frontend audit sonucu temizdir. Backend audit raporunda `@nestjs/platform-express@12.0.1` tarafından sabitlenen `multer@2.2.0` kaynaklı dört yüksek önem dereceli bulgu vardır. Düzeltilmiş `multer@2.3.0` yayımlanmıştır; NestJS'in bu bağımlılığı güncellemesi veya uyumluluğu doğrulanmış bir override için ayrıca onay gerekir. Bu iskelette dosya yükleme endpoint'i yoktur. Production öncesinde bulgular giderilmelidir; `npm audit fix --force` uygulanmamıştır.

NestJS şablonunun `vite-tsconfig-paths` bağımlılığı testlerde Vite'ın yerleşik çözümleyicisine geçiş önerisi gösterir; testleri engellemez. Şablon yapılandırması bu nedenle değiştirilmemiştir.
