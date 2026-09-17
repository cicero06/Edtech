# Atlas Learning Technologies — kurumsal site

Türkçe React + Vite + TypeScript uygulaması. Repository kökündeki `website/`, mevcut `demo/` uygulamalarından bağımsızdır. Deployment yapılmamıştır.

## Yerel kullanım

Node.js 24.x ve npm gerekir. Repository kökünden:

```sh
cd website
npm ci
npm run dev
```

Vite terminalde gerçek geliştirme adresini gösterir (varsayılan `http://127.0.0.1:5173`).

```sh
npm run typecheck
npm run build
npm run preview
```

Production önizlemesi: http://127.0.0.1:4173

- `/`: Atlas kurumsal ana sayfası.
- `/denge-kasabasi`: ürün vitrini.
- Bilinmeyen adresler önizleme sunucusunda HTTP 404 ve Türkçe hata sayfası döndürür.
- Port 4173 doluysa önce o porttaki kendi önizleme sürecinizi kapatın.

## İçerik ve yapılandırma

- `src/config.ts`: marka, production domain, e-posta, **tek merkezi demo adresi**, sayfa başlıkları/açıklamaları. Demo geçişi için `site.demoUrl` değerini `https://demo.atlaslearningtech.com` yapıp yeniden build alın.
- `src/content.ts`: yaklaşım, öğrenme adımları, gelecekteki çözüm alanları.
- `src/App.tsx`: ortak navigasyon, marka, çağrılar ve sayfa bileşenleri.
- `src/styles.css`: duyarlı tasarım, odak durumları, hareket azaltma.
- `public/images/`: mevcut oyun görseli ve yerel demodan gerçek ekran görüntüleri.
- `scripts/prerender.mjs`: iki route ve 404 için HTML; metadata, canonical, Open Graph, robots ve sitemap üretimi.
- `scripts/preview.mjs`: yerel statik sunucu; gerçek 404, doğrudan ürün yolu ve yenileme desteği.
- `tests/site.spec.ts`: masaüstü/tablet/mobil temel işlev kontrolleri.

Build sunucu render çıktısını `.ssr/`, yayınlanabilecek statik dosyaları `dist/` altına yazar. Yalnızca `dist/` web kökü olarak kullanılmalıdır; repository kökü, kaynak belgeler veya demo backend dosyaları servis edilmemelidir. İki sayfanın metni JavaScript olmadan HTML içinde bulunur. JavaScript mobil menüyü etkinleştirir.

## Barındırma hazırlığı (yayınlama yapılmadı)

Statik host `/denge-kasabasi` isteğini `denge-kasabasi/index.html` dosyasına eşlemeli; bilinmeyen yolları `404.html` ile **404 durum koduyla** yanıtlamalıdır. Her yolu ana sayfaya yönlendiren SPA fallback kullanmayın. `vercel.json`, ileride Vercel üzerinde proje kökü `website` seçildiğinde kullanılmak üzere hazırlanmıştır; canlı ortamda doğrulanmamıştır. DNS veya uzak repository değiştirilmedi.

## Tarayıcı kontrolleri

Önce build ve preview başlatın, ayrı terminalde:

```sh
npm test
```

Chromium yoksa bir kez `npx playwright install chromium` gerekir. Bu komut tarayıcı indirir. Test görselleri `test-results/` altında oluşur ve Git’e dahil edilmez.

## Veri ve güvenlik

Kurumsal site form, takip, analitik, çerez veya localStorage eklemez. İletişim `mailto:` ile, demo ayrı sekmede mevcut Vercel adresiyle açılır. Demo kendi bağımsız veri davranışına sahiptir. Website ortam değişkeni veya secret gerektirmez; `VITE_` değişkenleri herkese açıktır. `.env`, bağımlılıklar ve build çıktıları website `.gitignore` kapsamındadır.

İçerik kaynakları, mevcut/hedeflenen özellik ayrımı, güvenlik bulguları ve kontroller: [Teslim raporu](docs/DELIVERY.md).
