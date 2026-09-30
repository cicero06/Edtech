# Denge Kasabası V2 — Gelişim Konuşması ve Tasarım Notları

**Kayıt tarihi:** 30 Eylül 2026

**Durum:** Tasarım tartışması; arkadaş geri bildirimleri bekleniyor.

**Kapsam:** İlk devam hikâyesi fikri, buna yapılan yorumlar, V1 ekranlarının incelemesi, V1–V2 karşılaştırması, arkadaşlara gönderilecek karakter notu ve V2’nin kaldığı yerden devamı için öneriler.

## Bu belge nasıl okunmalı?

Bu belge, tasarım sohbetinin bütün ana konuşma bölümlerini kronolojik olarak koruyan kapsamlı bir kayıttır. Birebir mesaj dökümü değildir; yazım hataları düzeltilmiş, tekrar eden fikirler bağlamlarıyla birlikte düzenlenmiştir. Kullanıcının fikirleri, kod incelemesinden elde edilen bulgular ve asistanın önerileri birbirinden ayrılmıştır. Görev/diyalog örnekleri ve tartışılan alternatifler korunmuştur.

- **Kullanıcının fikri:** Oyunun geliştiricisinin aktardığı hedef veya olası hikâye.
- **Mevcut özellik / kod bulgusu:** Sohbet sırasında yerel kaynak kodda incelenen yapı. Bu, canlı yayının ayrıca test edildiği anlamına gelmez.
- **Öneri:** Henüz uygulanmamış veya kesinleşmemiş geliştirme fikri.
- **Açık karar:** Arkadaş geri bildirimleri ve sonraki tasarım çalışmasıyla netleştirilecek konu.

Bu konuşmada oyuna kod eklenmedi. Konuşma, fikir geliştirme ve mevcut yapıyı anlama amaçlıydı. Bu belgenin oluşturulması da oyun özelliklerinin uygulanması anlamına gelmez.

Aynı klasördeki `v2-sonrasi-tasarim-notlari.md` dosyası korunmuştur. Oradaki öneriler otomatik olarak bu konuşmanın ortak kararı kabul edilmemelidir. İki not arasında farklı alternatifler bulunan konular belgenin sonunda ayrıca açıklanmıştır.

---

# 1. İlk konuşma — Kullanıcının V2 devam hikâyesi

## 1.1 Başlangıç noktası

Kullanıcı, ön gösterimdeki V2 üzerinde geliştirmeye devam etmek istediğini belirtti. Hatırladığı son aşama, kararlaştırılan planın kasaba panosunda duyurulmasıydı.

İlk versiyona yeniden bakılacak; arkadaşlardan da geri bildirim alınacak. Dolayısıyla bu aşamada amaç hemen uygulamaya geçmek değil, olası devamı tartışmak ve karar için zemin oluşturmaktı.

## 1.2 Kullanıcının önerdiği temel hikâye

1. Oyuncu planlarını yapar ve hayata geçirir.
2. Sonuçları yaklaşık **30 gün sonra**, oyun içi zaman geçişiyle görür.
3. Değişimi gözlemleyebilmesi için kademeli zaman hızlandırma kullanılabilir.
4. Kasabada herkes aynı sonucu yaşamaz:
   - Bazı kişiler memnun olabilir.
   - Bazı kişiler memnun olmayabilir.
   - Bazı sorunlar çözülür.
   - Bazı sorunlar çözülmeden kalır.
   - Bazı sorunlar kötüleşebilir.
5. Oyuncu karakterlerle tek tek konuşur ve kasabanın genel durumunu inceler.
6. Sonuçlar ve raporlar üzerinden Lina ve belediye başkanıyla görüşür.
7. Lina, oyuncuya ikinci bir şans sunar. Kullanıcının örnek ifadesi:
   > “Bir şansın daha olsaydı nasıl kararlar alırdın? Böyle bir seçeneğin olduğunu biliyor muydun?”
8. Oyuncu zaman atlamasından önceki karar noktasına dönüp farklı kararlar alabilir.
9. İkinci denemenin değişimleri yeniden gözlenir.
10. Son rapor belediye başkanına sunulur ve oyun burada biter.

Temel amaç, gerçek hayattaki gibi aynı kararın farklı alanlarda farklı sonuçlar doğurabildiğini göstermekti.

## 1.3 Kullanıcının veri ve raporlama fikri

Oyuncunun/öğrencinin bütün adımlarında oluşan verilerin değerlendirilmesi düşünülüyordu:

- Seçtiği çözümler ve verdiği kararlar.
- Karar gerekçeleri.
- Sorulara verdiği yanıtlar.
- Sosyal durumları değerlendirme biçimi.
- Farklı kişilere ve ihtiyaçlara yaklaşımı.
- Süreç içinde düşüncesinde oluşan değişimler.

Kullanıcı, bu verilerin öğretmen ve veliyle açık biçimde paylaşılmasını önerdi. İleride yapay zekânın analiz ve senaryo üretiminde kullanılması da olası bir gelecek yönü olarak dile getirildi.

**Durum:** Bu, kullanıcının ürün fikridir; kapsamlı veri toplama, paylaşım altyapısı veya yapay zekâ analizi mevcut özellik olarak doğrulanmadı.

---

# 2. İlk fikre verilen yorumlar

## 2.1 En güçlü taraf: Oyunun karar verildiğinde bitmemesi

İlk yorumun ana düşüncesi şuydu:

> Oyuncu yalnızca “Ben olsam şunu yapardım” dememeli; kararının insanlara ne yaptığını görmeli, beklemediği sonuçlarla karşılaşmalı ve düşüncesini yeniden değerlendirebilmeli.

Bu nedenle plan seçimi bir son değil, sonuçları araştırma bölümünün başlangıcı olabilir.

## 2.2 Otuz gün, yalnızca bir bekleme ekranı olmamalı

“Planı uygula → zamanı hızlandır → sonuç ekranını göster” akışı tek başına zayıf kalabilir. Oyuncu sonucu görür ama sonucun nasıl oluştuğunu anlayamayabilir.

Önerilen zaman durakları:

- **İlk günler:** Uygulama başlar. Fiziksel değişiklikler ve ilk tepkiler görünür.
- **Sürecin ortası:** İlk faydalar ve öngörülmeyen etkiler belirir.
- **30. gün:** Oyuncu kasabayı yeniden dolaşır, insanları dinler ve verileri inceler.

Aradaki günler hızlı akabilir; önemli gelişmelerde oyun yavaşlayabilir veya durabilir. Hızlandırma yalnızca bir düğme değil, anlatımın ritmi olarak kullanılabilir.

Önemli sınır: **Her karar 30 günde nihai sonuç vermemeli.** Bazı sonuçlar için “İlk işaretler olumlu ama henüz kesin konuşamıyoruz” denmesi gerçekçi ve öğreticidir. Uzun vadeli yatırım, kısa vadede az fayda verdiği için otomatik olarak başarısız sayılmamalıdır.

## 2.3 Memnuniyet ile sorunun çözülmesi aynı şey değil

Karışık sonuçlar yalnızca “bu karakter mutlu, şu karakter mutsuz” düzeyine indirgenmemeli.

İlk yanıtta, mevcut su senaryosuna ait olmayan, düşünceyi açıklamak için kullanılan varsayımsal bir örnek verildi:

> Meydan araç trafiğine kapatılır. Çocukların güvenliği artar. Bazı esnafların teslimatları zorlaşır. Yürümekte güçlük çeken bir kasabalı meydana ulaşmakta zorlanır. Başka bir esnaf artan yaya hareketinden memnun olur.

Bu örneğin amacı, aynı kararın gerçek bir fayda, gerçek bir bedel ve başlangıçta fark edilmemiş bir ihtiyaç doğurabileceğini göstermekti. Meydanı trafiğe kapatma, V2’de var olan bir çözüm olarak sunulmadı.

Oyuncunun üç tür bilgiyi birlikte değerlendirmesi önerildi:

1. İnsanlar ne söylüyor?
2. Kasabada gözle görülür ne değişmiş?
3. Ölçümler veya kayıtlar ne gösteriyor?

Bunlar her zaman tam örtüşmeyebilir. Böylece “Rapor iyi çıktı, demek ki herkes için iyi” düşüncesi sorgulanabilir.

Ayrıca her karara sırf karmaşıklık yaratmak için felaket eklenmemeli. Sonuçlar şaşırtıcı olabilir ama geriye bakınca anlaşılabilir olmalı. Oyuncu senaristin gizli doğru cevabını tahmin etmeye zorlanmamalı.

