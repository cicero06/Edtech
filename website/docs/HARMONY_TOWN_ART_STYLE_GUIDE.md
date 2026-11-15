# HARMONY TOWN (DENGE KASABASI) — ART STYLE GUIDE & VISUAL IDENTITY
**Doküman Kodu:** `DOC-HT-STYLE-002`  
**Sürüm:** 1.0.0  
**Tarih:** 12 Ekim 2026  
**Hedef Platform:** Mobil (iOS & Android) + Web Entegrasyonu  

---

## 1. SANAT YÖNETİMİ VİZYONU & FELSEFESİ

Harmony Town'un görsel dili, **"Illustrated Cozy Town Adventure" (Çizgisel / Sıcak Kasaba Macerası)** stilindedir. 

Bu tarzın felsefesi:
- **Sıcak ve Güven Verici:** Didaktik bir ders hissi yerine, merak uyandıran, keşfetmesi keyifli, organik ve canlı bir kasaba hissi.
- **Eğitsel & Net:** Karmaşık su ve bütçe verilerini çocukların gözünü korkutmadan, temiz renk kodları ve ikonlarla basitçe sunan bir berraklık.
- **Web ve Mobil Tutarlılığı:** Web portalında (`Atlas Learning`) ve mobil uygulamada kullanılan kurumsal renklerin Unity mobil oyun sahnesinde de aynı tonda ve duyguda hissedilmesi.

---

## 2. EVRENSEL RENK PALETİ (CROSS-PLATFORM COLOR TOKENS)

Web sitesi (`website/src/styles.css`), React Native mobil arayüzü (`mobile/src/theme/colors.ts`) ve Unity oyun motoru arasında %100 mutabakat sağlayan renk değerleri:

### 2.1. Temel Marka ve Doğa Renkleri (Brand & Nature)
| Renk İsmi | Hex Kodu | Unity RGB (`Color`) | Kullanım Alanı |
|---|---|---|---|
| **Green Main (Orman Yeşili)** | `#0a4f48` | `(0.039f, 0.310f, 0.282f, 1f)` | Birincil butonlar, ana başlık kartları, marka vurgusu |
| **Green Deep (Derin Zümrüt)**| `#0b3c35` | `(0.043f, 0.235f, 0.208f, 1f)` | Üst HUD tabanı, modal başlık barları |
| **Green Soft (Yumuşak Mint)** | `#e6f7f5` | `(0.902f, 0.969f, 0.961f, 1f)` | Seçili kart zeminleri, başarı bildirim arka planları |
| **Teal (Kasaba Mavisi)** | `#008779` | `(0.000f, 0.529f, 0.475f, 1f)` | Suyla ilgili pozitif eylemler, onay pilleri |
| **Sky Blue (Gökyüzü & Su)** | `#0284c7` | `(0.008f, 0.518f, 0.780f, 1f)` | Baraj, gölet, boru akış hatları, bilgi butonları |
| **Amber Gold (Sıcak Sarı)** | `#f59e0b` | `(0.961f, 0.620f, 0.043f, 1f)` | Bütçe sayaçları, rozetler, görev hedef belirteçleri |
| **Terracotta (Toprak)** | `#c16c39` | `(0.757f, 0.424f, 0.224f, 1f)` | Tarım vadisi, Çiftçi Rıza teması, harita yolları |

### 2.2. Arayüz ve Zemin Tonları (Surfaces & Canvas)
| Renk İsmi | Hex Kodu | Unity RGB (`Color`) | Kullanım Alanı |
|---|---|---|---|
| **Cream Light (Organik Krem)**| `#fbfbf7` | `(0.984f, 0.984f, 0.969f, 1f)` | Gündüz diyalog kartları, defter sayfaları, bilgi kartları |
| **Line Border (Çerçeve)** | `#dfe9d9` | `(0.875f, 0.914f, 0.851f, 1f)` | Panel sınır çizgileri, ayırıcı hatlar (1.5 - 2px) |
| **Dark Backdrop (Karartma)** | `#081018` | `(0.031f, 0.063f, 0.094f, 0.88f)`| Sinematik arka plan karartması (Scrim) |
| **Dark Modal Card (Gece Kartı)**| `#0c1824`| `(0.047f, 0.094f, 0.141f, 0.96f)`| Teknik kontrol odaları, Aylin ve Nuri atölye panoları |
| **Text Primary (Ana Metin)** | `#1e293b` | `(0.118f, 0.161f, 0.231f, 1f)` | Krem paneller üzerindeki koyu başlık ve gövde yazısı |
| **Text Inverted (Açık Metin)** | `#ffffff` | `(1.000f, 1.000f, 1.000f, 1f)` | Koyu kartlar ve butonlar üzerindeki net beyaz yazı |
| **Text Muted (Soluk Metin)** | `#58665d` | `(0.345f, 0.400f, 0.365f, 1f)` | İkincil açıklamalar, tarih ve saat etiketleri |

