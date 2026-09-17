# İnceleme ve teslim raporu

17 Eylül 2026. Bu çalışma yalnızca yerel geliştirmedir; deployment, DNS değişikliği, push veya yayınlama yapılmadı.

## Repository ve koruma

Gerçek Git kökü: `/Users/macbook/Desktop/etkim apply document 2`.

- `demo/frontend`: React 19.2.8, Vite 8.2.2, TypeScript 6; sekiz ekranlı oyun. `npm run dev` ile çalışır. API URL tanımlanmadan yerel oturumla oynanabilir.
- `demo/backend`: NestJS 12, Prisma 7, PostgreSQL; oturum/event API’si. `npm run start:dev`; kalıcı veri için PostgreSQL gerekir.
- `demo/docs`: mevcut akış ve senaryo kuralları.
- `demo/stitch-export`: önceki görsel referanslar; gerçek oyun görüntüsü olarak kullanılmadı.
- `researchdocs`: akademik/pazar araştırması DOCX dosyaları.
- Kök PDF ve pedagojik DOCX, başlangıçta Git tarafından izlenmiyordu; korundu.
- Yeni uygulama yalnızca `website/` altında; kendi package.json, lockfile, bağımlılıkları ve build süreci var.

AGENTS.md bulunmadı. Proje arşivi (.zip/.tar/.gz) bulunmadı; DOCX ZIP kapsayıcılarından metin çıkarıldı. Başlangıçta demo dosyalarının SHA-256 özeti alındı. Geliştirme sonunda kaynaklar, ayarlar, lockfile’lar ve mevcut diğer demo dosyalarında değişiklik bulunmadı (node_modules/dist kapsam dışı). `git diff --stat` boş: önceden izlenen dosyalar değiştirilmedi. Demo çalıştırılırken Vite kendi bağımlılık önbelleğini yeniden oluşturabilir.

## İçerik kaynakları

1. Kök `ETKİM İSTASYON 2026 GİRİŞİM HIZLANDIRMA PROGRAMI BAŞVURU FORMU için yanıtınız alındı.pdf` (dosya adında Unicode birleşik işaretler var): girişim tanımı, hedef kitle, değer önerisi, ekip, kullanım ve yıllık kurumsal lisanslama modeli. PDF başarıyla okundu. Özel kişisel alanlar web içeriğine taşınmadı. Başvurudaki eski demo/e-posta yerine kullanıcının belirttiği güncel değerler esas alındı.
2. `Denge_Kasabasi_Pedagojik_Game_Design_REVIZE_ETKIM_3_Donem_COCUK_ODAKLI_GELECEK_TASARIM (1).docx`: öğrenme amaçları, tasarım döngüsü, tek oyunculu kullanım, sınıf senaryosu, prototip/gelecek ayrımı. Metin okundu; Ek F kavramsal ekranları gerçek demo olarak kullanılmadı.
3. `researchdocs/Etkim_A1-A3_v1_7_Ethics_Safety_Child_Rights_Eklendi.docx` ve `researchdocs/Etkim_B_Pazar_ve_Firsat_Analizi_v1.docx`: metin çıkarılabildi; yardımcı araştırma kaynakları. Sitede buradan sayısal pazar veya kanıtlanmış etki iddiaları kullanılmadı.
4. `demo/frontend/src/data/waterCrisisScenario.ts`, ekran bileşenleri, session yapısı, demo README ve navigasyon testleri: mevcut davranış doğrulaması.

Başvuruda adı geçen pitch deck ve ayrı ürün görselleri PDF’si klasörde yok. Kullanıcı talimatına uygun olarak beklenmedi; içerikleri varsayılmadı. Pedagojik belgede isimler teyide açıkken başvuru PDF’si Hüseyin Deniz ve Fadime Aksoy’un ad/rollerini doğruluyor.

## Mevcut prototip / hedeflenen tasarım

| Alan | Mevcut kodla doğrulanan durum | Sitede ifade |
| --- | --- | --- |
| Keşif | Baraj, evler, tarım, park, belediye | Mevcut |
| Kaynak | 6 tür/kart; çevre uzmanı detay içeriği eksik | Eksiklik ürün sayfasında açık |
| Plan | 5 müdahale, en fazla 3 seçim, 50 bütçe | Mevcut; sayılar oyun senaryosuna ait |
| Gerekçe | Hazır gerekçe seçenekleri ve 1–5 güven | Mevcut; serbest açıklama hedef |
| Sonuç | Su/bütçe ve nitel yan etkiler | Mevcut |
| Yeni kanıt | Düşük yağış tahmini | Mevcut |
| Yeniden değerlendirme | Planı koruma veya bir revizyon | Mevcut |
| Süreç özeti | Etkileşim göstergeleri | Yetkinlik puanı olmadığı açık |
| Öğretmen paneli/rehberi | Panel yok, rehber hazırlanacak | Gelecek geliştirme |
| Çok oyunculu | Yok | Aynı ekran etrafında tartışma kullanım önerisi |
| Yeni arayüz, yeni temalar, pilot | Plan/konsept | Mevcut başarı veya ürün gibi sunulmadı |