## 2.4 İkinci şans, “Yanlış yaptın, tekrar dene” anlamına gelmemeli

Lina’nın bir cevap anahtarı değil, oyuncunun düşünmesini sağlayan karakter olması önerildi.

“Böyle bir seçeneğin olduğunu biliyor muydun?” sorusu, gizlenmiş bir doğru çözüm bulunduğu hissini yaratabilir. Alternatif sorular:

- “Başlangıçta ne olacağını düşünüyordun?”
- “Seni en çok hangi sonuç şaşırttı?”
- “Kimin ihtiyacını yeterince hesaba katmamış olabiliriz?”
- “Bugün bildiklerinle o güne dönsen neyi korur, neyi değiştirirdin?”

**Neyi koruyacağı da önemlidir.** İkinci tur açıldı diye oyuncu bütün kararlarını değiştirmek zorunda olmamalı. Yeni kanıtlara bakıp bir kararını gerekçeli biçimde sürdürmesi de değerli olabilir.

İkinci şans yalnızca başarısız görünen oyunculara sunulmamalı; herkese açık bir öğrenme bölümü olabilir.

## 2.5 Geri dönmek ile mevcut planı düzeltmek farklı deneyimlerdir

İki seçenek tartışıldı:

| Alternatif | Araştırdığı soru |
|---|---|
| Karar anına dönüp başka bir plan denemek | “Başka türlü karar verseydim ne olurdu?” |
| 30. günden devam edip mevcut durumu düzeltmek | “Bu sonuçlardan sonra sorumluluk alıp ne yapabilirim?” |

Asistan, kullanıcının ikinci şans ve karşılaştırma hedefi için **karar anına dönmeyi** daha uygun buldu. Bunun kasabada yaşananları sihirli biçimde silmek yerine, açıkça “alternatif senaryoyu deneme” bölümü olarak çerçevelenmesi önerildi.

Adil karşılaştırma için oyuncu farklı karar verdiğinde arka plandaki koşullar sebepsiz değişmemeli. Aksi hâlde farkın ne kadarının karardan doğduğunu ayırt etmek zorlaşır.

İkinci tur otomatik olarak daha iyi sonuçlanmak zorunda değildir. Bir sorunu çözerken başka bir bedel ortaya çıkabilir.

Ana mesaj:

> “Kusursuz planı bul” değil, “Daha bilinçli karar ver ve sonuçlarını değerlendirebil.”

## 2.6 Final sunumu yalnızca sonuç teslimi olmamalı

Önerilen final sunumu soruları:

1. Başta neyi hedefledim?
2. Ne oldu ve bunu hangi gözlemlere dayandırıyorum?
3. İkinci denemede neyi, neden değiştirdim veya korudum?
4. Hâlâ çözülemeyen ne var?

Belediye başkanı yalnızca “doğru/yanlış” diyen bir otorite yerine gerekçe sorabilir. Lina, başlangıçtaki düşünceyle son düşünceyi yan yana getirebilir.

Finalin ödülü herkesin alkışlaması değil, oyuncunun artık daha fazla şeyi görebilmesi olabilir.

## 2.7 Öğretmen ve veli raporunda ham veri ile yorum ayrılmalı

Kullanıcının “tüm verileri açık paylaşma” fikrine getirilen çekince:

> Her adımı kaydetmek, her adımı öğretmen ve veliye aynen göstermek anlamına gelmemeli.

Öğrenci her denemesinin kendisi hakkında bir yargıya dönüşeceğini hissederse, samimi karar vermek yerine yetişkinlerin beğeneceği cevapları seçebilir. Bu, keşif alanını daraltabilir.

Raporun odağı kişilik değerlendirmesi değil, **oyun içinde gözlenen düşünme süreci** olmalı.

| Kaçınılacak yorum | Tercih edilen gözlem |
|---|---|
| “Empatisi düşük.” | “İlk planda iki grubun ihtiyaçlarını ele aldı; ikinci planda erişilebilirlik ihtiyacını da gerekçesine ekledi.” |
| “Kararsız.” | “Yeni bilgi aldıktan sonra kararını değiştirdi ve değişikliğin nedenini açıkladı.” |
| “Başarısız bir plan yaptı.” | “Hedeflediği faydayı sağladı; ortaya çıkan yan etkiye ikinci turda çözüm önerdi.” |

Bunlar mevcut rapor çıktıları değil, rapor dilini açıklamak için verilen örneklerdir.

Öğretmene öğrenme sürecine ilişkin kanıtlar ve konuşma önerileri; veliye daha sade bir özet ve çocukla tartışabilecekleri sorular sunulabilir. Öğrenci de neyin kaydedildiğini ve kimlerle paylaşılacağını yaşına uygun biçimde bilmelidir.

Yapay zekâ ileride kanıtları düzenleyip özet taslağı hazırlayabilir. Ancak tek oyun deneyiminden çocuğun kişiliği veya sosyal yeterliliği hakkında kesin hüküm üretmemelidir.

## 2.8 İlk yanıtta önerilen genel akış

**Panoda planın duyurulması → beklenti kaydı → uygulama → zaman içinde birkaç gelişme → kasabayı yeniden keşif → ilk rapor → Lina ile değerlendirme → alternatif karar turu → iki sonucun karşılaştırılması → belediye başkanına final sunumu.**

Özellikle uygulamadan önce bir beklenti kaydı önerildi:

> “Bu planla neyin değişeceğini düşünüyorsun? Kimler fayda görecek? Seni endişelendiren bir ihtimal var mı?”

Başlangıç beklentisi ile son açıklama karşılaştırıldığında, yalnızca son karara bakmaktan daha anlamlı bir gelişim görülebilir.

Arkadaşlara sorulması önerilen ilk soru:

> “İkinci turu yeniden oynamayı ilginç kılan ne olurdu?”

İkinci tur, ilk turun tekrarı değil; oyuncunun artık başka gözle baktığı bir deneyim olmalıdır.

---

# 3. İkinci konuşma — V1 ekranları ve mevcut akış

## 3.1 Kullanıcının ekranlarla aktardığı açıklama

Kullanıcı dokuz ekran görüntüsü paylaştı. Açılış ekranını son sırada yüklediğini belirtti ve şu akışı anlattı:

1. Karşılama ekranında Lina konuşması var.
2. Bölgeler inceleniyor. Belediye, görevin öğrenildiği yer; diğer bölgelerde suyun nasıl ve ne için kullanıldığı öğreniliyor. Demoda bu içerikler genel bilgilendirme düzeyinde.
3. Bölge incelemelerinden sonra kaynaklar tek tek inceleniyor. Her kaynak başka bilgi sağlıyor; grafikler ve sosyal medya paylaşımları da ele alınıyor.
4. Kaynaklardan sonra çözüm seçenekleri seçiliyor.
5. Karar ve onay ekranında genel özet, gerekçe ve güven düzeyi yer alıyor.
6. Planın sonuçları görülüyor.
7. Sonuçlar değerlendiriliyor. Plan değiştirilecekse plan seçimine dönülüyor; korunacaksa değerlendirme tamamlanıyor.
8. Gözlenen süreç göstergeleri gösteriliyor ve demo bitiyor.

Kullanıcının isteği, bu yapının yeni hikâyeye uygunluğunu yorumlamak ve V2’de nasıl yararlanılabileceğini tartışmaktı. Arkadaş geri bildirimleri alınmadan kesin geliştirme kararı verilmemesi özellikle vurgulandı.

## 3.2 Görsellerin doğru sırası

Dokuz görsel, sekiz ayrı ekranı gösteriyor. İkinci ve üçüncü görseller araştırma ekranının farklı kaynakları açık hâli.

| Oyun sırası | Yükleme sırası | Ekran / yapılan iş |
|---|---|---|
| 1 | Görsel 9 | Karşılama; Lina’yla tanışma, sorunu ve görevi öğrenme |
| 2 | Görsel 1 | Kasaba bölgelerini inceleme |
| 3 | Görsel 2–3 | Farklı bilgi kaynaklarını inceleme |
| 4 | Görsel 4 | Çözüm seçeneklerinden plan oluşturma |
| 5 | Görsel 5 | Plan onayı, gerekçe ve güven düzeyi |
| 6 | Görsel 6 | Sonuçlar ve yeni bilgi |
| 7 | Görsel 7 | Planı koruma veya değiştirme yönünde yeniden değerlendirme |
| 8 | Görsel 8 | Gözlenen süreç göstergeleri / oturum özeti |

Görseller bu belgenin içine kopyalanmadı. Yukarıdaki numaralar sohbet içindeki yükleme sırasını korur. Geçici yükleme yolları kalıcı proje varlığı olarak kabul edilmedi.