### 2.3. Durum & Geri Bildirim Renkleri (Status Badges)
- **Başarı (Success Green):** `#22c55e` `(0.133f, 0.773f, 0.369f, 1f)` — Su kaçağı giderildiğinde, görev tamamlandığında.
- **Kritik / Tehlike (Critical Red):** `#ef4444` `(0.937f, 0.267f, 0.267f, 1f)` — Baraj seviyesi kritik (%38), boru patlağı, yetersiz bütçe.
- **Uyarı (Warning Amber):** `#f59e0b` `(0.961f, 0.620f, 0.043f, 1f)` — Dikkat gerektiren vanalar, zaman azaldığında.

---

## 3. TİPOGRAFİ STANDARTLARI (TYPOGRAPHY HIERARCHY)

Web ve mobil ekosisteminde kullanılan **Plus Jakarta Sans** (gövde ve UI) ile **Sora** (başlıklar) yazı tipleri, oyunun eğitsel kimliğinin ayrılmaz parçasıdır.

Mobil ekranda ($1920 \times 1080$ referans ölçekleme bazında) uygulanacak hiyerarşi:

```
H1 / Modal Ana Başlığı  ─── 24-26 pt (Sora / Bold)        ─── "KASABA KARAR MASASI"
H2 / Bölge & Görev Adı  ─── 18-20 pt (Sora / SemiBold)    ─── "Çınar Caddesi Boru Onarımı"
H3 / Karakter İsmi      ─── 16-17 pt (PJS / Bold)         ─── "Mühendis Aylin"
Gövde Metni (Diyalog)   ─── 15-16 pt (PJS / Regular-Medium) ── "Barajdaki su debisi hızla düşüyor..."
Buton Metinleri         ─── 14-15 pt (PJS / Bold)         ─── "ONARIMA BAŞLA ➔"
Etiket / Tag / Rozet    ─── 11-12 pt (PJS / Bold Uppercase) ── "BÖLGE 1 • BARAJ"
```

> **Önemli Kural:** Mobil ekranlarda **12 pt altındaki hiçbir metin kullanılmayacaktır**. Eski kodda yer alan 9pt ve 10pt yazılar minimum 12-14 pt standardına çekilecektir.

---

## 4. UI BİLEŞEN TASARIM STANDARTLARI

### 4.1. Butonlar (Buttons & Touch Targets)
1. **Birincil Eylem Butonu (Primary Button):**
   - **Arka Plan:** `GreenMain` (`#0a4f48`) veya gradient (`#0a4f48` -> `#008779`).
   - **Metin:** Beyaz (`#ffffff`), 15 pt Bold.
   - **Kenarlık:** 1.5 px `Teal` (`#008779`).
   - **Köşe Yuvarlama:** 8-10 px.
   - **Minimum Dokunma Alanı:** Yükseklik 48 px, Genişlik minimum 120 px.
2. **İkincil Buton (Secondary Button):**
   - **Arka Plan:** `CreamLight` (`#fbfbf7`) veya yarı saydam beyaz (`rgba(255, 255, 255, 0.1)`).
   - **Metin:** `GreenDeep` (`#0b3c35`) veya Beyaz.
   - **Kenarlık:** 1.5 px `Line Border` (`#dfe9d9`).
   - **Minimum Dokunma Alanı:** 44 x 44 px.
