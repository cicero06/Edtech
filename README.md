# Atlas Learning Technologies

**Oyunla keşfet. Kanıtla düşün. Geleceği şekillendir.**

10–12 yaş çocuklar için oyun tabanlı öğrenme deneyimleri geliştiren bir eğitim
teknolojisi girişimi. İlk ürünümüz **Denge Kasabası**, çocukların gerçek yaşam
problemlerini keşif, kanıt değerlendirme ve gerekçeli karar verme döngüsüyle
öğrendiği interaktif bir kasaba simülasyonu.

🌐 **Canlı site:** [atlaslearningtech.com](https://atlaslearningtech.com)

## Denge Kasabası — Su Krizi

Kasabanın su kaynakları azalıyor, bütçe sınırlı. Oyuncu kasabanın beş bölgesini
inceler, farklı güvenilirlikteki kanıt kartlarını karşılaştırır, paydaşları
dinler, sınırlı bütçeyle bir müdahale planı kurar ve kararını gerekçelendirir.
Yeni kanıt geldiğinde planını yeniden değerlendirir.

**Öğrenme döngüsü:** Keşfet → Kanıt Topla → Planla → Gerekçelendir →
Sonuçları Gör → Yeniden Değerlendir

| Sürüm | Açıklama | Bağlantı |
|---|---|---|
| v1 · Başvuru sürümü | Program başvurusunda sunulan oynanabilir prototip | [/denge-kasabasi/oyna](https://atlaslearningtech.com/denge-kasabasi/oyna/) |
| v2 · Ön gösterim | Başvuru sonrası aktif geliştirme: yeni harita, ses sistemi, yürüme animasyonları, öğrenci profili, yenilenen belediye toplantısı ve duyuru turu | [/denge-kasabasi/ongosteri](https://atlaslearningtech.com/denge-kasabasi/ongosteri/) |

## Tasarım ilkeleri

- Reklamsız, satın alma yönlendirmesiz deneyim
- Kişisel veri toplamayan mimari — oturum yalnızca tarayıcıda tutulur
- Yaşa uygun dil, tempo ve görsel dünya
- Öğretmen gözetiminde sınıf içi kullanıma uygun kurgu

## Depo yapısı

```
website/               Kurumsal site + ürün sayfası (React 19, Vite, TS, GSAP)
  denge-kasabasi-game/ v1 — başvuruya konu oynanabilir prototip
  denge-game-v2/       v2 — aktif geliştirme ön gösterimi (Phaser)
demo/                  Erken backend denemesi (NestJS + Prisma, Render)
```

## Geliştirme

```sh
cd website
npm ci
npm run dev        # geliştirme sunucusu
npm run typecheck  # tip kontrolü
npm run build      # site + her iki oyunun üretim derlemesi
npm run preview    # dist/ önizlemesi (http://127.0.0.1:4173)
```

`npm run build` ana siteyi, SSR çıktısını ve iki oyunu tek komutta derleyip
`dist/` altında birleştirir; Vercel deploy'u bu çıktıyı yayınlar.

## Ekip

- **Hüseyin Deniz** — Kurucu · Ürün & Yazılım
- **Fadime Aksoy** — Pedagoji & Öğrenme Tasarımı
- **Deniz Aşçıoğlu** — Tasarım & Deneyim

İletişim: huseyinn.dnz@gmail.com

---
© 2026 Atlas Learning Technologies. Tüm hakları saklıdır.
