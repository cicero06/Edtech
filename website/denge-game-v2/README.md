# Denge Kasabası

Türkçe, eğitim amaçlı 2D "serious game". Kasaba bir **su krizi** ile karşı karşıya;
oyuncu kasabayı gezerek bilgi toplar, kararlar verir ve bu kararların
**çevre / ekonomi / toplum / su** dengesi üzerindeki sonuçlarını görür.

> **Durum:** PNG tabanlı oynanabilir dünya temeli hazır. Senaryo, görev ve kanıt
> sistemleri henüz yok. Ayrıntılar için aşağıdaki *Uygulama durumu* bölümüne bakın.

---

## Teknoloji

| Katman | Teknoloji |
| --- | --- |
| UI | React 19 + TypeScript |
| Oyun dünyası | Phaser **4.2.1** (Arcade Physics) |
| Build | Vite 8 |
| Lint | oxlint (ESLint **değil**) |

> Phaser 4 kullanıyoruz. Phaser 3 örnekleri birebir çalışmayabilir; API'leri
> `node_modules/phaser/types/phaser.d.ts` üzerinden doğrulayın.

## Çalıştırma

```bash
npm install
npm run dev          # http://localhost:5173
```

| Komut | Açıklama |
| --- | --- |
| `npm run dev` | Geliştirme sunucusu (HMR) |
| `npm run build` | `tsc -b && vite build` → `dist/` |
| `npm run preview` | Production build'i sunar |
| `npm run lint` | oxlint |
| `node --test tools/intro.test.mjs` | Başlangıç sırası ve video dosyası kontrolleri (Node 24) |
| `node tools/slice-assets.mjs` | Pixel-art atlastan eski PNG'leri yeniden üretir |
| `node tools/slice-allassets.mjs` | `allassets.png`'den illüstratif PNG'leri + karakter strip'lerini üretir |

## Başlangıç akışı

Bulutlu görüntü üzerinde **Başla** → kasabaya yaklaşma → aynı kasaba arka planında
videodaki Lina'nın sesli tanıtımı → **Kasabaya geç** → mevcut oyun.
`src/Game/data/intro.ts` açılış videosunu, işlenmiş Lina videosunu, görselleri ve geçiş sırasını tanımlar.
React `IntroSequence` kasaba görüntüsünü korur; Lina'nın eski arka planına kesme yapmaz.
Phaser ve HUD yalnızca **Kasabaya geç** seçildiğinde oluşturulur.

`intro-clouds.jpg` ve `intro-town.jpg`, kasaba videosunun 0 ve 9.96 saniyelerinden
alınmış karelerdir. Başlangıçta bulutlar sabittir; düğmeye basınca video oynar.
Video erken geçilse veya yüklenemese bile Lina'nın arkasında son kasaba karesi kalır.
Lina, sahibinin sağladığı tanıtım videosundan yerel Apple Vision ile ayrılmıştır.
`lina-masked.mp4` H.264 dosyasında solda orijinal RGB, sağda gri alfa maskesi
bulunur; orijinal AAC ses yeniden kodlanmadan korunur. `MaskedVideo` WebGL ile
maskeyi şeffaflığa çevirir; ML modeli tarayıcıda çalışmaz. Yükleme sırasında
`lina-poster.png` gösterilir. Konuşma, mimikler ve el hareketleri kaynak videodandır;
yeni replik veya yürüyüş üretilmez. CSS girişi yalnızca yumuşak görünmedir.
`prefers-reduced-motion` etkinse bu görünme animasyonu kaldırılır.

Ses aç/kapat, duraklat/devam et ve **Videoyu geç** kontrolleri bulunur.
Oynatma engellenirse oynat düğmesi; yükleme hatasında yeniden deneme ve geçme
seçenekleri gösterilir. Sayfa yenilendiğinde başlangıç tekrar görünür.
Plaza, mevcut NPC diyalogları ve senaryo ilerlemesi değiştirilmemiştir.
Orijinal Lina videosu korunur; oyunda yalnızca işlenmiş kopya kullanılır.
Diğer baraj/geçiş videoları henüz bağlı değildir. Lina'nın tanıtımı bitince
**Tekrar dinle** kullanılabilir; oyuna geçiş yine kullanıcı kontrolündedir.
WebGL yoksa veya bağlam kaybolursa poster ve açıklama gösterilir, ses durdurulur
ve **Kasabaya geç** kullanılabilir.

Lina varlığını yeniden üretme (macOS 14+, Xcode Command Line Tools; dosyalar yerel işlenir):