## Görseller

`public/images/town.jpg`, mevcut `demo/frontend/public/assets/town-intro.jpg` dosyasının kopyasıdır. `game-map.png` ve `game-plan.png`, 1440×1000 Chromium ile `http://127.0.0.1:5174` yerel demosunda gerçek tıklama akışından alındı. Yeniden tasarlanmış ekran değiller. Kasaba görseli kaynakta 512×512 pikseldir; daha büyük alanlarda yumuşak görünmesi mevcut varlığın çözünürlüğünden kaynaklanır. Başlangıç kasaba görselinin lisans/üretim bilgisi kaynak klasörde doğrulanamadı; yeni dış kaynak görsel eklenmedi.

## Güvenlik ve repository hijyeni

Değerler raporlanmadı; hiçbir mevcut dosya otomatik silinmedi.

| Yol | Bulgu / risk |
| --- | --- |
| `demo/backend/.env` | Yerel ortam dosyası mevcut; kimlik bilgisi içerebilir. Git tarafından ignore ediliyor, izlenmiyor. Dosya içeriği çıktılanmadı ve frontend’e aktarılmadı. |
| `demo/frontend/.env.example`, `demo/backend/.env.example` | İzlenen örnek yapılandırmalar. Gerçek secret konulmamalı; frontend VITE_ değerleri açık kabul edilmeli. |
| `demo/frontend/node_modules/`, `demo/backend/node_modules/` | Yerel bağımlılıklar; Git ignore kapsamında. Web köküne veya repository’ye dahil edilmemeli. |
| `demo/frontend/dist/`, `demo/backend/dist/` | Üretilmiş çıktılar; Git ignore kapsamında. Website yayınıyla karıştırılmamalı. |
| `demo/backend/tsconfig.build.tsbuildinfo` | Yerel build önbelleği; ignore ediliyor. |
| `.DS_Store` | Repository kökünde izleniyor; işletim sistemi metadata dosyası. Korundu; ileride kullanıcı kararıyla takipten çıkarılabilir. |
| `demo/frontend/.DS_Store`, `demo/backend/.DS_Store` | Yerel metadata, demo ignore kuralları kapsamında. |
| `demo/frontend/test-results/` | Yerel test ekranları/çıktıları; frontend .gitignore kapsamında, kaynak kodla karıştırılmamalı. |
| Kök başvuru PDF’si | Özel kişisel bilgiler içeriyor; başlangıçta izlenmiyor. Public dizine veya dağıtıma kopyalanmadı. |
| Kök pedagojik DOCX ve `researchdocs/` | Dahili tasarım/araştırma belgeleri; site statik çıktısına dahil edilmedi. |
| `website/node_modules/`, `website/dist/`, `website/.ssr/`, `website/test-results/` | Yeni uygulamanın yerel/üretilmiş dosyaları; website .gitignore korumasında. |

Kaynak metin dosyalarında özel anahtar başlangıcı ve bazı yaygın erişim anahtarı desenleri için yalnızca yol bildiren tarama yapıldı; eşleşme bulunmadı. Bu sınırlı tarama eksiksiz secret denetimi veya Git geçmişi denetimi değildir. Ayrı credentials/özel anahtar/log dosyası bulunmadı; bağımlılık ve Git iç dizinleri taramaya dahil edilmedi. Mevcut demo README’sindeki geçmiş backend audit notları güncel denetim sonucu olarak sunulmadı. Website kurulumundaki npm audit: 0 bulgu.

## Doğrulama

- Node 24.20.0, npm 11.19.0.
- Bağımsız website bağımlılık kurulumu başarılı; package-lock.json üretildi.
- TypeScript ve production build başarılı; iki sayfa ile 404 önceden HTML olarak üretildi.
- Chromium: 375, 768, 1440 genişlikte iki route için taşma, görsel yüklenmesi, konsol hataları, h1/metadata kontrolü.
- Mobil klavye menüsü, Escape ile kapanma/odak, ürün sayfasından ana sayfa bölümüne geçiş.
- Demo yeni sekme adı/adresi, mailto, ürün yenilemesi, gerçek 404, robots/sitemap/favicon ve statik HTML.
- JavaScript kapalıyken iki sayfanın ana içeriği okunabiliyor.
- Tam sayfa ekran görüntülerinde görsel inceleme yapıldı. Scroll geçişinin ekran görüntüsünde başlıkları görünmez kılmaması için opacity yerine hafif konum geçişi kullanıldı.

İlk test çalışmasındaki mobil menü testi, açılınca adı “Kapat” olan düğmeyi eski “Menü” adıyla aradığı için başarısız oldu; test seçicisi düzeltildi. **Son çalışma: 9/9 test başarılı (14,7 saniye).**

Canlı Vercel demo uptime/API bağlantısı, backend/veritabanı, Safari/Firefox, gerçek mobil donanım, ekran okuyucu ve kapsamlı WCAG/Lighthouse denetimi yapılmadı. Uzak host 404/route yapılandırması canlıda denenmedi. Mevcut demo test paketi yeniden çalıştırılmadı; demo kaynağı değiştirilmedi.
