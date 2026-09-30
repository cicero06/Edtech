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

```text
website/                         Kurumsal site ve iki oyunun yayın kökü
  src/pages/                     Ana sayfa, ürün, kurumlar ve blog sayfaları
  src/components/                Ortak arayüz ve tanıtım bileşenleri
  src/hooks/                     Sayfa animasyonları
  public/                        Sitenin yayınlanan görselleri
  scripts/                       Build birleştirme, prerender ve önizleme
  tests/                         Site tarayıcı testleri
  docs/                          Siteye ait tarihli teknik kayıtlar
  denge-kasabasi-game/            v1 — başvuru sürümünün kaynak kodu
  denge-game-v2/                  v2 — aktif oyun geliştirmesi (Phaser)
demo/                            Önceki PoC ve mevcut backend
  frontend/                      Eski frontend; referans, aktif v1 değil
  backend/                       NestJS + Prisma; Render yolu korunur
  docs/                          PoC kapsamı, senaryosu ve tasarım belgeleri
bilgi-belge-dokumanlar/
  mimari/                        Depo ve backend değerlendirmeleri
  tasarim/                       Oyun tasarımı ve geliştirme notları
  arastirma/                     Özel akademik/pazar belgeleri; Git dışında
  basvuru/                       Özel başvuru belgeleri; Git dışında
render.yaml                      Mevcut backend yayın tanımı
```

### Nerede çalışmalıyım?

- Site sayfaları ve blog görünümü: `website/src/pages/`.
- Blog yazıları ve ortak metin dizileri: `website/src/content.ts`.
- Marka, adresler ve metadata: `website/src/config.ts`.
- Aktif oyun geliştirmesi: `website/denge-game-v2/src/`.
- Başvuru sürümü: `website/denge-kasabasi-game/src/`; `demo/frontend/` ile karıştırmayın.
- [Mimari ve backend değerlendirmesi](bilgi-belge-dokumanlar/mimari/depo-mimarisi-ve-backend-degerlendirmesi.md).
- [Kapsamlı tasarım konuşması](bilgi-belge-dokumanlar/tasarim/denge-kasabasi-v2-gelisim-konusmasi-ve-tasarim-notlari.md) ve [v2 sonrası notlar](bilgi-belge-dokumanlar/tasarim/v2-sonrasi-tasarim-notlari.md).

`dist/`, `.ssr/`, `node_modules/` ve `test-results/` kaynak değildir; elle düzenlenmez ve Git'e eklenmez. `dist/` içindeki HTML dosyaları build sırasında yeniden oluşturulur. DOCX/PDF belgeleri Git dışında tutulur ve `public/` içine taşınmaz. Uygulamalara özel teknik belgeler ilgili uygulamanın `docs/` dizininde kalır.

## Geliştirme

```sh
cd website
npm ci
npm --prefix denge-kasabasi-game ci
npm --prefix denge-game-v2 ci
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