3. **İkon Butonları (Hızlı Erişim):**
   - Ayarlar (⚙️), Harita (🗺️), Defter (📒), Kapat (✕).
   - Minimum dokunma kutusu (hit-box): $48 \times 48$ piksel.

### 4.2. Diyalog Pencereleri (Dialogue Boxes)
- **Gündüz / Açık Tema Standardı:**
  - Zemin: `%98` opaklıkta `CreamLight` (`#fbfbf7`).
  - Çerçeve: 2 px `Line Border` (`#dfe9d9`), üstte 1 px yumuşak ışık konturu.
  - Sol Tarafta Avatar Halkası: $90 \times 90$ px dairesel portre, altında renkli isim rozeti (`Name Pill`).
  - Sağ Tarafta Dinamik Eylem Kartı: 220 px genişliğinde, görev hedefi ve "Tamam / İleri" aksiyonu.
- **İleri Butonu (Advance Arrow):**
  - Minimum boyut $48 \times 48$ px dairesel buton, içinde beyaz sağ ok simgesi (➔).

### 4.3. HUD Göstergeleri (Top Status Bar)
- Ekranın en üstünde, çentik güvenli bölgesinin hemen altında yer alır.
- **Metrik Kapsülleri (Pills):**
  - Bütçe: Altın sarısı ikon (💰) + Kalan Bakiye (`₺720.000`).
  - Su Seviyesi: Su damlası (💧) + Çubuk Gösterge (`%38`).
  - Memnuniyet: Gülen yüz (😊) + Yüzde (`%55`).
- Her kapsülün zemini hafif koyu saydam (`rgba(11, 60, 53, 0.85)`), yazılar beyaz ve kontrastlıdır.

---

## 5. KARAKTER VE ÇEVRE GÖRSEL ORANTILARI

### 5.1. Karakter Ölçekleme Standardı
- **Dünya İçi Sprite'lar (In-Game Walkers):**
  - Tüm karakterler (Lina, Oyuncu, Kasabalılar) **32 PPU** standardına sadık kalmalıdır.
  - Yetişkin insan boyu ortalama 48-52 piksel boyunda, Lina ise 44-46 piksel boyunda çizilmiştir.
  - Başı gövdesine göre hafifçe büyük (chibi-stylized orantı), yüz ifadeleri ve gözleri küçük ekranda dahi okunabilir olmalıdır.
- **Diyalog Portreleri (Portraits):**
  - $128 \times 128$ veya $256 \times 256$ kare kesim, göğüsten yukarı portre çizimi.
- **Tam Boy Diyalog İllüstrasyonları (Standing Characters):**
  - 16:9 sinematik sahnede sol tarafa yerleşir, sahne yüksekliğinin yaklaşık %85'ini kaplar.

### 5.2. Çevre ve Nesne Okunabilirliği
- Ağaçlar, binalar ve yollar keskin piksel yerine **yumuşak gölgeli, vektörel/çizgisel illustrasyon** hissindedir.
- Etkileşime girilebilir nesneler (örneğin patlak su borusu, park fıskiyesi, vana sandığı) zemin çimenden ayrışması için hafif parlama veya sarı renkli `▼ HEDEF` okuyla vurgulanır.
- Karakterlerin binaların arkasına geçtiğinde kaybolmaması için `YSortOrder` derinliği kesintisiz çalışmalıdır.

---

## 6. ÖZET KURALLAR ÇEKİRDEĞİ (GOLDEN RULES)

1. **Hiçbir Zaman 12 pt Altında Metin Kullanma:** Mobilde okunabilirlik esastır.
2. **Minimum 48 px Dokunma Alanı Sağla:** Küçük butonlar parmakla tıklanamaz.
3. **Web ve Mobil Renk Kodlarından Sapma:** `#0a4f48` ana yeşil, `#008779` ana teal, `#f59e0b` altın sarısıdır. Rastgele RGB değerleri türetilmemelidir.
4. **Çentikten Daima Kaçın:** Üst bar ve köşe butonları `Screen.safeArea` payına saygı duymalıdır.
5. **Klavye İpuçlarını Gizle:** Ekranda "[E]", "[Space]" gibi klavye tuşları yerine dokunmatik simgeler yer almalıdır.
