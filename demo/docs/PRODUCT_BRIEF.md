# ETKİM Demo — Product Brief v0.1

## 1. Çalışma Adı

Denge Kasabası — Su Krizi

Bu ad demo senaryosunun geçici çalışma adıdır. Nihai ürün/marka adı değildir.

---

## 2. Ürün Tanımı

Denge Kasabası, 10–12 yaş öğrencilerin açık uçlu gerçek yaşam problemleri üzerinde bilgi toplama, kanıt değerlendirme, çözüm üretme, karar verme ve stratejilerini gözden geçirme süreçlerini oyun tabanlı bir ortamda destekleyen bir eğitim teknolojisi prototipidir.

Sistem yalnızca nihai doğru/yanlış cevaba değil, öğrencinin problem çözme sürecinde gerçekleştirdiği gözlenebilir davranışlara da odaklanır.

---

## 3. Hedef Kullanıcı

Birincil kullanıcı:
- 10–12 yaş öğrenciler
- Yaklaşık 5.–6. sınıf düzeyi

İlk prototip yalnızca bu yaş grubuna göre tasarlanacaktır.

Diğer yaş grupları ilk demo kapsamı dışındadır.

---

## 4. Demo Problemi

Denge Kasabası'nda su kaynakları azalmaktadır.

Kasabada:
- evlerin su ihtiyacı,
- tarımsal üretim,
- park ve çevre,
- mevcut su kaynakları,
- belediye bütçesi

aynı anda dikkate alınmalıdır.

Öğrencinin görevi:

“Kasabanın su ihtiyacını karşılayacak, çevresel zararı azaltacak ve bütçeyi aşmayacak bir çözüm geliştir.”

Problemin tek bir doğru çözümü olmayacaktır.

---

## 5. Birincil Öğrenme Süreçleri

İlk demo yalnızca üç ana alanı hedefler:

### Problem Solving
- Problemi inceleme
- Bilgi toplama
- Alternatif çözüm üretme
- Planlama
- Çözümü uygulama
- Sonucu izleme
- Stratejiyi değiştirme

### Critical Thinking & Evidence Evaluation
- Bilgi kaynaklarını inceleme
- Kaynakları karşılaştırma
- Kanıtın güvenilirliğini değerlendirme
- Kararı gerekçelendirme
- Yeni kanıt karşısında kararı yeniden değerlendirme

### Metacognition / Self-Regulation
- Karar öncesi güven düzeyini değerlendirme
- Kendi stratejisini gözden geçirme
- Yardım isteme
- Hata veya yeni bilgi sonrasında strateji değiştirme
- Görev sonunda kısa reflection yapma

Systems Thinking bağımsız bir demo hedefi değildir; kararların kısa ve uzun vadeli sonuçlarını görünür kılan destekleyici bir süreç olarak senaryoya gömülecektir.

---

## 6. Temel Kullanıcı Döngüsü

Problem
→ Keşfet
→ Bilgi topla
→ Kanıtları karşılaştır
→ Çözüm seçeneklerini değerlendir
→ Plan oluştur
→ Karar ver
→ Sonucu gözlemle
→ Yeni bilgi/sonuçla karşılaş
→ Kararı koru veya değiştir
→ Yansıt

---

## 7. Ürünün Yenilik Noktası

Demo yalnızca:
“Doğru cevabı seç ve puan kazan”

mantığına dayanmayacaktır.

Amaç öğrencinin probleme nasıl yaklaştığını görünür hale getirmektir.

Örneğin sistem:
- hangi kaynakları incelediğini,
- kaynakları hangi sırayla kullandığını,
- hangi çözüm seçeneklerini değerlendirdiğini,
- yardım isteyip istemediğini,
- yeni kanıt sonrasında kararını değiştirip değiştirmediğini,
- kaç farklı strateji denediğini

kaydedebilecektir.

Bu veriler “yetkinlik puanı” değildir.

Bunlar yalnızca:
“Observed Process Indicators / Gözlenen Süreç Göstergeleri”

olarak ele alınacaktır.

---

## 8. Ar-Ge Sorusu

Açık uçlu oyun görevlerindeki davranışsal süreç verileri, öğrencilerin problem çözme, kanıt değerlendirme ve öz-düzenleme süreçleri için anlamlı göstergelere dönüştürülebilir mi?

Bu göstergeler öğrencinin ihtiyacına göre biçimlendirici pedagojik desteği yönlendirmek için kullanılabilir mi?

İlk prototip bu soruların bilimsel olarak doğrulandığını iddia etmez.

---

## 9. Demo Teknolojisi

Güncel `../../DEVELOPMENT_PLAN_Denge_Kasabasi.md` v1.0 ile uyumlu teknoloji kapsamı:

- Web tabanlı, 2D ve senaryo tabanlı arayüz
- Frontend: React + Vite + TypeScript
- Backend: NestJS + TypeScript
- Veritabanı: PostgreSQL + Prisma
- İletişim: REST API
- Kural tabanlı formative scaffolding
- Anonim oturumlara bağlı process/event logging
- Gerçek event kayıtlarından hesaplanan session summary
- Frontend yayını: Vercel
- Backend ve veritabanı yayını: Railway

Backend ve veritabanı güncel PoC kapsamına dahildir. Başlangıç aşamasında React ve NestJS proje iskeletleri birlikte oluşturulur; backend iş mantığı ve veritabanı entegrasyonu sonraki geliştirme fazlarında uygulanır.

İlk demo kapsamı dışındadır:
- AI/LLM
- Machine Learning
- Gerçek öğrenci hesabı

---

## 10. Demo Başarı Kriteri

Demo başarılı kabul edilir eğer:

1. Kullanıcı görevi başlatabiliyorsa,
2. Kasabayı keşfedebiliyorsa,
3. Farklı bilgi kaynaklarını inceleyebiliyorsa,
4. Bir çözüm planı oluşturabiliyorsa,
5. Planının sonuçlarını görebiliyorsa,
6. Yeni bilgi veya sonuç sonrasında planını değiştirebiliyorsa,
7. Kısa reflection tamamlayabiliyorsa,
8. Sistem temel interaction event'lerini kaydedebiliyorsa,
9. Oturum sonunda basit bir Process Summary üretilebiliyorsa.

---

## 11. İlk Demo Kapsamı

### Yapılacak

- Tek senaryo
- Tek yaş grubu
- 7 ana öğrenci ekranı
- 1 basit session summary ekranı
- 2D kasaba haritası
- Bilgi kaynakları
- Çözüm seçenekleri
- Karar sonuçları
- Rule-based hints
- Event logging
- Reflection
- Deploy edilmiş çalışan web demosu

### Yapılmayacak

- Login/Register
- Parent account
- Gerçek öğrenci profili
- Gerçek competency score
- Multiplayer
- AI chatbot
- AI companion
- ML modeli
- Büyük öğretmen dashboard'u
- Leaderboard
- Streak
- Badge sistemi
- Reklam
- Payment
- Mobile app
- 3D
- AR/VR
- Birden fazla oyun senaryosu

---

## 12. Ethics & Safety Sınırı

İlk demo:
- gerçek çocuk kişisel verisi toplamayacaktır,
- manipülatif engagement mekanikleri kullanmayacaktır,
- davranışsal verileri doğrulanmış yetkinlik puanı olarak sunmayacaktır,
- AI companion kullanmayacaktır,
- çocuk üzerinde otomatik yüksek etkili karar vermeyecektir.

Demo araştırma ve ürün doğrulama amacı taşıyan bir PoC olarak konumlandırılacaktır.