## 3.3 Kod incelemesinde hangi sürümler ayrıldı?

Çalışma alanında eski bir `demo/frontend` kopyası da bulundu. Ekranlarla eşleşen geliştirilmiş V1 kodu `website/denge-kasabasi-game` altında; 2D V2 kodu `website/denge-game-v2` altında incelendi.

Özellikle Lina’nın açılışı, “Bu kaynaktan ne öğrendik?” bölümü ve bütün kaynaklar incelenmeden ilerlemeyi engelleyen yapı, ekranlarla eşleşen V1 kodunda doğrulandı. Eski demo kopyasının bütün ayrıntıları güncel V1’e otomatik olarak atfedilmedi.

## 3.4 Ekran 1 — Karşılama: “Burada neden varım?”

### Mevcut yapı

Lina yalnızca kendini tanıtmıyor. Baraj seviyesinin düştüğünü, bazı tarlaların yeterince sulanamadığını, belediyenin bir plan hazırladığını anlatıyor. Evlerin, tarlaların, parkların ve belediyenin birbirine bağlı olduğunu; bir yerdeki kararın başka yerde sonuç doğurabileceğini söylüyor.

### Yorum ve V2 karşılığı

Bu konuşma oyunun ana düşüncesini kuruyor. Açılışı uzun açıklamalarla büyütmek yerine, Lina’nın anlattığı bağlantıları oyuncunun daha sonra keşfetmesi önerildi.

Başlangıçta “Tarım da su istiyor, evler de” demek yeterli olabilir. Bu ihtiyaçların neden gerilim oluşturduğu sonraki deneyimlerle anlaşılabilir.

## 3.5 Ekran 2 — Bölge incelemeleri: “Kasaba nasıl çalışıyor?”

### Mevcut yapı

- **Baraj:** Suyun kaynağı, rezerv ve gelecekteki ihtiyaç.
- **Evler:** Günlük su kullanımları ve küçük kullanımların birleşen etkisi.
- **Tarım:** Bitkilerin su ihtiyacı, hava koşulları ve sulama yöntemi.
- **Park:** Gölge, canlıların yaşam alanı ve çevresel etkiler.
- **Belediye:** Birlikte düşünülmesi gereken ihtiyaçlar, bütçe ve önceliklendirme.

V1’de belediye bölgesindeki anlatıcı Derya’dır; V2’de görevi veren belediye başkanıyla aynı karakter değildir. İşlevler karşılaştırılırken karakter adları birbirine karıştırılmamalıdır.

### Öğrenme amacı olarak yapılan yorum

Bu aşama henüz çözüm seçmek değil, problemi tanımaktır.

### V2 karşılığı ve öneriler

V2’de başkan görev verir; oyuncu dört bölgeyi gezer, bulguları defterine kaydeder ve sonra bunlara döner.

Uzun metin eklemekten çok konuşmayı yerindeki gözlemle desteklemek önerildi:

- Nuri Amca kaçaktan bahseder; oyuncu sokaktaki kaçağı görür.
- Rıza sulamayı anlatır; oyuncu tarladaki yöntemi inceler.
- Aylin rezervi anlatır; önceki ve güncel ölçüm karşılaştırılır.

Amaç, “Bölgeyi ziyaret ettim” ile “Bir şey öğrendim” arasındaki ilişkiyi güçlendirmektir.

## 3.6 Ekran 3 — Kaynak araştırması: “Neye dayanarak karar vereceğim?”

### Mevcut yapı

Altı kaynak bulunuyor:

1. Belediye mühendisi.
2. Çiftçi.
3. Çevre uzmanı.
4. Su kullanım verisi.
5. Sosyal medya paylaşımı.
6. Belediye bütçe bilgisi.

Küçük netleştirme: Kullanım grafiği mühendis görüşünden ayrı bir kaynak olarak tanımlı. Görüntülenen sosyal medya içeriğinde barajın birkaç gün içinde kuruyacağı iddiası bulunuyor; kaynak veya resmî veri belirtilmediği açıklanıyor. Sosyal medya içeriği, doğrulanmış veriyle eşdeğer sunulmuyor.

### Bölge gezisiyle farkı

- Bölge gezisi: İhtiyacı tanımak.
- Kaynak araştırması: İddiaları ve olası açıklamaları değerlendirmek.

İkincisi, birincinin tekrarına dönüşmemelidir. 2D dünyada dolaşmak tek başına kanıt değerlendirme deneyiminin yerini tutmaz.

### V2’ye taşıma önerileri

Aynı altı-kart ekranının birebir taşınması şart değil:

- Aylin’den ölçüm grafiği alınabilir.
- Belediyeden bütçe belgesi incelenebilir.
- Bir kasabalıdan paylaşım veya söylenti duyulabilir.
- Defter üzerinden kaynaklar karşılaştırılabilir.

V1’de “Bu kaynaktan ne öğrendik?” sonucu hazır veriliyor. V2’de bazı noktalarda önce oyuncuya “Bu bilgi hangi düşünceni destekliyor?” diye sorulması önerildi. Böylece yalnızca bilginin sunulduğu değil, nasıl kullanıldığı da görünür olabilir.

## 3.7 Ekran 4 — Çözüm seçenekleri: “Hangi bedeli kabul ederek neyi değiştireceğim?”

### Mevcut V1 yapısı

Çözümler maliyet, fayda, risk, etki süresi ve ilgili kanıtlarla sunuluyor. Başlangıç bütçesi 50 birim; en fazla üç müdahale seçilebiliyor.

V1 çözüm listesi:

- Şebeke kaçaklarını onar.
- Tarımsal sulamayı azalt.
- Park sulamasını azalt.
- Yağmur suyu toplama sistemi kur.
- Yeni kuyu aç.

### V2 ile önemli fark

V2’nin çözüm listesi farklı:

- Fıskiyeleri kapat.
- Tasarruf kampanyası.
- Boru kaçaklarını onar.
- Damla sulama desteği.
- Yağmur suyu hasadı.

V2’nin mevcut çözüm paketinde 1.000.000 TL bütçe kullanılıyor. V1’in soyut bütçe ve müdahale kuralları V2’ye birebir taşınmış kabul edilmemeli.

Özellikle **fıskiyeleri/süs havuzlarını kapatmak, park sulamasını azaltmak veya ağaçları susuz bırakmakla aynı müdahale değildir.** Sonuç metinleri aktarılırken bu ayrım korunmalıdır.

### Tasarım yorumu

Korunması gereken şey seçeneklerin birebir aynısı değil, karşılaştırma mantığıdır.

Her V2 çözümü için sorulması önerilen sorular:

- Neyi değiştiriyor?
- Kime yarıyor?
- Kimi zorluyor?
- Ne zaman etkili oluyor?
- Hangi koşullarda beklenenden farklı sonuç veriyor?

Eski sonuçları yeni seçeneklere doğrudan yapıştırmak yerine, sonuçlar yeni müdahalenin gerçek işlevine göre yazılmalıdır.

## 3.8 Ekran 5 — Karar ve onay: “Neden bunu seçtim, ne kadar eminim?”

### Mevcut V1 yapısı

Oyuncu planı gözden geçiriyor, gerekçe seçiyor ve 1–5 arasında güven düzeyi belirtiyor. Seçimin kendisi kadar neden seçildiği ve oyuncunun eminlik düzeyi de alınıyor.

### Mevcut V2 yapısı

Belediye toplantısında gerekçe sorusu zaten bulunuyor. Oyuncu hazır gerekçelerden seçebiliyor veya kendi kısa cümlesini yazabiliyor. Bu bölüm, yeniden ayrı bir forma dönüştürülmek zorunda değil.

### Öneri

“Otuz gün sonra neyin değişmesini bekliyorsun?” sorusu eklenebilir. Sonradan “Şaşırdın mı?” demekten önce beklentinin bilinmesi, düşüncedeki değişimi anlamayı kolaylaştırır.

Güven düzeyi, doğruluk veya başarı puanı olarak yorumlanmamalıdır.

## 3.9 Ekran 6 — Sonuçlar: “Gerçekte ne oldu?”

### Mevcut hesaplama

V1 sonuçları seçilen müdahalelerin sabit su etkilerini topluyor; maliyetleri başlangıç bütçesinden çıkarıyor. Tarım ve çevre etkileri metinlerle gösteriliyor. Bu hesapta 30 gün boyunca ilerleyen bir süreç bulunmuyor.

