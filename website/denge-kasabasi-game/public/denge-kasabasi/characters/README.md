# Karakter görselleri

`lina.svg` geçici 2D portredir. Aynı adlı dosyayı değiştirmeniz yeterlidir.
PNG/WebP kullanılırsa `src/data/characterDialogues.ts` içindeki `portrait` yolunu güncelleyin.
Yollar Vite BASE_URL üzerinden çözülür; bağımsız oyun ve site derlemesi desteklenir.

Bölge karakterleri `src/data/areas.ts` içinde tanımlıdır. Murat, Elif, Hasan,
Zeynep ve Derya şimdilik emoji placeholder kullanır. Gerçek portreyi bu klasöre
koyup ilgili karaktere `portrait: 'denge-kasabasi/characters/murat.svg'` gibi
bir yol ekleyin. `CharacterDialogue` görsel yüklenemezse fallback gösterir.

Bölge içerikleri aynı data dosyasında; `AreaInfoModal` tüm bölgeler için ortaktır.
`selectedArea` geçici popup seçimidir. `visitedAreas`, mevcut kalıcı
`exploredLocations` kaydının ekran içindeki adıdır. `openLocation` yalnızca
“İNCELEMEYİ TAMAMLA” ile, henüz tamamlanmamış bölge için çağrılır.
Uyumluluk için mevcut `location_opened` olay adı ve v1 kayıt formatı korunur.
Eski kayıtlardaki incelenmiş bölgeler korunur. Popup kapatma ziyaret kaydetmez.
Beş bölge tamamlandığında CTA mevcut araştırma ekranına geçer.

Diyalog kartı konumu yereldir; sayfa yenilenirse giriş konuşması baştan başlar.
Görev başladıktan sonra oturum ve bölge ziyaretleri mevcut localStorage kaydından sürer.

## Araştırma ekranı

Derya, Hasan ve Zeynep için `derya/portrait.svg`, `hasan/portrait.svg`,
`zeynep/portrait.svg` geçici portreleri bulunur. Aynı dosyaları değiştirin veya
`src/data/evidenceSources.ts` içindeki `character.portrait` yolunu güncelleyin.
Bileşen kodu değişmeden yeni görseller yüklenir; yükleme hatasında emoji gösterilir.

Araştırma metinleri ve kazanımlar `evidenceSources.ts` dosyasındadır.
Grafik ve bütçe değerleri `waterCrisisScenario` verisinden alınır.
`selectedSourceId` geçici seçimdir; `reviewedSources` mevcut kalıcı
`viewedSources` listesini kullanır. `openSource` yalnızca “KAYNAĞI İNCELEDİM”
ile çağrılır. Eski oturumlar ve `source_opened` olay formatı korunur.