```bash
xcrun swift tools/prepare-lina.swift "public/assets/videos/Lina_introducing_Denge_Kasabası_20260927012353.mp4" /tmp/lina-silent.mp4 /tmp/lina-poster.png
xcrun swift tools/mux-lina-audio.swift /tmp/lina-silent.mp4 "public/assets/videos/Lina_introducing_Denge_Kasabası_20260927012353.mp4" public/assets/videos/lina-masked.mp4
```

İlk adım maskelemeyi yapar ve sessiz video + şeffaf poster üretir; ikinci adım
orijinal AAC sesi yeniden kodlamadan ekler. İki aşamalı tasarım bilinçlidir:
AVAssetWriter'a tek iş parçacığından eş zamanlı ses+video beslemek kuyruk
kilitlenmesine yol açar; sessiz geçiş + passthrough ses güvenilir çalışır.
Araçlar mevcut çıktının üzerine yazmaz; yeni çıktı yolları kullanın. Üretilen
videodaki sağ yarı oyun içi görüntü değil, şeffaflık maskesidir. Dağıtıma
geçmeden önce saç/el kenarları ve kareler arası maske tutarlılığı kontrol edilmelidir.

## Kontroller

| Tuş | İşlev |
| --- | --- |
| `WASD` / Yön tuşları | Hareket (çapraz hareket normalize, zıt tuşlar birbirini iptal eder) |
| `E` | NPC'nin yanındayken konuş |
| `` ` `` (backtick) | Çarpışma kutularını göster/gizle (debug) |

---

## React / Phaser sorumluluk paylaşımı

```
React  ->  HUD, diyalog kartı, karar butonları, istatistikler
Phaser ->  dünya, oyuncu, kamera, NPC, çarpışma, etkileşim algılama
```

İki taraf **yalnızca** tipli EventBus üzerinden haberleşir. Hiçbir yerde ham
event-adı string'i yazılmaz.

| Event | Yön | Payload |
| --- | --- | --- |
| `open-dialogue` | Phaser → React | `{ npcId, name, text, choices[] }` |
| `dialogue-closed` | React → Phaser | — |
| `dialogue-choice` | React → Phaser | `choiceId: string` |
| `district-changed` | Phaser → React | `{ id, label }` |

Kaynak: `src/Game/events/gameEvents.ts` (adlar + payload tipleri),
`src/Game/events/EventBus.ts` (tipli sarmalayıcı).

### Başlangıç akışı

```
index.html
 └─ src/main.tsx                    React root (StrictMode)
     └─ src/App.tsx                 HUD + diyalog UI + istatistikler
         └─ src/components/PhaserGame.tsx   tek Phaser.Game örneği
             └─ src/Game/config.ts          createGameConfig(parent)
                 └─ src/Game/scenes/GameScene.ts
```

`PhaserGame.tsx` teardown'ı bir `setTimeout(0)` ile geciktirir. StrictMode'un
çift effect çağrısı aynı task içinde olduğu için remount bekleyen teardown'ı
iptal eder → **sayfa başına tek Phaser.Game**. StrictMode kapatılmadı.

---

## PNG dünya mimarisi

Tilemap/tileset **yok**. Dünya bireysel PNG'lerden, veri ile kuruluyor.

```
GameScene  yalnızca  src/Game/data/  içindeki dizileri okur ve sprite'a çevirir.
Bina taşımak = veriyi düzenlemek. Sahne dosyasına dokunulmaz.
```

| Dosya | İçerik |
| --- | --- |
| `src/Game/data/assets.ts` | Yüklenen her texture, native boyutları, oyuncu animasyon frame aralıkları |
| `src/Game/data/districts.ts` | Dünya boyutu, 5 bölge dikdörtgeni, `districtAt()`, oyuncu spawn'ı |
| `src/Game/data/worldObjects.ts` | Zemin katmanları, binalar, doğa, tarım, prop'lar, çarpışma kutuları |
| `src/Game/data/npcs.ts` | NPC tanımları + diyalog metni |
| `src/Game/data/stats.ts` | 4 istatistik, başlangıç değerleri, karar etkileri |

### Çizim sırası

```
zemin katmanları (çim / su / yollar)   depth -1000 .. -800
düz zemin dekalları (toprak, ekin)     depth  -800
Y-sıralı nesneler + oyuncu + NPC       depth = y
UI metni (ipucu, toast)                depth 1_000_000
```

Y-sıralı her sprite `origin (0.5, 1)` ile çizilir; yani `y` nesnenin **taban
çizgisi**dir. Bu sayede `depth = y` doğrudan çalışır ve oyuncu ağaçların /
binaların önüne ve **arkasına** geçebilir.

### Dünya yerleşimi — 1920 × 1440

```
                    REZERVUAR / BARAJ            (kuzey)
                            |
        TARIM --------- MERKEZ PARK --------- KONUT
        (batı)              |                 (doğu)
                            |
                        BELEDİYE               (güney)
