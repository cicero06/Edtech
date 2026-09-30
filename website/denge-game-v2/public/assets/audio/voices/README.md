# Karakter Ses Dosyaları

Diyaloglar sayfa başına bir MP3 kaydı kullanır. Kayıtlar bir kez, doğal hızında
(`playbackRate = 1`) çalar; döngüye alınmaz.

## Lina giriş kayıtları

Ses: ElevenLabs — Sunny / Bubbly, Children Narrator.

| Dosya | Diyalog sayfası |
| --- | --- |
| `lina-intro-01.mp3` | Son birkaç haftadır… / …yeterince sulanamıyor. |
| `lina-intro-02.mp3` | Belediye, suyu nasıl… / …farklı bir sonuç oluşturabilir. |
| `lina-intro-03.mp3` | Belediye başkanı senden… / …belediye binasının önünde bekliyor! |

`DialoguePayload.voiceFiles` dizisinin 0. elemanı `text`, sonraki elemanları
`pages` ile aynı sıradadır. Dosya isimleri bu klasöre göredir. Kaydı olmayan
sayfa için `null` kullanılabilir; `voiceFiles` yoksa ses dosyası istenmez.
Metin değişirse ilgili kaydın da güncellenmesi gerekir.

Eşleme kuralları `src/Game/data/voices.ts` içindedir. Dosya adı kalıbı:
`<npcId>-<vuruş>-<varyant>.mp3`

## Diğer diyaloglar (üretim sırası)

| Dosya | Kim / ne zaman |
| --- | --- |
| `lina-report.mp3` | Lina — dört bölge bitince defter çağrısı |
| `lina-closing-01.mp3`, `lina-closing-02.mp3` | Lina — duyuru turu bitince kapanış |
| `lina-expect-01.mp3`, `lina-expect-02.mp3` | Lina — 30 günlük beklenti sorusu |
| `lina-mid.mp3` | Lina — ay ortası "çalışmalar sürüyor" |
| `lina-twist-<çözüm>.mp3` | Lina — ay ortası komplikasyonu (`repair-pipes`, `drip-irrigation`, `saving-campaign`, `rain-harvest`, `fountains-off`) |
| `lina-implement-end-01.mp3`, `lina-implement-end-02.mp3` | Lina — 30. gün inceleme çağrısı |
| `lina-retry-01.mp3`, `lina-retry-02.mp3` | Lina — alternatif plan teklifi |
| `lina-compare-same.mp3` | Lina — aynı plan ikinci kez seçilirse |
| `lina-compare-tail.mp3` | Lina — karşılaştırma konuşmasının sabit son cümlesi |
| `<npcId>-talk.mp3` | Her karakterin serbest sohbet cümlesi (npcs.ts `dialogue.text`) |
| `<npcId>-announce-<varyant>.mp3` | Plan duyurusu tepkisi — varyant: `rain`, `drip`, `repair`, `saving`, `fountains`, `default` |
| `<npcId>-review-<varyant>.mp3` | 30. gün sonuç cümlesi — aynı varyantlar |
| `mayor-react-<çözüm>.mp3` | Başkan — seçilen her önlem için bir cümle |
| `mayor-react-gap-<ev|tarim|park kombinasyonu>.mp3` | Başkan — eksik kalan ihtiyaçlar (7 olası kombinasyon) |
| `mayor-react-close.mp3` | Başkan — tepkinin sabit kapanış cümlesi |
| `mayor-debrief-01.mp3`, `mayor-debrief-02.mp3` | Başkan — rapor isteme konuşması |
| `mayor-followup.mp3` | Başkan — rapor sonrası takip sorusu |
| `mayor-finale-01.mp3`, `mayor-finale-02.mp3` | Başkan — final değerlendirmesi |
| `mayor-finale-alt.mp3` | Başkan — final orta sayfası (yalnız alternatif plan denendiyse) |

`<npcId>` değerleri: `lina`, `mayor`, `elif-teyze`, `muhendis-aylin`,
`ciftci-riza`, `nuri-amca`, `isci-kemal`.

Yazı akışını tamamlamak veya yazının kendiliğinden bitmesi kaydı kesmez.
Sonraki sayfaya geçmek, seçim yapmak ya da konuşmayı kapatmak eski kaydı
durdurur. Ses kapatıldığında kayıt sessiz devam eder; aynı sayfada ses tekrar
açılırsa o anki konumundan duyulur. Ses bitince sayfa otomatik ilerlemez.
Eksik/oynatılamayan kayıt oyunu engellemez; metinle devam edilir.

Yeni kayıtlar için aynı karakterde aynı ses/model ayarlarını kullanın ve her
diyalog sayfasını ayrı MP3 olarak dışa aktarın. Duygu etiketleri yalnızca
ses üretim aracına verilir, oyundaki metne eklenmez. Yayın öncesinde kayıtların
üretildiği planın kullanım lisansını doğrulayın.
