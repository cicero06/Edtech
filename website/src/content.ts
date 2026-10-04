export const approaches = [
  [
    "Öğrenme amaçlı oyunlar",
    "Bir problemi yaşayarak anlamak.",
    "Oyun, öğrenme hedefi etrafında kurulur. Çocuk bir rol üstlenir; bilgisini anlamlı bir durumda kullanır.",
  ],
  [
    "Problem çözme",
    "Çözümden önce doğru sorular.",
    "Sorunu keşfetmek, ihtiyaçları anlamak ve farklı çözüm yollarını karşılaştırmak deneyimin başlangıcıdır.",
  ],
  [
    "Kanıt değerlendirme",
    "Her bilgi aynı şeyi söylemez.",
    "Bir uzman görüşünü, ölçüm verisini ve doğrulanmamış iddiayı karşılaştırmak; bilginin kaynağını sorgulamayı teşvik eder.",
  ],
  [
    "Sistem düşüncesi",
    "Bir karar, birden fazla etki.",
    "Su, bütçe, tarım ve çevre birbirine bağlıdır. Bir alandaki iyileşmenin başka bir alana etkisini birlikte düşünürüz.",
  ],
  [
    "Açık uçlu karar verme",
    "Birden fazla savunulabilir yol.",
    "Sınırlı kaynaklarla seçim yapmak, öncelikleri ve vazgeçilen faydaları tartışmak için alan açar.",
  ],
  [
    "Yansıtma ve yeniden değerlendirme",
    "Yeni kanıt, yeni bir bakış.",
    "Çocuk sonuçları beklentisiyle karşılaştırır. Yeni bilgiyle kararını korumayı veya değiştirmeyi düşünür.",
  ],
];
export const futureAreas = [
  [
    "01",
    "Enerji ve İklim",
    "Enerji ihtiyaçları ile iklim üzerindeki etkiler arasında kararlar.",
    "sun",
  ],
  [
    "02",
    "Atık ve Döngüsel Ekonomi",
    "Kaynakların yeniden kullanıldığı bir yaşamı birlikte düşünmek.",
    "cycle",
  ],
  [
    "03",
    "Gıda Sistemleri",
    "Üretim, tüketim ve doğal kaynaklar arasındaki bağları keşfetmek.",
    "leaf",
  ],
  [
    "04",
    "Geleceğin Kentleri",
    "Yaşanabilir kentler için farklı ihtiyaçları bir arada değerlendirmek.",
    "city",
  ],
];
export const partnerModels = [
  [
    "Eğitim sponsorluğu",
    "Bir senaryoyu veya öğrenme temasını destekleyin.",
    "Kurumunuz, geliştirilen deneyimde \"eğitim partneri\" olarak yer alır. Çocuklara yönelik oyun ekranlarında reklam gösterilmez; görünürlük destekleyen kurum bilgilendirmesiyle sınırlı kalır.",
  ],
  [
    "Kuruma özel öğrenme dünyası",
    "Aynı altyapı, sizin temanız ve hedeflerinizle.",
    "Denge Kasabası'nın harita, senaryo ve görev altyapısı; kurumunuzun konusu, markası ve öğrenme hedefleriyle yeniden kurgulanabilir. Örneğin bir enerji şirketi için enerji dönüşümü temalı bir kasaba.",
  ],
  [
    "Kurumsal eğitim",
    "Şirket içi farkındalık için senaryo tabanlı deneyimler.",
    "Sürdürülebilirlik, siber güvenlik veya uyum gibi konularda çalışanlara yönelik karar temelli eğitim deneyimleri tasarlanabilir.",
  ],
  [
    "Araştırma ve proje ortaklığı",
    "Oyun tabanlı öğrenmeyi birlikte ölçelim.",
    "Üniversiteler ve proje konsorsiyumlarıyla öğrenme etkisi araştırmalarında; ulusal ve uluslararası programlarda ortak başvurularda yer almak hedeflerimiz arasında.",
  ],
];
export const partnerAudiences = [
  "Belediyeler",
  "Enerji ve çevre şirketleri",
  "Bankalar ve finans kurumları",
  "Üniversiteler",
  "STK'lar",
  "Kamu kurumları",
  "Teknoloji şirketleri",
];
export const partnerSteps = [
  ["Tanışma", "İhtiyacı ve öğrenme hedefini birlikte tanımlarız."],
  ["Tasarım", "Senaryo, tema ve görev yapısı kurumun bağlamına uyarlanır."],
  ["Geliştirme ve pilot", "Deneyim geliştirilir ve küçük ölçekli kullanımla sınanır."],
  ["Değerlendirme", "Kullanım çıktıları birlikte incelenir ve yol haritası netleşir."],
];
export type PostBlock = { h: string } | { p: string } | { ul: string[] };
export type Post = {
  slug: string;
  title: string;
  tag: string;
  date: string;
  excerpt: string;
  body: PostBlock[];
};
export const posts: Post[] = [
  {
    slug: "denge-kasabasinin-tasarim-hikayesi",
    title: "Denge Kasabası'nın tasarım hikâyesi: bir kasaba, birçok karar",
    tag: "Tasarım notları",
    date: "Eylül 2026",
    excerpt:
      "Neden bir kasaba? Su krizi neden ilk senaryo? Denge Kasabası'nın pedagojik döngüsünü ve tasarım kararlarını anlatıyoruz.",
    body: [
      {
        p: "Denge Kasabası fikri basit bir sorudan doğdu: Çocuklara sistem düşüncesini nasıl hissettirebiliriz? Soyut bağlantıları anlatmak yerine, birbirine bağlı ihtiyaçları olan somut bir yer kurmak istedik. Bir kasaba; suyu, tarlaları, evleri ve belediyesiyle tam da böyle bir sistem.",
      },
      {
        p: "İlk senaryo olarak su krizini seçmemiz tesadüf değil. Su; tarımı, bütçeyi, çevreyi ve günlük yaşamı aynı anda etkileyen bir kaynak. Tek bir doğru cevabı olmayan, her çözümün bir bedeli olan gerçek bir problem. Tam da çocukların üzerinde düşünmesini istediğimiz türden.",
      },
      { h: "Kanıt önce, karar sonra" },
      {
        p: "Oyunun çekirdek döngüsü kasıtlı olarak yavaş tasarlandı. Oyuncu önce kasabayı gezer, sonra farklı türde bilgi kaynaklarını karşılaştırır: uzman görüşü, ölçüm verisi, paydaş beklentisi ve doğrulanmamış iddia. Karar ancak bu incelemeden sonra gelir. Amaç cevabı bulmak değil; doğru soruları sormayı öğrenmek.",
      },
      {
        p: "Karakterler dekor değil; her biri farklı bir paydaş perspektifi taşır. Çiftçi Rıza'nın kaygısı ile Mühendis Aylin'in verisi bazen aynı yönü, bazen farklı yönleri gösterir. Karar verirken hepsinin masada olması gerekir — gerçek hayattaki gibi.",
      },
      {
        ul: [
          "Oyuncu en fazla üç müdahale seçer ve 50 birimlik bütçeyi aşamaz.",
          "Kararını hazır gerekçe seçenekleriyle savunur ve güven düzeyini belirtir.",
          "Sonuçlar geldikten sonra yeni bir kanıt sunulur ve plan bir kez revize edilebilir.",
          "Oturum sonunda izlenen adımlar özetlenir; bu, doğrulanmış bir puan değil, gözlenen davranış izidir.",
        ],
      },
      {
        p: "Bugün yayında olan sürüm bir prototip: öğretmen paneli, tamamlanmış öğretmen rehberi ve çok oyunculu kullanım henüz yok. Bunları pilot okul çalışmalarıyla doğrulamayı hedefliyoruz. Bu yazı dizisinde tasarım sürecini şeffaf şekilde paylaşmaya devam edeceğiz.",
      },
    ],
  },
  {
    slug: "neden-oyun-tabanli-ogrenme",
    title: "Neden oyun tabanlı öğrenme?",
    tag: "Pedagoji",
    date: "Eylül 2026",
    excerpt:
      "Ezber yerine deneyim, tek doğru yerine savunulabilir kararlar. Oyunu bir öğrenme modeli olarak nasıl kullandığımızı açıklıyoruz.",
    body: [
      {
        p: "Bir çocuğa \"su kaynaklarını korumak önemlidir\" demek ile, ona suyu azalan bir kasabayı emanet etmek arasında büyük fark var. İlkinde bilgi duyulur; ikincisinde bilgi bir kararın içinde kullanılmak zorundadır. Oyun tabanlı öğrenmeyi bu farkın üzerine kuruyoruz.",
      },
      {
        p: "Oyun, gerçek dünyanın karmaşıklığını güvenli bir alana taşır. Yanlış kararın bedeli ekranda görülür; kimse zarar görmez ama sonuç hissedilir. Bu, deneme ve yansıtma için ideal bir ortamdır.",
      },
      { h: "Cevap değil, süreç" },
      {
        p: "Tasarımımızda \"doğru cevabı bul\" görevi yok. Bunun yerine oyuncu sınırlı kaynakla seçim yapar, seçimini gerekçelendirir ve yeni kanıt geldiğinde kararını yeniden değerlendirir. Önemli olan sonuç değil; o sonuca nasıl ulaşıldığıdır.",
      },
      {
        p: "Aynı ekran sınıf içinde de çalışır. Önerdiğimiz kullanım; bireysel veya ikili oyunun ardından öğretmen rehberliğinde planların ve yan etkilerin karşılaştırıldığı bir tartışmadır. Oyun bitince öğrenme bitmez; asıl konuşma orada başlar.",
      },
      {
        p: "Dürüst olmak gerekirse: bunlar bizim tasarım hedeflerimiz. Öğrenme etkisini kanıtlanmış bir sonuç olarak sunmuyoruz; sınıf içi pilotlar ve pedagojik değerlendirmelerle ölçmeyi hedefliyoruz. Bu konudaki bulguları da burada paylaşacağız.",
      },
    ],
  },
  {
    slug: "v2-ongosteriminde-neler-degisti",
    title: "Başvurudan sonra durmadık: v2 ön gösteriminde neler değişti?",
    tag: "Geliştirme günlüğü",
    date: "Ekim 2026",
    excerpt:
      "ETKİM başvurusunda sunduğumuz sürüm yayında dururken, geliştirmeye devam ettik. Yeni harita, 3D sinematik tanıtım, Bölüm 2 '30 Gün Sonra' zaman atlaması, dinamik kasaba dönüşümü ve oturum raporu.",
    body: [
      {
        p: "ETKİM başvurusunda sunduğumuz oynanabilir prototipi (v1) başvurudaki haliyle yayında tutuyoruz. Başvurudan sonra ise çalışmaya devam ettik ve ortaya aynı öğrenme döngüsünü koruyan ama çok daha zengin bir sürüm çıktı: v2 ön gösterimi.",
      },
      {
        ul: [
          "Yeni kasaba haritası ve bölge bazlı ortam sesleri",
          "Gerçek yürüme animasyonları ve canlı kasaba görünümü",
          "Öğrenci profili ve yerel oturum kaydı",
          "Kanıt rozetli belediye toplantısı ve ₺1.000.000 bütçe kararı",
          "Bölüm 2: '30 Gün Sonra' (TimeShift) zaman atlaması",
          "Dinamik kasaba dönüşümü: sokak borusu onarımı, yeni asfalt ve damla sulama hatları",
          "Öğrenci karnesi ve veli/öğretmen açık oturum raporu",
          "3D sinematik tanıtım filmi (1080p)",
        ],
      },
      { h: "Neden iki sürümü birlikte yayınlıyoruz?" },
      {
        p: "Başvuru sürümü, değerlendirme sürecinde sunduğumuz ürünün dürüst bir kaydı olarak kalsın istedik. Ön gösterim ise gelişimin hız kesmeden devam ettiğini gösteriyor. Ziyaretçiler iki sürümü de açıp farkı kendileri görebilir.",
      },
      {
        p: "Sıradaki adımlar; pilot okul sınıf uygulamaları, öğretmen rehberi ve kurumsal kullanım lisanslama süreçleri. Gelişmeleri bu sayfada duyurmaya devam edeceğiz.",
      },
    ],
  },
];
export const flow = [
  ["Keşfet", "Kasabanın beş bölgesini incele."],
  ["Kanıt Topla", "Farklı türde bilgi kaynaklarını karşılaştır."],
  ["Planla", "Bütçenle en fazla üç müdahale seç."],
  [
    "Kararını Gerekçelendir",
    "Gerekçe seçeneklerinden seçim yap, güvenini belirt.",
  ],
  ["Sonuçları Gör", "Su, bütçe ve yan etkileri incele."],
  ["Yeni Kanıt", "Düşük yağış tahminini dikkate al."],
  ["Yeniden Değerlendir", "Planını koru veya bir kez değiştir."],
  ["Sürecini İncele", "Oturumdaki etkileşimlerinin özetine bak."],
];