Ekran örneğinde başlangıç su durumu %42 iken üç müdahalenin toplam +33 yüzde puan etkisiyle %75 gösteriliyor; 50 birim bütçeden 27 harcanıp 23 kalıyor. Bu, bir günlük/aylık fiziksel su modeli olarak doğrulanmış değil, oyunun basitleştirilmiş hesaplamasıdır.

Yeni bilgi olarak önümüzdeki üç ayda yağışların normalin yaklaşık %40 altında kalmasının beklendiği gösteriliyor. Revize sonuçta yağmur suyu toplama seçeneğinin kısa vadeli katkısı azalabiliyor.

### V2 için önerilen dönüşüm

Sonuç ekranı kaldırılmak yerine, kasabada yaşananların özeti hâline gelebilir:

1. Zaman geçer.
2. Oyuncu değişmiş bölgeleri görür.
3. İnsanların deneyimlerini dinler.
4. Güncel ölçümleri inceler.
5. Bulguları raporda birleştirir.

Örnek: Boru onarımı seçildiyse yalnızca “su arttı” yazmak yerine kaçak durur, Nuri günlük yaşamdaki karşılığını anlatır, Aylin ölçüm sunar.

Aynı sonucun görüntü, insan deneyimi ve veri üzerinden görülmesi, üç uzun açıklamadan daha etkili olabilir.

## 3.10 Ekran 7 — Yeniden değerlendirme: “Şimdi aynı kararı verir miyim?”

### Mevcut V1 yapısı

İkinci şansın temeli V1’de zaten var:

- Oyuncuya beklemediği bir sonuç/yeni bilgi olup olmadığı soruluyor.
- Planı değiştirmek isteyip istemediği soruluyor.
- Değiştirmek isterse planlama ekranına dönüyor.
- En fazla bir revizyon yapılabiliyor.
- İkinci sonuçtan sonra oturum özetine geçiliyor.

Revize sonuç hesabı, ilk turun kalan bütçesine yeni gider eklemek yerine başlangıç bütçesi ve revize plan üzerinden hesaplanıyor. Dolayısıyla bu yapı, yeni bir bütçe dönemiyle devam eden ayrıntılı kasaba simülasyonuyla aynı şey değil.

### V2’de derinleştirme

Lina ve başkan görüşmesinde şu sorular kullanılabilir:

- Hangi beklentin gerçekleşmedi?
- Hangi kişinin yaşadığı sonuç kararını etkiledi?
- Neyi değiştiriyorsun?
- Neyi, neden koruyorsun?

Önemli ayrım:

> “Yeni bilgi beni etkiledi” ile “Planımı değiştirdim” aynı şey değildir.

Oyuncu yeni bilgiyi değerlendirdikten sonra mevcut planını gerekçeli biçimde koruyabilir. Plan değiştirmemek otomatik olarak öğrenmeme anlamına gelmez.

## 3.11 Ekran 8 — Süreç göstergeleri: “Oyuncu bu deneyimde neler yaptı?”

### Mevcut V1 göstergeleri

- İncelenen bölge sayısı.
- İncelenen bilgi kaynağı sayısı.
- Değerlendirilen çözüm seçeneği sayısı.
- Oluşturulan plan sayısı.
- Yardım/ipucu kullanımı.
- Yeni kanıtın görüntülenmesi.
- Yeni kanıt sonrası stratejinin değiştirilmesi.
- Yeniden değerlendirme bölümünün tamamlanması.

V1 açıkça şu sınırları belirtiyor:

- Davranışsal iz, yetkinlik puanı değildir.
- Tek oturum genel yeterliği göstermez.
- Göstergelerin geçerliği ayrıca araştırılmalıdır.

### Yorumlama sınırı

Araştırma ekranında bütün kaynakları incelemek ilerleme koşulu. Bu yüzden 6/6 kaynak incelemek tek başına öğrencinin kendiliğinden farklı bakış açıları aradığını kanıtlamaz; oyunun zorunlu adımını tamamladığını gösterir.

Daha anlamlı soru:

> “Grafiği açtı mı?” değil, “Grafikteki hangi bilgiyi kararının gerekçesinde kullandı?”

### V2’nin mevcut kayıt yapısı

V2’nin yerel oturum yapısı planı, gerekçeyi, defteri, işaretlenen kanıtları, görev ilerlemesini, duyuru durumunu ve istatistikleri saklıyor. Bu, bütün yanıtları ve bütün karar değişimlerini geçmişiyle birlikte izleyen kapsamlı bir süreç raporu değildir.

---

# 4. V1–V2 karşılaştırmasından çıkan genel değerlendirme

## 4.1 Temel fark

> V1’de oyuncu kararının sonucunu bir ekrandan okuyor. Önerilen V2 devamında, o sonucun oluştuğu kasabaya dönüp insanların hayatında görüyor.

Bu yalnızca görsel değişiklik değil, aynı öğrenme döngüsünü daha anlamlı bir oyun deneyimine dönüştürme fırsatıdır.

## 4.2 Mevcut V2 tam olarak nerede bitiyor?

Kodda görülen görev sırası:

`lina-intro → meet-mayor → investigate → report → meeting → announce → done`

Plan belediyeye sunulduktan sonra:

1. Başkan seçilen pakete göre tepki verir.
2. Oyuncu Aylin, Rıza, Nuri ve Kemal’e planı duyurur.
3. Afişi belediye yakınındaki panoya asar.
4. Bütün duyurular tamamlanınca Lina kapanış sorusunu sorar.
5. Oyuncunun cevabıyla görev `done` olur.

Mevcut tepkiler esas olarak **planın duyurulmasına verilen tepkilerdir**; 30 günlük uygulama sonrasındaki deneyimler değildir.

## 4.3 İstatistik etkisinin zamanı

V2 şu anda plan sunulduğu anda seçilen çözümlerin istatistik etkilerini uyguluyor.

30 günlük devam tasarlanacaksa üç kavram ayrılmalı:

- Beklenen etki.
- Uygulamanın başlaması/ilerlemesi.
- Zaman geçtikten sonra gözlenen sonuç.

Aksi hâlde sonuç önce göstergede gerçekleşip sonra hikâyede gerçekleşmiş gibi olur. Bu ayrımı yapmak, konuşmada saptanan bir geliştirme ihtiyacıdır; henüz düzeltilmiş özellik değildir.

## 4.4 Neyi koruyalım, derinleştirelim, aynen taşımayalım?

| Korunacak temel | Derinleştirilecek bölüm | Aynen taşınmaması önerilen şey |
|---|---|---|
| Keşif → kanıt → karar → sonuç → yeniden düşünme döngüsü | Karakter ihtiyaçları ve sonuç deneyimleri | Her aşamanın ayrı uzun ekran olması |
| Maliyet, fayda ve risk karşılaştırması | Zaman içinde ortaya çıkan etkiler | Sabit puan toplamını gerçekçi simülasyon gibi sunmak |
| Gerekçe ve güven soruları | Beklenti–gerçekleşen sonuç karşılaştırması | Kaynak açma sayısını öğrenme düzeyi saymak |
| Alternatif plan deneme imkânı | İki deneyimi finalde birlikte değerlendirmek | Eski seçenek ve sonuçları V2’ye birebir aktarmak |

2D’ye geçmek her bilgiyi karakter konuşmasına çevirmek anlamına da gelmemeli:

- **Kasaba:** Deneyimi yaşatır.
- **Defter:** Kanıtları düzenler.
- **Rapor:** Karşılaştırmayı kolaylaştırır.

## 4.5 Arkadaşlara sorulması önerilen değerlendirme soruları

1. Plan seçerken gerçekten bir ikilem yaşadın mı, yoksa iyi seçenek belli miydi?
2. Sonuçların neden oluştuğunu anlayabildin mi?
3. İkinci denemede neyi farklı yapmak istediğini ve nedenini söyleyebiliyor musun?

Hedef V1’i yalnızca uzatmak değil; karar ile yaşanan sonuç arasındaki ilişkiyi daha görünür ve anlamlı kılmaktır.

---

# 5. Üçüncü konuşma — Arkadaşlara gönderilecek karakter tanıtım notu

Kullanıcı, V2 karakterlerini tanıtan bir not istedi. Amaç, arkadaşların karakterlere uygun diyalog ve görev fikirleri üretmesini sağlamaktı.

Aşağıdaki bölüm bu notun içeriğini korur. **Mevcut rollerle örnek fikirler ayrılmıştır. Örnek görevler oyunda uygulanmış değildir.**

## 5.1 Paylaşılabilir giriş metni

Denge Kasabası, oyuncunun su sorunu yaşayan bir kasabada insanları dinlediği, bölgeleri incelediği, kanıt topladığı ve sınırlı bütçeyle bir çözüm planı hazırladığı bir oyun.

