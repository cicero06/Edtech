# Denge Kasabası — User Flow v0.1

## Kaynak ve kapsam

Bu akış `PRODUCT_BRIEF.md` ve `../../DEVELOPMENT_PLAN_Denge_Kasabasi.md` v1.0 temel alınarak düzenlenmiştir. Sekiz ekran, tek senaryo ve en fazla bir revizyon döngüsü vardır. Bu belge bir uygulama implementasyonu değildir.

## Ana akış

```text
01 Intro
→ 02 Town Map
→ 03 Research
→ 04 Planning
→ 05 Decision
→ 06 Outcome
→ 07 Reflection
→ 08 Session Summary
```

```text
Reflection
├── Planı koru → Session Summary
└── Planı değiştir → Planning → Decision → Final Outcome → Session Summary
```

Final Outcome ayrı bir dokuzuncu ekran değildir; Outcome ekranının revizyon sonrası durumudur. İkinci kez Reflection veya revizyon döngüsü açılmaz.

Amaç: Kullanıcı tek bir oturumda problemi anlayacak, bilgi toplayacak, çözüm üretecek, sonucunu görecek ve kararını yeniden değerlendirecektir.

## 01 — Intro

**Amaç:** Problemi kısa ve anlaşılır biçimde tanıtmak.

Kullanıcı Denge Kasabası'nı, azalan su kaynaklarını ve şu görevi görür:

> Kasabanın su ihtiyacını karşılayacak, çevreyi koruyacak ve bütçeyi aşmayacak bir plan oluştur.

- Ana CTA: `GÖREVE BAŞLA`
- Sistem: Anonim bir session başlatır; isim, e-posta veya öğrenci hesabı istemez.
- Event: `session_started`
- Sonraki ekran: Town Map

## 02 — Town Map

**Amaç:** Problem alanını keşfetmek.

Kullanıcı 2D harita üzerinde beş bölgeyi inceleyebilir. Aşağıdaki açıklamalar **geçici senaryo taslak metnidir** ve uygulamaya geçilmeden önce ürün onayı ile kesinleştirilmelidir.

| Bölge | Geçici senaryo açıklaması |
| --- | --- |
| Baraj | Kasabanın ana su kaynağı. Son aylarda seviyesi düşüyor. |
| Evler | Geçici tasarım kopyasıdır; senaryo onayı sonrası netleştirilecek. |
| Tarım | Kasabanın kullandığı suyun önemli bölümü tarımsal üretimde kullanılıyor. |
| Park | Geçici tasarım kopyasıdır; senaryo onayı sonrası netleştirilecek. |
| Belediye | Geçici tasarım kopyasıdır; senaryo onayı sonrası netleştirilecek. |

- Başlangıç göstergeleri: Su %42, bütçe 50.
- Bölge açılınca ilgili kısa açıklama gösterilir; incelenen bölgeler izlenir.
- Event: `location_opened`; `target` ilgili bölge kimliğidir.
- Ana CTA: `BİLGİLERİ ARAŞTIR`
- Sonraki ekran: Research

## 03 — Research

**Amaç:** Farklı kaynakları incelemek ve türlerini ayırt etmek.

| Kaynak | Tür |
| --- | --- |
| Belediye mühendisi | Uzman görüşü; örnek kanıt türü: Uzman / ölçüm verisi |
| Çiftçi | Paydaş görüşü |
| Çevre uzmanı | Uzman görüşü |
| Su kullanım verisi | Veri / grafik |
| Sosyal medya paylaşımı | Doğrulanmamış iddia |
| Belediye bütçe bilgisi | Resmî veri |

Mevcut örnek içerikler:

- Belediye mühendisi: “Şebekedeki suyun yaklaşık %18'i kaçaklardan kaybediliyor.”
- Çiftçi: “Sulamayı çok azaltırsak ürün kaybı yaşayabiliriz.”
- Sosyal medya: “Parkların sulamasını tamamen durdurursak su sorunu çözülür!” Bu ifade doğrulanmamış iddia olarak sunulur, doğru bilgi olarak değil.
- Onaylı su kullanım dağılımı: Evler %34, Tarım %40, Parklar %8, Kaçaklar %18. Toplam %100.

Kullanıcı kaynakları açar ve inceler. Tüm kaynakları incelemek zorunlu değildir. v0.1'de ayrı bir kaynak karşılaştırma arayüzü onaylanmamıştır; bu sebeple yeni ekran veya bileşen eklenmez.

