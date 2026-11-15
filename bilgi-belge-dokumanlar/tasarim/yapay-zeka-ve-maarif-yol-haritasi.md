# Denge Kasabası — Yapay Zekâ ve Maarif Modeli Yol Haritası

Tarih: 16 Kasım 2026 · Durum: Onaylanan yön, uygulama başlamadı
İlgili belgeler: `v2-sonrasi-tasarim-notlari.md`, ETKİM 3. dönem pedagojik tasarım dosyası (Drive), Drive › "10 - Öğrenci Kullanılabilirlik Testi"

---

## 1. Ürünü özgün kılacak temel fikir (Hüseyin)

1. **Karar sürecini izleme ve analiz:** Yapay zekâ, öğrencinin karar verme sürecini izler ve kayıt altına alır. Ardından analiz eder; öğrencinin güçlü ve zayıf yönlerini, eğilimlerini görünür kılar.
2. **Öğrenciye özgü senaryolar:** Yapay zekâ, aynı hikâyede farklı seçenekler üretir. Her öğrenci ezberlenemeyecek, özgün sorular alır.

## 2. Temel ilkeler (şaşmamak için)

- **"Kişilik" değil, "Maarif beceri ve eğilim gözlemi."** Profil kalıcı bir etiket değildir; zamanla değişen bir gelişim haritasıdır. Bunun üç gerekçesi var:
  - ETKİM belgesi "süreç verisi yetkinlik veya kişilik puanı değildir" diyor.
  - KVKK ve AB Yapay Zekâ Yasası (öğrenme değerlendirmesi yüksek riskli sayılır).
  - Velinin veri güvenliği kaygısı.
- **Son söz öğretmenindir.** Yapay zekânın her yorumunun altında dayandığı somut veri görünür.
- **Kasabanın matematiği sabittir.** Su, bütçe ve etki kuralları doğrulanmıştır. Yapay zekâ yalnızca bu kuralların içinde içerik varyasyonu üretir.
- **Önce senaryo bankası, sonra canlı üretim.** Varyasyonlar önceden üretilir ve pedagog onayından geçer. Çocuğa denetlenmemiş yapay zekâ metni gösterilmez.
- **Ölçüm katmanı yapay zekâsızdır.** Göstergeler sabit kurallarla hesaplanır. Yapay zekâ yalnızca bunları yorumlar ve öğretmene doğal dilde özetler.
- **Anahtar tarayıcıya gitmez.** Yapay zekâ çağrıları yalnızca backend'den yapılır. Öğrenci verisi takma adla (pseudonim) gönderilir; en az veri ilkesi uygulanır.
- **Oyun gibi kalmalı, form gibi olmamalı.** Pedagojik adımlar kasabalılar, Lina ve Başkan üzerinden oyunun içinde gelir.
- **Terim:** "kazanım" değil, "öğrenme çıktısı" (Maarif Modeli dili).

## 3. Mevcut durum (16.11.2026)

**Hazır olanlar**
- Olay kayıt hattı: istemci → outbox → `/api` → Firestore. Kayıt sırası doğru (rabia testi).
- `minigame_completed` olayı `metrics` alanıyla.
- Öğretmen paneli (StaffPanel) ve veli raporu (ParentReportModal).
- Atölyeler (Aylin, Kemal, Nuri, Rıza) "önce hipotez, sonra deney" mantığıyla kurulu.
- Backend kendi sunucumuzda (NestJS, Vercel `/api`).

**Eksik olanlar**
- Kayıtlar sonucu tutuyor, süreci tutmuyor. Düşünme süresi, bakış sırası, fikir değiştirme ve ipucu kullanımı kaydedilmiyor.
- ETKİM belgesindeki çekirdeğin yarısı v2'de yok:
  - kaynak türü etiketi (doğrulanmamış söylenti dahil)
  - gerekçe ve 1–5 güven ölçeği
  - yeni kanıt ("yağış %40 az") ve ardından planı koru/değiştir
  - yansıtma soruları
  - ön/son test
- Hikâye sabit metin (`src/Game/data/story.ts`). Varyasyon için hikâyenin parametreli hâle gelmesi gerekiyor.
- Veli onam metni ve veri saklama politikası yok. Drive'daki onam klasörü boş.
- Kullanılabilirlik testi kiti hazır ama hiç uygulanmadı; formlar boş.

## 4. Maarif Modeli eşleştirmesi

| Oyundaki öğe | Maarif Modeli karşılığı |
|---|---|
| Kadim yapboz, bölgelerin birbirine bağlı olması | Sistem okuryazarlığı |
| Söylentiyi veriyle doğrulama, grafik okuma | Bilgi ve veri okuryazarlığı |
| Bütçeyle çözüm paketi | Finansal okuryazarlık |
| Su tasarrufu, adil paylaşım | Sürdürülebilirlik okuryazarlığı; Erdem-Değer-Eylem değerleri (sorumluluk, tasarruf vb.) |
| Atölyelerde hipotez ve deney | Fen bilimleri alan becerileri |
| Güven, yeniden değerlendirme, yansıtma | Eğilimler ve öz düzenleme |
| Yapay zekâ gözlem raporu | Süreç değerlendirmesi |