Amacımız yalnızca en çok su kazandıran seçeneği buldurmak değil. Oyuncunun farklı ihtiyaçları, maliyeti, çevresel etkileri ve kararlarının insanlar üzerindeki sonuçlarını birlikte düşünmesini istiyoruz.

V2’nin mevcut bölümünde oyuncu:

**Lina’yla tanışıyor → belediye başkanından görev alıyor → dört bölgeyi inceliyor → defterindeki kanıtları değerlendiriyor → planını belediyeye sunuyor → kasabalılara duyurup panoya afiş asıyor.**

Devam için henüz kesinleşmemiş fikir: Plan uygulanacak, oyun içinde yaklaşık 30 gün geçecek; oyuncu kasabadaki değişimi gözleyecek, karakterlerle yeniden konuşacak ve alternatif bir plan deneme fırsatı bulabilecek.

Arkadaşlardan karakterlere uygun **diyalog, küçük görev, ikilem ve sonuç sahnesi** fikirleri isteniyor.

## 5.2 Lina — Oyuncunun yol arkadaşı

### Mevcut rolü

Kasabada yaşayan ve oyuncuya eşlik eden karakter. Başlangıçta su sorununu anlatıyor, oyuncuyu belediyeye yönlendiriyor, incelemelerden sonra bulgularını değerlendirmesine yardımcı oluyor. Plan duyurulduğunda süreçte en çok neyin düşündürdüğünü soruyor. Haritada oyuncuyu takip ediyor.

### Geliştirilebilecek hikâye işlevi

Oyuncuyla kasaba arasında bağ kuran kişi. Yalnızca görev veren değil, oyuncuyla birlikte merak eden ve düşünen yol arkadaşı.

### Fikir alanları

- Oyuncunun fark etmediği ayrıntıya dikkat çekmek.
- İki karakterin farklı ihtiyaçlarını birlikte düşündürmek.
- İlk beklentiyle gerçekleşen sonucu karşılaştırmak.
- İkinci şansı hikâyeye bağlamak.

### Örnek diyalog

> “Başta en önemli sorunun kaçak olduğunu düşünüyordun. Şimdi herkesle konuştuk. Hâlâ aynı şeyi mi düşünüyorsun?”

**Dikkat:** Lina sürekli doğru cevabı söyleyen öğretmen gibi değil, düşünmeye alan açan arkadaş gibi konuşmalı. Kişilik ve geçmişine ilişkin doğrulanmamış ayrıntılar eklenmedi.

## 5.3 Belediye Başkanı — Ortak kararların ve bütçenin sorumlusu

### Mevcut rolü

Oyuncuya kasabanın ihtiyaçlarını araştırma görevi veriyor. Bütün çözümlere aynı anda bütçe ayrılamayacağını açıklıyor. Çözüm paketini ve gerekçesini dinliyor; planın halka duyurulmasını istiyor.

### Geliştirilebilecek hikâye işlevi

Tek bölgeyi değil, kasabanın bütününü düşünmesi gereken kişi. Öncelik belirleme ve karar sorumluluğunu temsil ediyor.

### Fikir alanları

- Aynı bütçeyi isteyen iki ihtiyacı tartışmak.
- Oyuncudan karar dayanağını istemek.
- Plan dışında kalan insanların ihtiyaçlarını gündeme getirmek.
- Uygulama sonrası raporu dinlemek.

### Örnek görev

Başkan yalnızca seçilen çözümleri değil, ertelenen bir çözümü ve neden ertelendiğini de açıklamasını ister.

**Dikkat:** Başkanın onayı oyunun tek doğru cevap ölçütü olmamalı. Mevcut karakterin özel adı belirlenmiş gibi yeni ad eklenmedi.

## 5.4 Su Mühendisi Aylin — Ölçüm ve teknik bilgi kaynağı

**Bölge:** Baraj / su rezervi.

### Mevcut rolü

Su seviyesini takip ediyor. Yağışın azalması, kullanım ve buharlaşma gibi etkenleri anlatıyor. Yalnızca bugünkü rezervi değil, gelecekteki ihtiyacı da düşündürüyor. Bölge kartında geçmiş ve güncel rezerv karşılaştırması bulunuyor.

### Geliştirilebilecek hikâye işlevi

Tahminlerle ölçümleri ayırmaya, sonucun birden fazla nedeni olabileceğini anlamaya yardımcı oluyor.

### Fikir alanları

- Önceki ve güncel su seviyelerini karşılaştırmak.
- Grafikten çıkarım yapmak.
- Kasabada yayılan iddiayı verilerle incelemek.
- Beklenen ve ölçülen değişimi karşılaştırmak.

### Örnek görev

Oyuncu “Baraj birkaç gün içinde tamamen kuruyacak” iddiasını Aylin’in ölçümleriyle karşılaştırır. Verilerin neyi gösterdiğini ve hangi çıkarım için yetersiz kaldığını değerlendirir.

**Dikkat:** Aylin her şeyi kesin bilmek zorunda değil. Bazı sonuçlar için daha fazla ölçüm gerektiğini söyleyebilir.

## 5.5 Çiftçi Rıza — Üretim, geçim ve sulama ihtiyacı

**Bölge:** Tarım alanı.

### Mevcut rolü

Ürün yetiştiriyor. Bitkilerin su ihtiyacını, hava koşullarını ve sulama yönteminin önemini anlatıyor. Damla sulamanın faydasını biliyor; kurulum maliyeti önemli bir sorun.

### Geliştirilebilecek hikâye işlevi

Su tasarrufunun üretim ve geçim üzerindeki etkisini görünür kılıyor. “Daha az su kullan” önerisinin her zaman kolay uygulanamayacağını gösteriyor.

### Fikir alanları

- Sulama yöntemlerini karşılaştırmak.
- Kısa vadeli ihtiyaçla uzun vadeli yatırımı tartışmak.
- Uygulamanın çiftçilere nasıl ulaştırılacağını düşünmek.
- Plan sonrası tarladaki değişimi incelemek.

### Örnek diyalog

> “Daha az su kullanmak istiyorum. Ama yeni sistem kurulana kadar ürünleri nasıl koruyacağız?”

**Dikkat:** Yalnızca kendi çıkarını düşünen veya her öneriye karşı çıkan karakter olmamalı. Çözüm bilgisi ve deneyimi de bulunmalı.

## 5.6 Nuri Amca — Mahallenin günlük yaşamı

**Bölge:** Konut alanı.

### Mevcut rolü

Uzun zamandır mahallede yaşıyor. Evlerdeki düşük su basıncından ve sokaktaki kaçaktan bahsediyor. Altyapı sorununun günlük karşılığını görünür kılıyor.

### Geliştirilebilecek hikâye işlevi

Büyük planların evlere ve mahalle yaşamına yansımasını anlatmak.

### Fikir alanları

- Kaçağın yerini gözleyip belediyeye bildirmek.
- Kesintinin günlük işleri nasıl etkilediğini dinlemek.
- Onarım sırasında geçici zorlukları değerlendirmek.
- Tasarruf çağrısıyla altyapı sorumluluğunu birlikte düşünmek.

### Örnek diyalog

> “Evde suyu dikkatli kullanıyoruz ama sokaktaki kaçak hâlâ akıyor. Bizim yapabileceklerimizle belediyenin yapması gerekenleri birlikte düşünemez miyiz?”

**Dikkat:** Yaşı nedeniyle yalnızca öğüt veren veya şikâyet eden karaktere indirgenmemeli.

## 5.7 Belediye Çalışanı Kemal — Parkların bakımı ve uygulama

**Bölge:** Park.

### Mevcut rolü

Parkların ve yeşil alanların bakımıyla ilgileniyor. Ağaçların gölge ve yaşam alanı sağladığını, onların da suya ihtiyaç duyduğunu anlatıyor.

### Geliştirilebilecek hikâye işlevi

Kararların çevresel etkilerini ve sahada uygulanışını görünür kılmak.

### Fikir alanları

- Süs amaçlı su kullanımıyla bitkilerin ihtiyacını ayırmak.
- Sulama saati veya yöntemini değerlendirmek.
- Tasarruf sağlarken parkın işlevlerini korumak.
- Uygulama sonrasında parkı yeniden gözlemek.

### Örnek görev

Oyuncu Kemal’le parkı inceler. Nerede su kullanımı azaltılabilir, nerede azaltma zarar doğurabilir, birlikte tartışırlar.

**Önemli ayrım:** Fıskiyeyi veya süs havuzunu kapatmak, ağaçların sulamasını tamamen kesmekle aynı şey değildir.