```

Merkez park ana navigasyon merkezi; iki ana yol parkta kesişiyor.
Beş bölge dünyayı boşluksuz ve çakışmasız böler, dolayısıyla her konum tam
olarak bir bölgeye düşer.

- Oyuncu spawn: `(960, 940)` — parkın güney yolunda
- Kamera: oyuncuyu takip, `zoom = 2`, sınırlar dünya boyutu
- Fizik sınırları içe girintili, böylece sprite dünya dışına taşmaz

### Çarpışma

Arcade Physics yalnızca AABB destekler — **poligon yok**. Her engel, nesnenin
ayağına yerleştirilen görünmez bir statik dikdörtgendir; hepsi tek bir
`staticGroup` içinde ve oyuncuyla tek bir `collider` ile bağlı.

- Oyuncu gövdesi tüm kare değil, **ayak kutusu**: 41×91 kare, `scale 0.53` altında
  `setSize(26, 17)` + `setOffset(7, 70)` (kaynak px; dünya biriminde ~14×9)
- Rezervuar suyu, baraj duvarı ve çitli tarla içleri ayrı çarpışma bölgeleri
  (`COLLISION_ZONES`) — suya ve çitin içine girilemez
- `` ` `` tuşu hem Arcade body çizimini hem kendi footprint dikdörtgenlerimizi açar

### Render ayarı: hibrit (`pixelArt: true` + texture bazlı LINEAR)

Dünya artık **iki sanat tarzı** içeriyor: zemin/çim tile'ları pixel art, bina,
doğa, prop ve karakterler illüstratif (`allassets.png`). `pixelArt: true` tüm
texture'lara NEAREST uygular; `GameScene.applyTextureFilters()` manifestte
`smooth: true` işaretli her texture'a `Texture.setFilter(LINEAR)` çağırır.
Böylece pixel zemin crisp kalırken ~2x küçültülen illüstratif görseller
yumuşak örneklenir. Yeni smooth asset eklerken manifestte `smooth: true`
işaretlemeyi unutma.

---

## Asset yapısı

```
public/assets/
  characters/     oyuncu + 7 NPC (1x4 strip'ler), yenikarakterler.png kaynağı + eski pixel sheet'ler
  buildings/      belediye  house-red  farmhouse  apartment  shop  mansion (+ eski pixel set)
  nature/         tree-round/round-2/blossom/pine/cypress  bush'lar  hedge-row  rocks  grass-patch
  agriculture/    field-wheat  field-veg  greenhouse  windmill  haystack-big (+ eski set)
  water/          water-deep  dam-structure  treatment-plant (+ eski set)
  ground/         grass-tile-1..3  path-tile  road-straight  road-dash
  props/          fountain  bench  street-lamp  sign  planter  trash-can  arabalar  tractor  crate  dock
  maps/legacy-tiled/   ESKİ Tiled dosyaları — sadece referans, kod yüklemiyor
  reference/      town-atlas.png + allassets.png + town-hall-source.png + mansion-source.png + ATTRIBUTION.md
```