**Doğrulanacak:** 5. sınıf "Sürdürülebilir Yaşam ve Geri Dönüşüm" ünitesi var. 6. sınıftaki ilgili ünite ve resmî öğrenme çıktısı kodları tymm.meb.gov.tr'den çıkarılacak.

## 5. Yol haritası

### Adım 1: Kadim yapboz (web) ve karar izinin ilk hâli
Unity'deki hâli (`GameHUD.AncientPuzzle.cs`, `QuestManager.cs`):
- 4 koruyucudan 4 gravür taşı toplanıyor.
- Taşlar 2×2 masada birleştiriliyor; otomatik birleştirme düğmesi var.
- Sonunda "Kadim Uyum Pınarı" çıkıyor ve Başkan Adil'e sunuluyor.

Web için geliştirmeler:
- Her parça, ilgili atölye tamamlanınca kazanılır.
- Parçaları yerleştirmek yetmez; öğrenci su kanallarını parçalar arasında bağlar (sistem düşüncesi).
- Sonunda tahmin sorusu: "Baraj kurursa önce hangi bölge etkilenir?"
- Otomatik birleştirme kalkar, yerine kademeli ipucu gelir.
- Karar izi olayları baştan eklenir: deneme sayısı, süre, ipucu, tahmin, doğruluk.
- Ekranlar önce görsel öneri olarak hazırlanır, onaydan sonra kodlanır. Görsel kalite çıtası Aylin atölyesi.

### Adım 2: Eksik pedagojik çekirdek
- **Söylenti:** Kasabalılar ve duyuru panosu doğrulanmamış iddialar söyler. Öğrenci bunları Lina ve atölyelerle doğrular. Kaynak türü etiketleri görünür olur.
- **Güven:** Başkan, planı onaylarken gerekçe ve 1–5 güven sorar.
- **Kuraklık haberi:** Zaman geçişinden sonra gelir. Kasabalılar tepki verir; öğrenci planını korur ya da değiştirir.
- **Yansıtma:** Lina kısa sorular sorar; cevaplar öğretmen paneline gider.

### Adım 3: Final ve öğretmen raporu
- Final: Lina veri laboratuvarı, berat/karne ve yansıtma.
- Öğretmen paneli: önce sabit göstergelerle Maarif beceri ve eğilim gözlemi, sonra yapay zekâ yorumu (backend'den).
- Veli raporu da aynı çerçeveye uyarlanır.

### Adım 4: Parametreli hikâye ve senaryo bankası
- `story.ts` içindeki değişebilen kısımlar ayrı bir veri yapısına taşınır: kaçak yeri, söylentiyi yayan kasabalı, kuraklık şiddeti, atölye sayıları, fıskiye dizilimi.
- Yapay zekâ varyasyonları üretir, pedagog onaylar; her öğrenciye farklı bir kombinasyon atanır.
- Atanan varyasyon kimliği olaylara yazılır, öğretmen karşılaştırma yapabilir.

### Adım 5: Onam, ön/son test ve çocuklarla test
- Veli onam metni, veri saklama süresi, takma ad kullanımı.
- Oyunun başında ve sonunda 5'er soruluk kısa ölçüm.
- Drive'daki Round 1 kitiyle 5–8 öğrenci (S01: Fadime). Yapay zekâ yorumlarının isabeti öğretmen gözlemiyle karşılaştırılır.

## 6. Karar izi olayları (taslak, Adım 1'de netleşecek)

| Olay | Alanlar |
|---|---|
| `decision_started` | bağlam (atölye/plan/yapboz), varyasyon kimliği |
| `source_viewed` | kaynak kimliği, kaynak türü, süre |
| `hypothesis_set` | seçenek, düşünme süresi |
| `attempt_made` | deneme no, sonuç, strateji değişti mi |
| `hint_used` | kademe |
| `confidence_given` | 1–5, gerekçe |
| `plan_revised` | korundu/değişti, neden |
| `reflection_answered` | soru kimliği, metin (kısa) |
| `prediction_made` | soru, cevap, doğru mu |

Kural: olay şemasını değiştirmeden önce `npm run manifest` çalıştırılmalı, yoksa backend olayları reddeder.

## 7. Açık konular
- 6. sınıf öğrenme çıktısı kodları
- Yapay zekâ modeli ve maliyeti (öğrenci başına), Adım 3 öncesi
- Veli onamının hukuki metni
- Sınıf meclisi modu, seri bölümler (Enerji, Atık), belediye/sponsor sürümü: sonraki aşama
- Canlı (gerçek zamanlı) senaryo üretimi: banka modeli test edildikten sonra