## 5.8 Elif Teyze — Rolü derinleştirilmeye açık kasabalı

**Bölge:** Tarım alanı.

### Mevcut rolü

Tarlaların kuruduğundan ve sulama suyunun yetmediğinden söz ediyor; oyuncunun fikrini soruyor. Diğer bölge karakterleri kadar ayrıntılı görev zinciri bulunmuyor.

### Fikir alanları

Rıza’nın söylediklerini tekrarlamak yerine farklı bir bakış kazandırabilir:

- Su sorununun aile yaşamına veya gıda ihtiyaçlarına etkisi.
- Mahalle dayanışması.
- Kasabada duyulan bilginin araştırılması.
- Planın gözden kaçırdığı ihtiyacın gündeme getirilmesi.

### Örnek görev

Elif Teyze bir komşusunun yaşadığı sorunu aktarır. Oyuncu ilgili kişiyle konuşur ve durumu yerinde inceler.

**Dikkat:** Bunlar olası geliştirme yönleridir. Ayrıntılı geçmişi ve mesleği belirlenmiş gibi sunulmadı; tarım alanında bulunması nedeniyle otomatik olarak çiftçi kabul edilmedi.

## 5.9 Arkadaşlardan fikir toplama formatı

Her öneri için:

- **Karakter:** Kim?
- **Zaman:** İlk keşifte mi, plan hazırlanırken mi, 30 gün sonra mı?
- **Durum:** Ne olmuş?
- **Diyalog / görev:** Oyuncu ne duyuyor veya ne yapıyor?
- **Karar noktası:** Neyi tartması gerekiyor?
- **Olası sonuç:** Seçim kimleri, nasıl etkiliyor?

Her karakterin yalnızca konuşması değil; oyuncuya gözlem yapma, soru sorma, karşılaştırma veya kararını açıklama fırsatı vermesi isteniyor.

Karakterler aynı fikirde olmak zorunda değil. Farklı görüşler sırf çatışma yaratmak için değil, anlaşılır ihtiyaçlardan doğmalı.

---

# 6. Dördüncü konuşma — V2 kaldığı yerden nasıl devam edebilir?

Kullanıcı, bütün değerlendirmelerden sonra V2’nin kaldığı yerden nasıl ilerleyebileceğine ilişkin somut fikir istedi.

Yanıtın ana çerçevesi:

> Panoya afişi astığımız yer bitiş değil, ikinci bölümün başlangıcı olabilir. İlk bölüm “Kasaba için ne yapacağım?”, ikinci bölüm “Yaptığım şey kasabada neyi değiştirdi?” sorusunu ele alır.

Aşağıdaki sekiz adım öneridir; uygulanmış veya kesinleşmiş geliştirme planı değildir.

## 6.1 Adım 1 — Lina’yla kapanış yerine yeni başlangıç

Mevcut kapanış sorusu korunur. Ardından Lina şöyle devam edebilir:

> “Herkes planı öğrendi. Şimdi uygulamanın kasabayı nasıl değiştireceğini göreceğiz. Sence bir ay sonra en çok nerede fark olacak?”

Oyuncu kısa bir beklenti belirtir:

- Hangi sorunun azalmasını bekliyor?
- Kimlerin hayatının kolaylaşacağını düşünüyor?
- Hangi konuda hâlâ emin değil?

Bu, sınav yerine deftere bırakılan başlangıç notu gibi sunulabilir. Sonra “Böyle düşünmüştüm, şu olmuş” diye dönüp bakılır.

## 6.2 Adım 2 — Plan gerçekten uygulanmaya başlasın

Afişten hemen sonra yalnızca “30 gün geçti” yazmak yerine, kararın harekete geçtiği gösterilir.

| Seçilen çözüm | Gösterilebilecek uygulama başlangıcı |
|---|---|
| Boru onarımı | Ekip ve çalışma alanı oluşur. |
| Damla sulama desteği | Tarlaya malzemeler gelir, kurulum başlar. |
| Tasarruf kampanyası | Afişler ve duyurular görünür. |
| Yağmur suyu hasadı | Depoların ve tesisatın kurulumu başlar. |
| Fıskiyelerin kapatılması | Parktaki fıskiyelerin çalışmadığı görülür. |

Uzun işçilik veya malzeme toplama bölümü önerilmedi. Oyunun odağı belediye işlerini tek tek yapmak değil; karar vermek ve sonuçları anlamaktır.

Bir anlamlı küçük etkileşim eklenebilir:

> Boru onarımı başlayacak. Nuri Amca, geçici kesintiden mahallenin nasıl haberdar edileceğini sorar.

Bunun amacı, iyi bir planın uygulanma biçiminin de önemli olduğunu göstermektir.

## 6.3 Adım 3 — Otuz günü anlamlı duraklarla geçirme

Sürekli akan karmaşık simülasyon yerine kontrollü hikâye durakları önerildi:

| Dönem | Gösterilecek deneyim |
|---|---|
| İlk günler | Uygulama, hazırlık ve ilk tepkiler |
| Ayın ortası | İlk değişimler ve ortaya çıkan bir güçlük |
| 30. gün | Kasabayı yeniden inceleme ve sonuç değerlendirme |

Aradaki günler hızlandırılabilir. Önemli gelişmelerde oyun yavaşlar veya durur.

### Damla sulama örneği

- İlk günlerde kurulum yapılır.
- Ortalarda sistem kullanılmaya başlanır.
- Ay sonunda bazı tarlalarda su kullanımının azaldığı gözlenebilir.
- Ürün verimine ilişkin kesin sonuç için henüz erken olabilir.

Uzun vadeli çözümler, kısa vadede az sonuç verdiği için başarısız gösterilmemelidir. Uygulama süreleri burada doğrulanmış teknik takvimler değil, anlatım örnekleridir.

## 6.4 Adım 4 — 30. gün: Tanıdık kasabayı başka amaçla keşfetme

Lina şöyle diyebilir:

> “Bir ay önce bu bölgeleri sorunu anlamak için gezmiştik. Şimdi neyin değiştiğini görmek için gidelim.”

Aynı yerler ve kişiler bulunur ama konuşmanın amacı değişir:

- **Aylin:** Başlangıç durumu yerine yeni ölçümler.
- **Rıza:** Planın tarladaki karşılığı.
- **Nuri:** Günlük yaşamındaki değişim.
- **Kemal:** Parkta işe yarayan ve zorlaşan şeyler.

Her ziyaretin kısa döngüsü:

**Gör → dinle → deftere bir bulgu ekle.**

### Boru onarımı örneği

1. Oyuncu kaçağın durduğunu görür.
2. Nuri su basıncının düzeldiğini, çalışmalar sırasında ise zorlandıklarını anlatır.
3. Aylin’in ölçümleri kaybın azaldığını destekler.

Amaç herkese uzun konuşma yazmak değil; her karakterin başka türlü fark edilemeyecek bir şey söylemesidir.

## 6.5 Adım 5 — Planla ilişkili bir güçlük veya yeni bilgi

Bütün planlara aynı olay verilmemeli; sırf şaşırtmak için rastgele felaket üretilmemeli.

| Çözüm | Olası güçlük / yeni bulgu |
|---|---|
| Tasarruf kampanyası | İnsanlar mesajı duymuş ama önerileri nasıl uygulayacağını anlamamış olabilir. |
| Damla sulama desteği | Sistemin doğru kullanımı için eğitim ihtiyacı ortaya çıkabilir. |
| Boru onarımı | Kayıp azalır; kuraklık sürdüğü için rezerv beklenenden yavaş toparlanabilir. |
| Yağmur suyu hasadı | Depolar hazırdır fakat az yağış kısa vadeli katkıyı sınırlar. |
| Fıskiyelerin kapatılması | Tasarruf sağlar ama küçük önlemin tek başına yeterli olmadığı anlaşılır. |

Bunlar senaryo adaylarıdır; her seçeneğe zorunlu ceza ekleme kuralı değildir.

Hedeflenen farkındalık:

> “Kararım tamamen yanlış değildi; ama çözmediği bir şey veya hesaba katmadığım bir koşul varmış.”

## 6.6 Adım 6 — İlk belediye toplantısı ve oyuncunun raporu

Kasaba gezisinden sonra yalnızca otomatik rapor göstermek yerine oyuncu defterindeki bulgularla kısa sunum hazırlayabilir:

1. İşe yarayan ne oldu?
2. Hangi sorun devam ediyor?
3. Bunu hangi gözleme veya bilgiye dayanarak söylüyorum?

Uzun yazı zorunlu değil. Bulgu kartları seçilip kısa açıklama eklenebilir.