İki kaynak sheet var: eski pixel-art `town-atlas.png` (`tools/slice-assets.mjs`,
artık yalnızca zemin tile'ları kullanılıyor) ve illüstratif `allassets.png`
(`tools/slice-allassets.mjs` — 60 adadan 40+ görsel + 4 karakter strip'i).
Aynı araç `characters/yenikarakterler.png` kaynağından 4 yeni NPC strip'i üretir.
Hiçbir kaynak sheet çalışma zamanında yüklenmiyor.

### Karakter sheet'leri hakkında

- `player-boy.png` — 4 karelik strip `[aşağı, sağ, yukarı, sol]`, 41×91 hücre.
  Yönler pixel analiziyle doğrulandı; sol poz orijinal çizim (mirror değil).
- `lina.png` — aynı düzen, 44×86. `mayor.png` — 47×105, sol poz sağın aynası
  (sheet'te sol çizilmemiş). `woman.png` — 46×96, yukarı için ön tekrarlanıyor.
- `muhendis-aylin.png`, `ciftci-riza.png`, `nuri-amca.png`, `isci-kemal.png` —
  `[aşağı, sağ, yukarı, sol]` düzeni; sol poz sağın aynasıdır.
- Yürüme animasyonu **yok**: tek karelik "animasyonlar" oynatılır ve sahne
  hareket halinde küçük bir sallantı tween'i (angle ±3°) uygular.
- `npc-01.png` / `npc-02.png` — eski 3×4 pixel sheet'ler, fallback olarak
  yüklü ama dünyada kullanılmıyor.

### Legacy Tiled durumu

Tiled ile dünya kurmayı **bıraktık**. Eski dosyalar silinmedi:

| Dosya | Not |
| --- | --- |
| `assets/maps/legacy-tiled/denge-kasabasi.json` | Gömülü tileset'li harita; kod artık yüklemiyor |
| `assets/maps/legacy-tiled/DengeTown.tsj.json` | Yukarıdakinin birebir kopyası (aynı SHA-256) |
| `assets/maps/legacy-tiled/adsız.tmj` | Harici tileset referanslı; Phaser çözemez |
| `assets/maps/legacy-tiled/denge-kasabasi.tmj` | Tek boş katman |
| `assets/maps/legacy-tiled/town_tileset.png` | **Alfa kanalı yok** — eski render hatasının kaynağı |
| `assets/maps/legacy-tiled/town-tileset.png.png` | Yukarıdakinin birebir kopyası |

Aktif kodda `tilemapTiledJSON`, `addTilesetImage`, `createLayer` **yok**.

---

## Uygulama durumu

**Çalışıyor:** React boot · tek Phaser örneği · PNG dünya render · 5 bölge ·
illüstratif bina/doğa/prop seti (belediye, evler, çeşme, sera, baraj, arıtma,
yel değirmeni, market, apartman, köşk, arabalar, traktör…) · asfalt+kaldırım
caddeler · oyuncu (yeni smooth sprite, 4 yön + sallantı) · WASD/yön tuşları ·
kamera takibi · dünya sınırları · statik çarpışma + ayak kutusu · Y-tabanlı
derinlik · **7 NPC** (Elif Teyze / Lina / Belediye Başkanı / Mühendis Aylin /
Çiftçi Rıza / Nuri Amca / Belediye Çalışanı Kemal) · yakınlık ipucu ·
`E` etkileşimi · React diyalog · karar → istatistik · diyalog kapanışı →
kontrol geri · `district-changed` HUD göstergesi · çarpışma debug toggle

**Henüz yok:** görev sistemi · kanıt/bilgi kartları · senaryo ilerlemesi ·
kazanma/kaybetme · NPC yürüme animasyonu (sallantı var) · ses · kayıt/yükleme ·
backend · kapsamlı oyun testleri

### Hedeflenen (henüz kurulmamış) oynanış döngüsü

```
KEŞFET → KANIT TOPLA → BİLGİYİ KARŞILAŞTIR → PLAN YAP
       → PLANI SAVUN → SONUÇLARI GÖR → YENİ KANIT → YENİDEN DEĞERLENDİR → YANSIT
```

Kod bu sistemler eklenirken dünyanın yeniden yazılmasını gerektirmeyecek
şekilde ayrıldı: bölgeler, NPC'ler, diyaloglar ve istatistikler zaten veri.

---

## Bilinen konular / teknik borç

- **Sürüm kontrolü yok.** Repo `git init` edilmemiş durumda; yedek yok.
- `src/Game/legacy/*.bak` — eski iki sahne ve tipsiz EventBus, referans olarak
  arşivlendi. Derlemeye girmezler (`.bak` uzantısı). PNG dünyasından memnun
  kalınca silinebilirler.
- `src/App.css` — Vite şablonundan kalan **ölü** dosya, hiçbir yerden import
  edilmiyor.
- Eski pixel-art assetler (ev, ağaç, çit, ekin, `npc-01/02`, `wall-panel`…)
  manifestte **fallback** olarak duruyor; dünyada yerleşik değiller.
- `woman.png` strip'inin gerçek "yukarı" pozu yok (ön tekrarlanıyor);
  `mayor.png`'nin sol pozu sağın aynası. Statik NPC'ler için sorunsuz.
- `water-deep` tile'ının dikişleri hafif belli oluyor — kasıtlı kabul;
  istersen `worldObjects.ts`'de `WATER` anahtarına dönebilirsin.
- Asset lisansları doğrulanmadı — `public/assets/reference/ATTRIBUTION.md`.
  `allassets.png` proje sahibinden geldi (generated art).
