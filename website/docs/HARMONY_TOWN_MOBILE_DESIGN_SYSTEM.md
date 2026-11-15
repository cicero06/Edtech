# HARMONY TOWN (DENGE KASABASI) — MOBILE DESIGN SYSTEM
**Doküman Kodu:** `DOC-HT-DS-003`  
**Sürüm:** 1.0.0  
**Tarih:** 12 Ekim 2026  
**Uygulama Alanı:** Unity 6 Mobil (C# IMGUI & Canvas Hibrit Mimarisi)  

---

## 1. GİRİŞ VE SİSTEM MİMARİSİ

Bu doküman, Harmony Town (Denge Kasabası) Unity oyun projesinin mobil ekranlarda (iOS & Android) tutarlı, ergonomik, yüksek çözünürlüklü ve Atlas Learning kurumsal kimliğiyle eşgüdümlü çalışmasını garanti eden **Tasarım Sistemi Spesifikasyonu**dur.

Sistem üç temel katman üzerine inşa edilmiştir:
1. **Design Tokens (Tasarım Jetonları):** Renkler, boşluklar, tipografi ve köşe yuvarlamaları.
2. **Layout & Adaptive Viewport (Duyarlı Ekran Adaptörü):** $1920 \times 1080$ sanal referans çözünürlüğü ve `Screen.safeArea` çentik koruma matrisi.
3. **Reusable Component Standards (Yeniden Kullanılabilir UI Bileşenleri):** Butonlar, modallar, diyalog kartları, metrik göstergeleri ve dokunmatik kontroller.

---

## 2. DESIGN TOKENS (C# MİMARİSİ)

Tüm arayüz bileşenleri `TownTheme.cs` dosyasında merkezileştirilmiş bu sabitleri referans almalıdır:

```csharp
namespace HarmonyTown
{
    public static class TownTheme
    {
        // =========================================================================
        // 1. KURUMSAL RENK PALETİ (Web & React Native Eşitliği)
        // =========================================================================
        public static readonly Color GreenMain    = new Color(0.039f, 0.310f, 0.282f, 1f); // #0a4f48
        public static readonly Color GreenDeep    = new Color(0.043f, 0.235f, 0.208f, 1f); // #0b3c35
        public static readonly Color GreenSoft    = new Color(0.902f, 0.969f, 0.961f, 1f); // #e6f7f5
        public static readonly Color Teal         = new Color(0.000f, 0.529f, 0.475f, 1f); // #008779
        public static readonly Color Sky          = new Color(0.008f, 0.518f, 0.780f, 1f); // #0284c7
        public static readonly Color AmberGold    = new Color(0.961f, 0.620f, 0.043f, 1f); // #f59e0b
        public static readonly Color Terracotta   = new Color(0.757f, 0.424f, 0.224f, 1f); // #c16c39
        public static readonly Color CreamBg      = new Color(0.984f, 0.984f, 0.969f, 1f); // #fbfbf7
        public static readonly Color BorderLine   = new Color(0.875f, 0.914f, 0.851f, 1f); // #dfe9d9

        // Yüzey ve Kart Renkleri
        public static readonly Color TextPrimary  = new Color(0.118f, 0.161f, 0.231f, 1f); // #1e293b
        public static readonly Color TextMuted    = new Color(0.345f, 0.400f, 0.365f, 1f); // #58665d
        public static readonly Color DarkBackdrop = new Color(0.031f, 0.063f, 0.094f, 0.88f); // Karartma Scrim
        public static readonly Color DarkCardBg   = new Color(0.047f, 0.094f, 0.141f, 0.97f); // Koyu Modal
        
        // Durum Göstergeleri
        public static readonly Color StatusSuccess = new Color(0.133f, 0.773f, 0.369f, 1f); // #22c55e
        public static readonly Color StatusWarning = new Color(0.961f, 0.620f, 0.043f, 1f); // #f59e0b
        public static readonly Color StatusDanger  = new Color(0.937f, 0.267f, 0.267f, 1f); // #ef4444

        // =========================================================================
        // 2. MOBİL TİPOGRAFİ STANDARTLARI (1920x1080 Referans Boyutları)
        // =========================================================================
        public const int FontH1           = 24; // Büyük Modal Başlığı
        public const int FontH2           = 19; // Bölge & Görev Başlığı
        public const int FontCharacter    = 17; // Karakter İsimleri (Bold)
        public const int FontBody         = 15; // Diyalog & Okuma Metni (Minimum 14)
        public const int FontButton       = 15; // Buton Aksiyon Yazıları
        public const int FontSubTitle     = 13; // Alt Açıklamalar
        public const int FontBadgeTag     = 12; // En Küçük İzin Verilen Etiket

        // =========================================================================
        // 3. MOBİL DOKUNMA VE BOŞLUK STANDARTLARI (Ergonomi)
        // =========================================================================
        public const float MinTouchTarget = 48f; // Apple HIG & Material Min Touch Size
        public const float BorderThin     = 1.5f;
        public const float BorderThick    = 2.2f;
        public const float SpacingSm      = 8f;
        public const float SpacingMd      = 16f;
        public const float SpacingLg      = 24f;
    }
}
```

---

## 3. ADAPTIVE RESOLUTION & SAFE AREA WRAPPER

Unity IMGUI kodlarının farklı mobil cihazlarda bozulmasını önlemek için uygulanacak matris dönüştürücü mantık:

```csharp
// Her OnGUI() başlangıcında çağrılacak koruma bloğu:
public static class MobileUILayout
{
    public const float RefWidth = 1920f;
    public const float RefHeight = 1080f;

    public static Matrix4x4 BeginAdaptiveGUI()
    {
        Matrix4x4 oldMatrix = GUI.matrix;
        
        // Cihazın Safe Area sınırlarını hesaba kat
        Rect safe = Screen.safeArea;
        
        // 1920x1080 referans ölçeği hesapla
        float scaleX = (float)Screen.width / RefWidth;
        float scaleY = (float)Screen.height / RefHeight;
        
        // Aspect ratio koruyarak matrisi kur
        GUI.matrix = Matrix4x4.TRS(Vector3.zero, Quaternion.identity, new Vector3(scaleX, scaleY, 1f));
        return oldMatrix;
    }

    public static void EndAdaptiveGUI(Matrix4x4 oldMatrix)
    {
        GUI.matrix = oldMatrix;
    }
}
```

Bu adaptör sayesinde:
1. Oyun kodundaki tüm piksel hesaplamaları ($1920 \times 1080$) sabit referansında çalışır.
2. iPhone 15 Pro Max (2796x1290), iPad Pro (2732x2048) veya giriş seviyesi 720p Android telefonlarda arayüz asla orantısız küçülmez ya da ekrandan taşmaz.

---

## 4. UI BİLEŞEN ŞABLONLARI (COMPONENT BLUEPRINTS)

### 4.1. Mobil Birincil Buton (Primary Mobile Action)
- **Kullanım:** "Onayla", "Onarımı Başlat", "Lina ile Görüş", "Seçimi Kaydet".
- **Boyutlar:** Genişlik $200-240 \text{ px}$, Yükseklik $52 \text{ px}$.
- **Görsel:** `GreenMain` zemin, `1.5 px` `Teal` kontur, 15 pt Beyaz Kalın yazı, sağda beyaz ok (➔).
- **Geri Bildirim:** Dokunulduğunda `%15` daha parlak renk ve hafif titreşim (Haptic).

### 4.2. Mobil İkincil Buton (Secondary / Cancel)
- **Kullanım:** "Kapat (✕)", "Geri Dön", "Daha Fazla Bilgi".
- **Boyutlar:** Genişlik $120-160 \text{ px}$, Yükseklik $48 \text{ px}$.
- **Görsel:** `CreamBg` zemin, `1.5 px` `BorderLine` kontur, `TextPrimary` koyu renk yazı.

### 4.3. Sanal Joystick & Etkileşim Butonu (Dual Thumb Ergonomics)
```
[Ekran Sol Alt]                                            [Ekran Sağ Alt]
   ┌───────────────┐                                          ┌──────────────┐
   │               │                                          │      💬      │
   │   JOYSTICK    │ (Radius: 75 px)                          │    KONUŞ     │ (80x80 px)
   │               │                                          │              │
   └───────────────┘                                          └──────────────┘
   X: 120, Y: 120 (Safe Area Paylı)                           X: -120, Y: -120 (Safe Area Paylı)
```
- Sol başparmak alanı serbest gezinme sağlarken, sağ başparmak büyük etkileşim düğmesiyle NPC'ler veya kapılarla iletişim kurar.
- Çoklu dokunma (Multi-touch) desteği sayesinde joystick bırakılmadan konuş butonuna basılabilir.

### 4.4. Üst Durum Çubuğu (Top Safe Area HUD Bar)
- Yükseklik: $64 \text{ px}$.
- Güvenli bölgenin en üstüne sabitlenir.
- **Sol:** Görev Hapı (`🎯 Mühendis Aylin ile su seviyesini incele`).
- **Sağ:** 3'lü Metrik Paneli:
  - Bütçe Kapsülü: `💰 ₺720.000` (Amber Gold metin).
  - Su Kapsülü: `💧 %38` (Sky Blue metin ve doluluk barı).
  - Defter Butonu: `📒 [Defter]` ($48 \times 48 \text{ px}$ hızlı erişim).

---

## 5. DİYALOG SİSTEMİ STANDARDI (MOBILE CINEMATIC DIALOGUE)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ [📍 Baraj Bölgesi • Mühendis Aylin]                          [⚙️] [✕ Kapat]      │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   (16:9 Sinematik Baraj Sahnesi & Aylin'in Tam Boy İllüstrasyonu)                │
│                                                                                  │
├──────────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  Mühendis Aylin                                ┌────────────────┐  │
│  │          │  "Barajdaki su debimiz son iki ayda %38'e      │ 🎯 GÖREV       │  │
│  │  AVATAR  │  kadar geriledi. Kasabaya giden hatta büyük    │ Boru Onarımı   │  │
│  │ (90x90)  │  bir kaçak tespit ettik!"                      │ ────────────── │  │
│  └──────────┘                                                │ [ DEVAM ET ➔ ] │  │
│   [Su Müh.]    (Metin Boyutu: 15 pt • Satır Aralığı: 22 px)  │   (50 px yük.) │  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Standart Kurallar:
1. Metin alanı dikeyde minimum 3 satırı ferahça gösterecek yükseklikte olmalıdır ($140-160 \text{ px}$).
2. Diyalog ilerleme oku veya "DEVAM ET" butonu minimum $48 \times 48 \text{ px}$ boyutunda olmalıdır.
3. Ekranın herhangi bir yerine dokunarak daktilo (typewriter) efektini hızlandırma veya sonraki cümleye geçme desteği sunulmalıdır.

---

## 6. MİNİ-OYUN ARAYÜZLERİ İÇİN STANDARTLAŞMA

Projedeki 4 eğitici mini-oyunun ortak tasarım kuralları:

| Mini-Oyun | Renk Teması | Başlık Standartı | Eylem Hedefi | Tamamlama Geri Bildirimi |
|---|---|---|---|---|
| **Mühendis Aylin (Baraj)** | Sky Blue (`#0284c7`) | "SU AKIŞ KURTARMA KONSOLU" | 5x7 Boru Izgarasını Döndürerek Bağla | Su dolum animasyonu & Rozet |
| **Nuri Amca (Boru)** | Teal & Koyu Çelik (`#008779`) | "AKUSTİK BORU RADARI" | Kaçağı Tespit Et & Vanayı Değiştir | Basınç ibresi normale döner |
| **İşçi Kemal (Park)** | Lime & Doğa Yeşili (`#57b36a`)| "AKILLI PARK FISKİYE MASASI" | Zamanlayıcı Ayarla & Sensör Seç | Buharlaşma kaybı %0'a düşer |
| **Çiftçi Rıza (Tarım)**| Terracotta & Altın (`#c16c39`) | "DAMLA SULAMA YÖNETİMİ" | Vahşi Sulamayı Kes & Boruları Döşe | Tarımsal verim yeşile döner |

**Ortak Kurallar:**
- Her mini-oyunun üstünde bir **"Geri Dön / Çıkış"** butonu ($48 \times 48 \text{ px}$) bulunur.
- Her mini-oyunda süre veya sayaç göstergesi ekranın sağ üstünde 16 pt Bold olarak konumlanır.
- Başarı durumunda standart **"Öğrenilen Ders & Kanıt Eklendi"** tebrik kartı gösterilir.

---

## 7. UYGULAMA SIRALAMASI VE KONTROL LİSTESİ

- [ ] `TownTheme.cs` renk ve font sabitlerinin tamamlanması.
- [ ] `MobileUILayout.cs` adaptif referans matrisinin oluşturulması.
- [ ] `Screen.safeArea` sınırlarının tüm panellere uygulanması.
- [ ] Dokunmatik kontrollerde `Touchscreen` multi-touch ayrımının sağlanması.
- [ ] `LoadTextureAuto` ve `AssetDatabase` çağrılarının kaldırılıp doğrudan referanslara bağlanması.
- [ ] Mobil ekran yönünün `Landscape` olarak kilitlenmesi.