Başkan bir takip sorusu sorabilir:

> “Su kaybının azaldığını söyledin. Peki Rıza’nın yaşadığı sorun neden devam ediyor?”

Bu bölümde karakterlerle konuşmanın işe yaradığı anlaşılmalı. Bilgiler yalnızca defteri doldurmaz; karar ve sonuç açıklamasında kullanılır.

## 6.7 Adım 7 — Lina’nın ikinci şansı ve alternatif plan

Lina şöyle diyebilir:

> “Artık başta bilmediğimiz şeyler biliyoruz. Aynı güne dönebilseydin neyi farklı yapardın? İstersen başka bir planın nasıl sonuçlanacağını deneyelim.”

Bu konuşmadaki asistan önerisi, **aynı başlangıç koşullarından alternatif deneme** yapılması yönündeydi. Mevcut kasabada yeni bütçeyle devam etmekten farklı olduğu oyuncuya açıkça anlatılmalıdır.

Oyuncu:

- Bir çözümü değiştirebilir.
- Önceliklerini yeniden düzenleyebilir.
- Bazı kararlarını koruyabilir.
- Değişiklik nedenini belirtebilir.

İlk bölümün tamamı yeniden oynatılmamalı:

- Tanışmalar tekrar edilmez.
- Temel incelemeler bitmiş kabul edilir.
- Defter ve kaynaklara erişim korunur.
- İstenirse belirli kaynağa geri dönülebilir.

Karar değiştirmek zorunlu değildir:

> “Şunu öğrendim ama şu nedenle planımı koruyorum.”

Bu da anlamlı bir sonuç olabilir. İkinci denemeyi sunmakla oyuncuyu farklı seçim yapmaya zorlamak aynı şey değildir.

## 6.8 Adım 8 — İkinci sonuç ve final karşılaştırması

İkinci zaman geçişi daha kısa olabilir. Değişen kararların etkisi öne çıkar; aynı kalan bütün konuşmalar tekrar edilmez.

| İlk deneme | İkinci deneme |
|---|---|
| Neyi hedefledim? | Önceliğim nasıl değişti? |
| Ne işe yaradı? | Neyi iyileştirdim? |
| Neyi gözden kaçırdım? | Hangi bedeli hâlâ kabul ediyorum? |

Finalde oyuncunun tamamlaması önerilen düşünce:

> “Bugün yeniden karar verecek olsam bu planı seçerdim, çünkü…”

Başkan kasabanın durumunu değerlendirir. Lina başlangıçtaki beklentiye döner. Herkesin kusursuz mutlu olduğu final zorunlu değildir.

Tatmin edici son, oyuncunun kararını daha bilinçli savunabilmesi olabilir.

## 6.9 İlk devam sürümü için önerilen kapsam

Kapsamı yönetilebilir tutmak için:

- Mevcut karakterler ve bölgeler.
- Üç zaman durağı.
- Seçilen planla ilişkili bir ana güçlük.
- Bir sonuç inceleme turu.
- Bir alternatif plan denemesi.
- İki deneyimi birleştiren final sunumu.

Yeni karakterler, çok sayıda yan görev ve sürekli işleyen karmaşık kasaba simülasyonu ilk aşamada şart değil.

Öncelik:

> Bir kararın anlaşılır, görülebilir ve tartışılabilir sonuç üretmesini iyi yapmak.

## 6.10 Son konuşmada önerilen tek satırlık akış

**Panodaki duyuru → beklentini belirt → uygulamayı gör → zaman geçsin → değişen kasabayı incele → ilk raporunu sun → alternatif planı dene → sonuçları karşılaştır → final sunumunu yap.**

Bu yapı, yalnızca sonuçları gösteren değil; oyuncunun sonuçları araştırıp anlamlandırdığı bir ikinci bölüm hedefliyor.

---

# 7. Konuşmaların ortak ilkeleri ve henüz açık kalan kararlar

## 7.1 Sohbet boyunca tekrar eden tasarım ilkeleri

Bunlar önerilerin ortak yönleridir; uygulanmış özellik veya nihai ürün şartnamesi değildir.

1. Karar verme, sonuçlardan kopuk olmamalı.
2. Bir sonuç mümkün olduğunca karar, uygulama veya gözlenebilir dış koşulla ilişkilendirilebilmeli.
3. Mutluluk, su miktarı ve gerçek ihtiyaçların karşılanması aynı ölçü değildir.
4. Kısa vadeli ve uzun vadeli etkiler ayrılmalı.
5. Her karara yapay bir felaket veya zorunlu mutsuzluk eklenmemeli.
6. Lina ve başkan gizli doğru cevabı açıklayan karakterlere dönüşmemeli.
7. Yeni bilgi sonrası karar korumak da gerekçeli olabilir.
8. İkinci deneme ilk turun sıkıcı tekrarına dönüşmemeli.
9. Gözlem, insan deneyimi ve ölçüm birbirini tamamlamalı.
10. Kaynak görüntülemek ile kanıt kullanmak ayrı gözlemlerdir.
11. Öğrencinin süreç verisi kişilik etiketi veya doğrulanmamış yetkinlik puanı değildir.
12. Beklenen etki, uygulama ve gerçekleşen sonuç aynı anda sunulmamalı.
13. Mevcut karakterler ve basit, anlaşılır sonuç modeliyle başlamak yeterli olabilir.

## 7.2 Açık kararlar

### Zaman ve simülasyon

- Süre kesin 30 gün mü olacak?
- Ara duraklar hangi günlerde olacak?
- Zaman oyuncunun kontrolünde mi ilerleyecek, sahne geçişleriyle mi?
- Ara olaylarda oyuncu yalnızca gözlem mi yapacak, uygulama kararı da verecek mi?
- Uzun vadeli çözümlerin henüz görünmeyen faydası nasıl anlatılacak?

### Sonuç içeriği

- Her çözüm için hangi görsel değişiklikler üretilecek?
- Kaç karakter konuşması yeterli olacak?
- Bir ana güçlük mü, birden fazla olay mı gösterilecek?
- Dış koşulların ve plan kombinasyonlarının sonuçlara etkisi nasıl tanımlanacak?
- Karşılaştırılabilir iki denemede koşullar nasıl korunacak?

### İkinci şans

- Alternatif başlangıç senaryosu mu, mevcut durumdan düzeltme mi?
- İkinci deneme isteğe bağlı mı olacak?
- Planını koruyan oyuncu nasıl bir final akışı görecek?
- İlk turdan ikinci tura hangi bilgiler taşınacak?
- Aynı kalan sonuçlar tekrar edilmeden nasıl gösterilecek?

### Veri ve rapor

- Hangi yanıtlar gerçekten kaydedilecek?
- Beklenti, gerekçe, güven ve kanıt bağlantısı nasıl tutulacak?
- Öğretmen ve veli hangi ayrıntıları görecek?
- Öğrenci neyin paylaşıldığını nasıl anlayacak?
- Yerel kayıt, indirilebilir rapor veya sunucu üzerinden paylaşım arasında hangi yaklaşım seçilecek?
- Yapay zekâ kullanılacaksa gözlem ve yorum sınırı nasıl korunacak?

### Hikâye ve geri bildirim

- Elif Teyze’nin ayrışan rolü ne olacak?
- Hangi konuşmalar oyuncuya anlamlı bir eylem fırsatı sunacak?
- Arkadaşların geri bildirimleri hangi önerileri değiştirecek?

Bu maddeler uygulanacak kesin görev listesi değildir; karar verilmesi gereken alanlardır.

---

# 8. Aynı klasördeki önceki kısa notla ilişki

Mevcut `v2-sonrasi-tasarim-notlari.md` dosyası değiştirilmedi. Bu belge, o kısa notun üzerine yazılmak yerine konuşmanın kapsamlı kaydı olarak ayrı oluşturuldu.

İki metin birlikte okunurken şu farklar korunmalı:

## 8.1 İkinci turun sınırı

Önceki kısa notta kalan bütçe veya sınırlı sayıda kart değişimiyle ikinci tur öneriliyor. Bu konuşmada ise kullanıcının alternatif kararları karşılaştırma hedefi için aynı başlangıç koşullarından yeniden deneme daha uygun bulundu.

Bunlar farklı tasarım seçenekleridir; biri ortak nihai karar gibi sunulmamalı. Yeni bütçe dönemi, sorumluluk alıp düzeltmeyi; alternatif başlangıç ise farklı kararın etkisini karşılaştırmayı öne çıkarır.

## 8.2 Karakterlerin memnuniyeti