- Event'ler: `source_opened`; kullanıcı yardım istediğinde `hint_requested`.
- Güncel planın destek kuralı: Decision aşamasına geçerken ikiden az kaynak incelenmişse “Karar vermeden önce birkaç farklı bilgi kaynağını daha incelemek ister misin?” önerisi gösterilebilir. Bu zorunlu bir engel değildir.
- Ana CTA: `PLAN OLUŞTURMAYA GEÇ`
- Sonraki ekran: Planning

## 04 — Planning

**Amaç:** Müdahaleleri karşılaştırıp bir plan oluşturmak.

| Müdahale | Maliyet | Etki açıklaması |
| --- | --- | --- |
| Şebeke kaçaklarını onar | 20 | Su etkisi yüksek; çevresel risk düşük |
| Tarımsal sulamayı azalt | 5 | Su etkisi yüksek; tarım etkisi olumsuz olabilir |
| Park sulamasını azalt | 2 | Su etkisi düşük; çevresel etki orta |
| Yağmur suyu toplama sistemi kur | 25 | Su etkisi orta; uzun vadeli fayda yüksek |
| Yeni kuyu aç | 15 | Kısa vadeli su etkisi yüksek; uzun vadeli çevresel sonuç belirsiz |

- En fazla üç müdahale seçilebilir.
- Toplam maliyet 50 bütçeyi aşamaz.
- Seçilen müdahaleler, kullanılan ve kalan bütçe gerçek seçimlerden hesaplanır.
- Revizyon dönüşünde mevcut plan gözden geçirilir; ikinci revizyon hakkı oluşmaz.
- Event'ler: `intervention_viewed`, `intervention_selected`, `intervention_removed`.
- Ana CTA: `KARAR AŞAMASINA GEÇ`
- Sonraki ekran: Decision

## 05 — Decision

**Amaç:** Planı gözden geçirmek, gerekçe ve güven düzeyi belirtmek.

Kullanıcı seçtiği müdahaleleri ve bütçe özetini görür.

Gerekçe seçenekleri:

- En fazla su tasarrufu sağladığını düşünüyorum.
- Bütçe ile fayda arasında iyi denge kuruyor.
- Çevreye daha az zarar vereceğini düşünüyorum.
- Birden fazla sorunu aynı anda çözüyor.
- Diğer — v0.1'de bu seçenek serbest metin alanı açmaz.

Güven düzeyi 1–5 arasıdır: 1 “Çok emin değilim”, 5 “Çok eminim”. Bu bir yetkinlik puanı değildir.

- Örnek plan: Kaçak onarımı + yağmur suyu toplama + park sulamasını azaltma.
- Bu örnekte maliyet 47, kalan bütçe 3'tür; bütün planlara sabitlenmez. Mevcut maliyetlerle en pahalı üç müdahalenin toplam maliyeti 60'tır ve onaylı 50 bütçeyi aşar; bu plan gönderilemez. Maliyetler değişmemiştir; bütçe 50 olarak onaylanmıştır.
- Event'ler: `reason_selected`, `confidence_submitted`, `plan_submitted`.
- Ana CTA: `PLANI UYGULA`
- Sonraki ekran: İlk turda Outcome; revizyonda aynı ekranın Final Outcome durumu.

## 06 — Outcome

**Amaç:** Planın etkilerini, ödünleşimleri ve yeni kanıtı görünür kılmak.

Güncel plandaki örnek üçlü müdahalenin sonucu:

| Alan | Örnek sonuç |
| --- | --- |
| Su | %42 → %64; +22 yüzde puan |
| Bütçe | 50 → 3; -47 |
| Tarım | Belirgin olumsuz etki görülmedi |
| Çevre | Su kaybı azaldı; uzun vadeli su yönetimi iyileşti |

Bu sonuçlar örnektir. Müdahale birleşimlerinin sayısal su etkisi kuralları `SCENARIO_RULES.md` içinde onaylanmıştır. v0.1 su artışları:

- `network-leak-repair`: +14 yüzde puan
- `reduce-agricultural-irrigation`: +16 yüzde puan
- `reduce-park-irrigation`: +3 yüzde puan
- `rainwater-harvesting`: +5 yüzde puan
- `new-well`: +12 yüzde puan

İlk sonuç su hesabı:

```text
initialWater = 42
finalWater = clamp(42 + sum(selected intervention water deltas), 0, 100)
```

Yalnızca revize/final sonuçta: Yeni yağış kanıtından sonra `rainwater-harvesting` seçili kalırsa su artışı +5 yerine +3 yüzde puan olur.

Tarım ve çevre etkileri v0.1'de açıkça belirtilmedikçe nitel/kategorik kalır; bunlar için ek sayısal skor üretilmez.

