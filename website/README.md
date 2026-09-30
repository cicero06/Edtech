# Atlas Learning Technologies — kurumsal site

Türkçe React + Vite + TypeScript uygulaması. Ana site, v1 başvuru oyunu ve v2 ön gösterimi aynı statik yayın çıktısında birleştirilir. Vercel yapılandırmasının proje kökü `website/`, çıktı dizini `dist/` olarak korunur. Backend bu build'in parçası değildir.

## Yerel kullanım

Node.js 24.x ve npm gerekir. Repository kökünden:

```sh
cd website
npm ci
npm --prefix denge-kasabasi-game ci
npm --prefix denge-game-v2 ci
npm run dev
```

Site geliştirme sunucusu varsayılan olarak `http://127.0.0.1:5173` adresinde çalışır. Site içindeki oyun yolları, ilgili oyunun mevcut `dist/` çıktısını sunar; oyun değişiklikleri için ilgili oyunu yeniden derleyin veya onun kendi geliştirme sunucusunu kullanın.

```sh
npm run typecheck
npm run build
npm run preview
```

`npm run build` sırasıyla siteyi, SSR modülünü ve iki oyunu derler; oyun çıktılarını siteye kopyalar ve sayfaları statik HTML olarak üretir. `npm run preview`, sonucu `http://127.0.0.1:4173` adresinde sunar.

## Kaynak düzeni

```text
src/
  App.tsx                 Route seçimi, metadata ve ortak sayfa düzeni
  pages/                  Home, Product, Partners, BlogIndex, BlogPost
  components/             Ortak arayüz ve ürün tanıtım bileşenleri
  hooks/                  Reveal, ana sayfa ve tanıtım animasyonları
  config.ts               Marka, adresler ve sayfa metadata tanımları
  content.ts              Blog yazıları ve ortak içerik dizileri
  motion.ts               GSAP ve kaydırma altyapısı
  styles.css              Site stilleri
  main.tsx                Tarayıcı girişi
  entry-server.tsx        Statik HTML üretimi için render girişi
public/images/            Site görselleri
scripts/                  Build ve önizleme araçları
tests/                    Playwright site testleri
docs/                     Tarihli site teknik kayıtları
denge-kasabasi-game/       v1 başvuru oyunu; bağımsız npm projesi
denge-game-v2/             Aktif v2 oyunu; bağımsız npm projesi
```

- Yeni sayfa bileşenlerini `src/pages/`, birden fazla sayfada kullanılan arayüzü `src/components/` altında tutun.
- Blog yazısını `src/content.ts` içindeki `posts` dizisinde düzenleyin. `dist/blog/` altındaki HTML'yi düzenlemeyin veya kopyalayarak yeni yazı oluşturmayın.
- `src/config.ts`, `scripts/prerender.mjs`, `src/App.tsx` ve `vercel.json` yeni route eklenirken birlikte değerlendirilmelidir.
- Oyun kaynaklarını site bileşenleriyle karıştırmayın; her oyunun kendi `src/`, `public/`, bağımlılıkları ve lockfile'ı vardır.
- Genel tasarım, araştırma ve başvuru belgeleri için [kök rehbere](../README.md) bakın. Özel belgeleri `public/` içine koymayın.

## Yayın ve üretilen dosyalar

| Yol | İçerik |
| --- | --- |
| `/` | Kurumsal ana sayfa |
| `/denge-kasabasi` | Ürün vitrini |
| `/kurumlar` | Kurumsal iş birliği |
| `/blog` ve `/blog/:slug` | Blog listesi ve yazılar |
| `/denge-kasabasi/oyna/` | v1 başvuru oyunu |
| `/denge-kasabasi/ongosteri/` | v2 ön gösterimi |

`dist/` yayın çıktısı, `.ssr/` sunucu render derlemesi, `node_modules/` bağımlılıklar, `test-results/` test çıktılarıdır. Bunlar kaynak dosya değildir; Git'e eklenmez ve elle düzenlenmez. Build mevcut çıktıları yenileyebilir.

Yalnızca `dist/` web kökü olarak kullanılmalıdır; repository kökü, özel belgeler veya backend dosyaları servis edilmemelidir. Site sayfaları JavaScript olmadan HTML içinde bulunur. Yerel önizleme bilinmeyen yolları gerçek HTTP 404 ve Türkçe hata sayfasıyla yanıtlar. Vercel yolları `vercel.json` içinde tanımlıdır; uzak ortam ayarları yerel testlerden bağımsız doğrulanmalıdır.

## Tarayıcı kontrolleri

Önce `npm run build` ve `npm run preview` çalıştırın. Önizleme açıkken ayrı terminalde:

```sh
npm test
```

Chromium yoksa `npx playwright install chromium` gerekir. Testler masaüstü/tablet/mobil içerik, görseller, bağlantılar, mobil menü, metadata, 404 ve JavaScript kapalı kullanımı kontrol eder. Port 4173 doluysa ilgili sürecin size ait olduğunu doğrulamadan kapatmayın.

## Veri ve güvenlik

Kurumsal site form, takip, analitik veya çerez eklemez; iletişim e-posta bağlantılarıyla sağlanır. Oyunların oturum/veri davranışı kendi uygulamalarına aittir. Website secret gerektirmez; `VITE_` değişkenleri herkese açıktır. `.env`, bağımlılıklar ve build çıktıları Git dışında tutulur.

[17 Eylül teslim raporu](docs/DELIVERY.md) tarihsel kayıttır; güncel dosya düzeni ve çalıştırma komutları için bu rehberi kullanın.
