# Denge Kasabası v2 — Sonuç Turu ve İkinci Şans Tasarım Notları

> Tarih: Eylül 2026 · Kaynak: tasarım sohbeti · Durum: taslak — arkadaş geri bildirimi bekleniyor

## 1. Mevcut durum

v2 ön gösterimi şu akışla bitiyor:

`lina-intro → meet-mayor → investigate → report → meeting → announce → done`

Son adımda oyuncu onaylanan planı 4 NPC'ye duyurur ve afişi panoya asar;
Lina'nın yansıtma sorusuyla bölüm kapanır.

İlgili kod:

- `website/denge-game-v2/src/Game/data/session.ts` — `QuestStage` makinesi, oturum modeli (localStorage)
- `website/denge-game-v2/src/Game/data/story.ts` — çözüm kartları (`SOLUTION_CARDS`), `npcPlanReaction`, `NOTICE_BOARD`, `LINA_CLOSING_*`
- `website/denge-game-v2/src/Game/data/stats.ts` — 4 denge ekseni: çevre, ekonomi, toplum, su

## 2. Yeni oyun akışı fikri

1. Oyuncu planını yapar, hayata geçirir → sonuçları **30 gün sonra** görür
   (kademeli zaman hızlandırma opsiyonel).
2. Sonuçlar kasabada karışık etki yaratır: bazı sorunlar çözülür, bazıları sürer,
   bazıları kötüleşir; memnun ve memnuniyetsiz karakterler olur — gerçek hayattaki
   gibi farklı sonuçlar.
3. Oyuncu karakterlerle tek tek konuşup kasabanın genel durumunu gözlemler.
4. Lina + belediye başkanı ile rapor görüşmesi.
5. Lina sorar: "Bir şansın daha olsaydı nasıl karar verirdin? Böyle bir seçeneğin
   olduğunu biliyor muydun?" → **ikinci karar turu** → ikinci zaman atlaması →
   değişimler gözlemlenir → son rapor başkana sunulur → **oyun biter**.
6. Tüm adımlarda toplanan veri (kararlar, yanıtlar, sosyal analizler, yaklaşımlar)
   öğretmen ve veliye açık şekilde paylaşılır. İleride yapay zekâ analizi ve
   senaryo üretimi eklenebilir.

## 3. Güçlü taraflar

- **30 gün sonrası sonuç turu**, içerikte vaat edilen "Sonuçları Gör → Yeniden
  Değerlendir" adımını ilk kez gerçekten yaşatıyor. v1'de soyut bir paneldi;
  yeni akışla deneyimsel hale geliyor. Pedagojik olarak en değerli ekleme bu.
- **Karışık sonuçlar** "tek doğru cevap" tuzağından korur — "açık uçlu karar
  verme" tasarım ilkesiyle uyumlu.
- **Lina'nın "bir şansın olsaydı" sorusu** duyuru turundaki yansıtma sorusunun
  (`LINA_CLOSING_CHOICES`) doğal devamı gibi çalışır.
- `SolutionCard`'da `horizon: 'hemen' | 'orta' | 'uzun'` alanı hazır kanca:
  "uzun vade" kartları 30 günde az görünür — "hemen etki vs kalıcı yatırım"
  dengesini hissettirir.

## 4. Dikkat edilmesi gerekenler

### 4.1 Değişim nasıl gösterilecek? (asıl maliyet burada)

Üç katman:

- **Görsel delta:** baraj seviyesi, tarla rengi, parkta solan ağaçlar, onarılmış
  kaçak. En etkili ama asset maliyeti var.
- **NPC diyaloğu:** `npcPlanReaction` mekanizması hazır; 30 gün sonrası için her
  NPC'ye "iyileşen + kötüleşen" ikili tepki yazılmalı. Kimse tam mutlu/mutsuz
  olmasın — "mükemmel plan yok" dersi bu.
- **Pano:** `NOTICE_BOARD` "30 gün sonra" gazete başlığı gibi kullanılabilir —
  ucuz ve dramatik.