Yeni kanıt:

> Önümüzdeki üç ayda yağışların normalin yaklaşık %40 altında kalması bekleniyor.

Yağmur suyu toplama sisteminin kısa vadede beklenenden daha az su sağlaması mümkün olabilir.

- Event'ler: `outcome_viewed`, `new_evidence_viewed`; gerçekten görüntülenen içerikle ilişkili olmalıdır.
- Ana CTA: İlk turda `SONUÇLARI DEĞERLENDİR` → Reflection.
- Revizyon sonrası Outcome ekranı Final Outcome durumuna geçer; CTA metni `OTURUM ÖZETİNİ GÖR` → Session Summary.
- Final Outcome ayrı bir ekran değildir; revizyon sonrası Outcome ekranının aynı URL/state'deki durumudur.
- Yeni kanıt görülmesine rağmen değerlendirme yapılmadan devam edilmek istenirse güncel plandaki öneri: “Yeni bilginin planındaki hangi seçeneği etkileyebileceğini düşün.”

## 07 — Reflection

**Amaç:** Sonuç ve yeni kanıt karşısında planı koruma veya değiştirme kararını gözlemek.

1. `Beklemediğin bir sonuç veya yeni bilgi oldu mu?`
   - Evet
   - Hayır
2. `Yeni bilgi kararını etkiledi mi?`
   - Evet, planımı değiştirmek istiyorum.
   - Hayır, mevcut planımı koruyorum.

- Ana CTA: `DEĞERLENDİRMEYİ TAMAMLA`
- Planı koru → Session Summary.
- Planı değiştir → Planning → Decision → Outcome (Final Outcome durumu) → Session Summary.
- `revisionCount` en fazla 1'dir; ikinci revizyon hakkı oluşmaz.
- Event'ler: `reflection_answered`; plan değiştirme eylemi gerçekleşirse `strategy_changed` veya `plan_revised`.
- `belief_revised` v0.1'de kullanılmaz; içsel inanç değişikliği gibi yorumlanamayacak observable event tercih edilir.
- Revizyon istemek, müdahalelerin gerçekten değiştiğini tek başına kanıtlamaz.

## 08 — Session Summary

**Amaç:** Puan vermeden gözlenen etkileşim süreçlerini özetlemek.

Başlık: `GÖZLENEN SÜREÇ GÖSTERGELERİ`

| Gösterge | Event'ten türetme |
| --- | --- |
| İncelenen bölgeler | Benzersiz `location_opened.target` sayısı / 5 |
| İncelenen bilgi kaynakları | Benzersiz `source_opened.target` sayısı / 6 |
| Değerlendirilen çözüm seçenekleri | Benzersiz `intervention_viewed.target` sayısı |
| Oluşturulan plan sayısı | `plan_submitted` sayısı |
| Yardım / ipucu kullanımı | `hint_requested` sayısı |
| Yeni kanıt görüntülendi | `new_evidence_viewed` varlığı |
| Yeni kanıt sonrası strateji değiştirildi (`strategyChanged`) | `strategy_changed` veya `plan_revised` event'lerinden en az birinin varlığı |
| Reflection tamamlandı | `reflection_answered` varlığı |

Veriler `GET /sessions/:id/summary` üzerinden gelir. Stitch'teki 4/5, 5/6 veya 2 plan gibi değerler yalnızca örnektir. Plan sayısı ile revizyon sayısı aynı gösterge değildir.

Zorunlu açıklama:

> Bu göstergeler gözlenen etkileşim süreçlerini tanımlar. Bunlar doğrulanmış yetkinlik puanları değildir.

- Ana CTA: `DEMOYU TAMAMLA`
- Tamamlanma event'i: `session_completed`.
- Ek bitiş ekranı, skor, rozet veya leaderboard yoktur.

## Uygulamadan önce netleştirilecekler

- Minimum müdahale sayısı: güncel plan yalnızca maksimum üç sınırını tanımlar.
- Bütçe / maliyet dengesi: mevcut fiyatlarla en pahalı üçlü planın maliyeti 60'tır ve onaylı 50 bütçeyi aşar; bu plan gönderilemez. Bütçe veya maliyetlerde başka değişiklik ürün onayı ister.
- Sayfa yenilemesi sonrası anonymous session devamlılığı: yalnızca `sessionId` ve gerekli UI/session state `localStorage` saklanır; isim, e-posta, profil veya kişisel veri depolanmaz.
- Otomatik öneriler ile istenen ipuçlarının ayrımı ve event tetikleme koşulları.
