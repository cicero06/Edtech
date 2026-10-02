import { posts } from "./content";
export const site = {
  name: "Atlas Learning Technologies",
  origin: "https://atlaslearningtech.com",
  email: "huseyinn.dnz@gmail.com",
  demoUrl: "/denge-kasabasi/oyna/",
};
export const pages: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Atlas Learning Technologies | Oyunla keşfet. Kanıtla düşün.",
    description:
      "Atlas Learning Technologies — 10–12 yaş için oyun tabanlı öğrenme deneyimleri. Kanıt değerlendirme, sistem düşüncesi ve karar verme becerileri geliştiren interaktif öğrenme dünyaları. Reklamsız ve çocuk güvenliği öncelikli tasarım.",
  },
  "/denge-kasabasi": {
    title: "Denge Kasabası: Su Krizi | Atlas Learning Technologies",
    description:
      "10–12 yaş için oyun tabanlı bir karar verme deneyimi: 5 bölge, 10+ paydaş, kanıta dayalı müdahale paketleri. Kasabayı keşfet, kanıt topla, sınırlı bütçeyle plan yap ve yeni bilgiyle kararını yeniden değerlendir.",
  },
  "/kurumlar": {
    title: "Kurumlarla İş Birliği | Atlas Learning Technologies",
    description:
      "Belediyeler, şirketler, üniversiteler ve STK'lar için eğitim sponsorluğu, kuruma özel öğrenme dünyaları ve araştırma ortaklıkları. Oyun tabanlı öğrenme altyapımızla birlikte tasarlayalım.",
  },
  "/blog": {
    title: "Blog ve Notlar | Atlas Learning Technologies",
    description:
      "Atlas ekibinden tasarım notları, pedagoji yazıları ve geliştirme günlükleri: oyun tabanlı öğrenme, Denge Kasabası'nın hikâyesi ve sürüm notları.",
  },
  ...Object.fromEntries(
    posts.map((p) => [
      `/blog/${p.slug}`,
      { title: `${p.title} | Atlas Blog`, description: p.excerpt },
    ]),
  ),
  "/yazar": {
    title: "Yazar Paneli | Atlas Blog",
    description: "Atlas blog yazar konsolu.",
  },
  "/404": {
    title: "Sayfa bulunamadı | Atlas Learning Technologies",
    description:
      "Aradığınız sayfa bulunamadı. Atlas Learning Technologies ana sayfasına dönün.",
  },
};