Önceki kısa notta her NPC için “iyileşen + kötüleşen” ikili tepki ve kimsenin tam mutlu/mutsuz olmaması önerisi bulunuyor. Bu konuşmada her karara zorunlu olumsuzluk eklememek ve tepkileri gerçek ihtiyaçlardan türetmek özellikle vurgulandı.

Karışık sonuçlar olmalı düşüncesi, herkesin her durumda hem olumlu hem olumsuz cümle söylemesi gerektiği anlamına gelmez.

## 8.3 Öğrenci raporu ve kişilik etiketleri

Önceki kısa notta “kanıt arayan”, “dengeci” gibi davranış profili ifadeleri yer alıyor. Bu konuşmada tek oturumdan genel kişilik/yeterlik etiketi üretmek yerine bağlama bağlı, gözlenebilir davranışı betimlemek önerildi.

Tercih edilen biçim:

> “İkinci planda Aylin’in ölçümünü gerekçesine ekledi.”

Genel etiket yerine somut gözlem, neyin gerçekten görüldüğünü daha açık anlatır.

## 8.4 Yerel kayıt ve kişisel veri

Önceki kısa notta kişisel veri toplamayan, tarayıcıda kalan mimari ifadesi bulunuyor. V2 oturum modelinde oyuncu adı ve avatar alanı da var. Yerel depolama kullanılması tek başına hiç kişisel veri bulunmadığı veya paylaşımın otomatik olarak risksiz olduğu anlamına gelmez.

Sunucu, hesap veya rapor paylaşımı eklenmesi için yalnızca depolama fonksiyonlarının değişmesinin yeterli olduğu varsayılmamalı; erişim, bilgilendirme, veri kapsamı ve paylaşım kararı ayrıca tasarlanmalıdır.

Bu açıklamalar önceki dosyanın değiştirilmesi değil, iki metin arasındaki farkın görünür tutulmasıdır.

---

# 9. Kod incelemesinin kaynak haritası

Aşağıdaki yollar proje kökü olan `etkim apply document 2/` dizinine göredir. Satır numaraları sonraki değişikliklerde kayabileceğinden dosya ve sembol adları esas alınmalıdır.

## 9.1 Ekran görüntüleriyle eşleşen V1

| Dosya | İncelenen konu |
|---|---|
| `website/denge-kasabasi-game/src/data/characterDialogues.ts` | Lina’nın açılışı, ilk görev ve keşif tamamlanma konuşmaları |
| `website/denge-kasabasi-game/src/data/areas.ts` | Beş bölgenin anlatımları ve ipuçları |
| `website/denge-kasabasi-game/src/data/evidenceSources.ts` | Kaynakların ayrıntılı metinleri, grafik türü, sosyal medya iddiası ve çıkarımlar |
| `website/denge-kasabasi-game/src/data/waterCrisisScenario.ts` | Başlangıç durumu, müdahaleler, maliyetler, su etkileri, bir revizyon sınırı ve yeni yağış bilgisi |
| `website/denge-kasabasi-game/src/data/solutions.ts` | Çözümlerin fayda, risk, zaman ve ilgili kanıt açıklamaları |
| `website/denge-kasabasi-game/src/screens/ResearchScreen.tsx` | Altı kaynak tamamlanmadan ilerlemeyi engelleyen arayüz |
| `website/denge-kasabasi-game/src/screens/DecisionScreen.tsx` | Gerekçe ve güven düzeyi |
| `website/denge-kasabasi-game/src/screens/OutcomeScreen.tsx` | Sabit etkilerle sonuç hesabı; ilk ve revize sonuç ayrımı |
| `website/denge-kasabasi-game/src/screens/ReflectionScreen.tsx` | Beklenmeyen sonuç sorusu; planı koruma/değiştirme |
| `website/denge-kasabasi-game/src/screens/SessionSummaryScreen.tsx` | Gözlenebilir süreç göstergeleri ve yorumlama uyarıları |
| `website/denge-kasabasi-game/src/context/sessionReducer.ts` | Plan, güven, sonuç, yeni kanıt, revizyon ve bitiş olayları |

## 9.2 V2

| Dosya / sembol | İncelenen konu |
|---|---|
| `website/denge-game-v2/src/Game/data/npcs.ts` / `NPCS` | Yedi karakter, bölgeleri ve temel konuşmaları |
| `website/denge-game-v2/src/Game/data/story.ts` / `LINA_INTRO_PAGES` | Lina’nın açılış görevlendirmesi |
| Aynı dosya / `INVESTIGATION_CARDS` | Başkan ve dört bölge kartı; ipuçları ve kontrol soruları |
| Aynı dosya / `SOLUTION_CARDS` | Çözümler, maliyet, etki, ihtiyaç bağlantısı ve zaman ufku |
| Aynı dosya / `mayorReactionPages` | Seçilen pakete göre başkanın tepkisi |
| Aynı dosya / `ANNOUNCE_NPC_IDS`, `NOTICE_BOARD` | Duyurulacak dört karakter ve pano |
| Aynı dosya / `npcPlanReaction` | Plan duyurusuna karakter tepkileri |
| Aynı dosya / `LINA_CLOSING_PAGES`, `LINA_CLOSING_CHOICES`, `LINA_CLOSING_FEEDBACK` | Lina’nın mevcut kapanış soruları ve cevapları |
| `website/denge-game-v2/src/Game/data/session.ts` | `QuestStage`, `SubmittedPlan`, `GameSession`, yerel oturum kaydı |
| `website/denge-game-v2/src/components/SolutionPanel.tsx` | Bütçe, ihtiyaç göstergesi ve hazır/serbest gerekçe |
| `website/denge-game-v2/src/Game/scenes/GameScene.ts` | Görev geçişleri, plan duyurusu, pano ve `done` kapanışı |
| `website/denge-game-v2/src/App.tsx` / `submitPlan` | Plan sunulurken istatistik etkilerinin uygulanması |
| `website/denge-game-v2/src/Game/data/intro.ts` | Açılış aşamaları ve Lina tanışma akışının tanımları |

## 9.3 İncelemenin sınırı

Bu tasarım sohbetinde kaynak kod okundu ve kullanıcı ekranları değerlendirildi. Yeni özellik uygulanmadı; test, build veya canlı ön gösterim doğrulaması yapılmadı. Sayısal etkiler, mevcut oyun kuralları olarak okundu; bilimsel olarak doğrulanmış su/ekonomi modelleri olarak kabul edilmedi.

---

# 10. Konuşmanın kaydedilmesi talebi ve son durum

Kullanıcı, konuşmada elde edilenlerin konuşma bölümleri atlanmadan `etkim apply document 2/bilgi-belge-dokumanlar/` klasörüne uygun bir adla kaydedilmesini istedi.

İlk kayıt talebine verilen yanıtta dosyanın henüz kaydedilmediği ve önerilen adın `denge-kasabasi-v2-gelisim-konusmasi-ve-tasarim-notlari.md` olduğu belirtildi. Kullanıcı daha sonra Code/Normal modunda olduğunu bildirdi ve kayıt işlemine geçildi.

Klasörde bulunan `v2-sonrasi-tasarim-notlari.md` önce okundu. İçeriği korunarak bu ayrı belge oluşturuldu.

## Kapsam kontrolü

- [x] Kullanıcının ilk 30 gün, farklı sonuçlar, ikinci şans ve raporlama fikri.
- [x] İlk fikre verilen zaman, nedensellik, memnuniyet, ikinci şans ve final yorumları.
- [x] Öğretmen/veli paylaşımı ve yapay zekâ için dile getirilen sınırlar.
- [x] Kullanıcının dokuz görselle anlattığı V1 akışı ve doğru ekran sırası.
- [x] V1 ekranlarının tek tek işlevleri ve V2 karşılıkları.
- [x] Mevcut koddan doğrulanan özellikler ve henüz olmayan yapılar.
- [x] V1 ve V2 çözüm setlerinin farklılığı.
- [x] Yedi V2 karakterinin tanıtımı, örnek diyalog/görev alanları ve arkadaşlara soru formatı.
- [x] Panodan sonraki sekiz adımlı devam önerisi.
- [x] İlk devam sürümü için önerilen sınırlı kapsam.
- [x] Kesinleşmemiş kararlar ve önceki kısa nottan ayrılan öneriler.
- [x] Kaynak dosyaları ve incelemenin sınırları.

**Sonuç:** V1’in düşünme döngüsü korunarak V2’de kararların zaman içinde kasabada yaşanması, araştırılması ve karşılaştırılması önerildi. Arkadaşların geri bildirimleri alınmadan bu öneriler kesin uygulama kararı sayılmamalıdır.