Kademeli hızlandırma yerine öneri: kısa timelapse (gün sayacı + birkaç görsel
geçiş + ses), sonra serbest keşif. İstenirse 15. günde tek NPC'den "henüz erken
ama şunu fark ettim" ara kontrolü — ucuz, gerilimli.

### 4.2 Sonuç modeli nedensel kalmalı

Her sonuç bir karara veya gösterilen bir olaya bağlanabilmeli. Rastgelelik iyi
kararı cezalandırırsa dersi bozar. Alternatif: 30 gün içinde **senaryolu olay**
(örn. 3. hafta sıcak dalgası) — deterministik ama sonradan açıklanan.
Sebep → sonuç görünürlüğü pedagojinin tamamı.

### 4.3 İkinci şansın çerçevesi kritik

İki seçenek:

- **Tam geri sarma:** "oyunda deneyebilirsin, gerçekte geri alamazsın"
  dürüstlüğüyle. Duygusal olarak tatmin edici.
- **Yeni bütçe dönemi:** harcanan harcandı, kalan bütçeyle yeni karar. Daha
  gerçekçi — "sistemler geri sarılmaz, uyum sağlar" dersi.

Öneri: sınırlı ikinci tur (kalan bütçe veya en fazla N kart değişimi). Tam
yeniden planlama ilk turu anlamsızlaştırır. Rapor ekranında **önceki plan /
yeni plan yan yana** gösterilsin — öğrenme karşılaştırmada.

### 4.4 Öğretmen/veli verisi — erken karar gerekiyor

Mevcut ilke: "kişisel veri toplamayan mimari, oturum tarayıcıda" (`README.md`,
`session.ts` → localStorage). Paylaşım için iki yol:

- **Hafif:** oyun sonunda indirilebilir/paylaşılabilir rapor (link veya PDF
  benzeri özet) — hesap yok, hızlı.
- **Ağır:** backend + hesap + veli onayı — KVKK/çocuk verisi ciddi hukuki yük,
  pilot öncesi gereksiz.

`session.ts` zaten "backend gelince sadece burası değişir" diye tasarlanmış —
doğru dikiş noktası.

Anlamlı veri: işaretlenen kanıtlar, kontrol sorusu yanıtları, seçilen çözümler +
gerekçe, ilk vs ikinci plan farkı, yansıtma seçimleri. **Puan değil, davranış
profili** ("kanıt arayan", "dengeci") — blog yazısındaki vaatle tutarlı.

### 4.5 Yapay zekâ notu

Öğretmen güveni şeffaflık ister: önce betimleyici analitik, AI içgörüleri pilot
sonrası. Senaryo üretiminde AI taslak çıkarabilir ama sonuç metinleri elle
ayarlanmalı — pedagoji orada yaşıyor.

## 5. Önerilen öncelik sırası

1. **Sonuç içeriği** — NPC tepkileri + stat delta mantığı (değer burada)
2. **Zaman atlaması sunumu** — timelapse, görsel deltalar
3. **İkinci karar turu + karşılaştırmalı rapor**
4. **Paylaşılabilir rapor** — en sonda; formatı ilk üçüne bağlı

Teknik: `GameScene` stage makinesine `timeskip → observe → second-meeting →
epilogue` eklemek `QuestStage` tipiyle temiz uzar.

## 6. Arkadaşlara sorulacak sorular

- İkinci şans anlamlı hissettirdi mi, yoksa "oyun hilesi" gibi mi geldi?
- 30 gün sonrasında en çok neyi fark ettin?
- (Genel) Nerede sıkıldın, neyi hatırlıyorsun?

Bu ilk iki cevap tasarımın en riskli varsayımlarını test eder.

## 7. V1 ile karşılaştırma notu

v1'deki "Yeni Kanıt → Yeniden Değerlendir" adımı (düşük yağış tahmini + tek
revize hakkı) korunabilir veya yeni akışta "30 gün içindeki senaryolu olay"a
dönüştürülebilir. Karar: arkadaş geri bildirimleri sonrası.
