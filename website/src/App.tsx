import { useEffect, useRef, useState } from "react";
import { site, pages } from "./config";
import { approaches, futureAreas, flow } from "./content";

function Arrow({ external = false }: { external?: boolean }) {
  return <span aria-hidden="true">{external ? "↗" : "↗"}</span>;
}
function DemoLink({ light = false }: { light?: boolean }) {
  return (
    <a className={`button ${light ? "light" : "primary"}`} href={site.demoUrl}>
      Demoyu Oyna <Arrow />
    </a>
  );
}
function Brand() {
  return (
    <a
      href="/"
      className="brand"
      aria-label="Atlas Learning Technologies ana sayfa"
    >
      <svg viewBox="0 0 44 44" aria-hidden="true">
        <path d="M4 37 20 6h4l15 31H28l-6-14-7 14Z" fill="currentColor" />
        <circle cx="36" cy="9" r="4" fill="#c16c39" />
      </svg>
      <span>
        atlas<small>LEARNING TECHNOLOGIES</small>
      </span>
    </a>
  );
}
const links = [
  ["Ürünümüz", "/denge-kasabasi"],
  ["Yaklaşımımız", "/#yaklasimimiz"],
  ["Gelecek Çözümler", "/#gelecek"],
  ["Hakkımızda", "/#hakkimizda"],
  ["İletişim", "/#iletisim"],
];
function Header({ product }: { product: boolean }) {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  return (
    <header className="header">
      <div className="container header-inner">
        <Brand />
        <button
          ref={toggle}
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="main-nav"
          onClick={() => setOpen(!open)}
        >
          {open ? "Kapat ×" : "Menü ☰"}
        </button>
        <nav
          id="main-nav"
          aria-label="Ana navigasyon"
          className={open ? "nav open" : "nav"}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              toggle.current?.focus();
            }
          }}
        >
          {links.map(([label, href]) => (
            <a
              key={href}
              href={href}
              aria-current={
                product && href === "/denge-kasabasi" ? "page" : undefined
              }
              onClick={() => setOpen(false)}
            >
              {label}
              {label === "İletişim" && <Arrow />}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="eyebrow">
      <span aria-hidden="true" />
      {children}
    </p>
  );
}
function Icon({ kind }: { kind: string }) {
  return (
    <svg
      className="line-icon"
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      {kind === "sun" ? (
        <>
          <circle cx="24" cy="24" r="9" />
          <path d="M24 3v7m0 28v7M3 24h7m28 0h7M9 9l5 5m20 20 5 5M9 39l5-5m20-20 5-5" />
        </>
      ) : kind === "cycle" ? (
        <>
          <path d="M10 22a15 15 0 0 1 26-9l4 5M40 8v10H30M38 27a15 15 0 0 1-26 9l-4-5M8 41V31h10" />
        </>
      ) : kind === "leaf" ? (
        <>
          <path d="M10 38C4 14 23 5 40 8c1 22-12 30-30 30Zm0 0L31 17M20 28V17m0 11h11" />
        </>
      ) : (
        <>
          <path d="M6 40V19h11v21m3 0V7h12v33m4 0V24h7v16M3 40h42M24 14h4m-4 7h4m-4 7h4M10 25h3m-3 7h3" />
        </>
      )}
    </svg>
  );
}
function Contact() {
  return (
    <section id="iletisim" className="contact">
      <div className="container contact-inner">
        <div>
          <Eyebrow>BİRLİKTE DÜŞÜNELİM</Eyebrow>
          <h2>
            Öğrenmenin geleceğinde
            <br />
            birlikte yer alalım.
          </h2>
          <p>
            Eğitimci, okul veya kurum olarak kullanım olanaklarını
            <br className="desktop" /> konuşmak ya da deneyiminizi paylaşmak
            için bize yazın.
          </p>
        </div>
        <a className="contact-link" href={`mailto:${site.email}`}>
          <span>İletişime geçin</span>
          <Arrow />
          <small>{site.email}</small>
        </a>
      </div>
    </section>
  );
}
function Footer() {
  return (
    <footer className="container footer">
      <div>
        <Brand />
        <p>
          Oyunla keşfet. Kanıtla düşün.
          <br />
          Geleceği şekillendir.
        </p>
      </div>
      <div className="footer-links">
        <a href="/denge-kasabasi">Denge Kasabası</a>
        <a href="/#yaklasimimiz">Öğrenme yaklaşımımız</a>
        <a href={`mailto:${site.email}`}>
          Bize yazın <Arrow />
        </a>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Atlas Learning Technologies</span>
        <span>Merakla başlar. Düşünerek ilerler.</span>
      </div>
    </footer>
  );
}
function Home() {
  return (
    <>
      <section className="hero container">
        <div className="hero-copy">
          <Eyebrow>GERÇEK PROBLEMLER. ANLAMLI DENEYİMLER.</Eyebrow>
          <h1>
            Oyunla keşfet.
            <br />
            Kanıtla düşün.
            <br />
            <em>Geleceği şekillendir.</em>
          </h1>
          <p>
            Çocukların dünyayı anlaması, farklı olasılıkları keşfetmesi ve kendi
            kararlarını gerekçelendirmesi için oyun tabanlı öğrenme deneyimleri
            geliştiriyoruz.
          </p>
          <div className="actions">
            <a className="button primary" href="/denge-kasabasi">
              Denge Kasabası’nı keşfet <Arrow />
            </a>
            <a className="text-link" href="#yaklasimimiz">
              Yaklaşımımız <span aria-hidden="true">↓</span>
            </a>
          </div>
          <div className="hero-foot">
            <span className="little-orbit" aria-hidden="true">
              ✳
            </span>
            <span>
              Merakı harekete geçiren,
              <br />
              düşünmeye alan açan öğrenme.
            </span>
          </div>
        </div>
        <div className="hero-art">
          <img
            src="/images/town.jpg"
            width="512"
            height="512"
            alt="Denge Kasabası oyunundan; su, tarım alanları ve evleri bir araya getiren kasaba görseli"
            fetchPriority="high"
          />
          <div className="art-tag">
            <span className="status-dot" />
            İLK ÜRÜNÜMÜZ · DENGE KASABASI
          </div>
          <div className="art-caption">
            <span>
              BİR KASABA.
              <br />
              BİRBİRİNE BAĞLI BİRÇOK KARAR.
            </span>
            <a
              href="/denge-kasabasi"
              aria-label="Denge Kasabası ürününü keşfet"
            >
              <Arrow />
            </a>
          </div>
          <span className="art-note">Mevcut oyunun kasaba görseli</span>
        </div>
      </section>
      <section className="intro-strip">
        <div className="container intro-inner">
          <Eyebrow>ATLAS İLE ÖĞRENME</Eyebrow>
          <h2>
            Bilgiyi bir karara,
            <br />
            kararı bir <em>öğrenme deneyimine</em> dönüştürmek.
          </h2>
          <p>
            Atlas Learning Technologies, çocukların gerçek yaşam problemleri
            üzerinde düşünmesini merkeze alır. Öğrenme tasarımı ile oyun
            mekaniklerini bir araya getirerek araştırmaya, seçim yapmaya ve
            sonuçları anlamlandırmaya alan açar.
          </p>
        </div>
      </section>
      <section className="section container" id="urun">
        <div className="section-heading">
          <div>
            <Eyebrow>İLK ÜRÜNÜMÜZ</Eyebrow>
            <h2>
              Küçük bir kasaba.
              <br />
              Büyük sorular.
            </h2>
          </div>
          <p>
            Bir karar yalnızca tek bir şeyi değiştirmez.
            <br />
            Denge Kasabası’nda çocuklar bu bağlantıları keşfeder.
          </p>
        </div>
        <article className="product-feature">
          <div className="feature-image">
            <img
              src="/images/game-map.png"
              width="1440"
              height="1000"
              loading="lazy"
              alt="Mevcut demoda baraj, evler, tarım, park ve belediye bölgelerini gösteren keşif ekranı"
            />
            <span>Çalışan demodan gerçek ekran görüntüsü</span>
          </div>
          <div className="feature-copy">
            <span className="pill">10–12 YAŞ · OYNANABİLİR PROTOTİP</span>
            <h3>Denge Kasabası</h3>
            <p className="scenario-name">İlk senaryo: Su Krizi</p>
            <p>
              Kasabanın su kaynakları azalıyor. Bütçe sınırlı. Çocuklar farklı
              kaynakları inceler, çözüm planı oluşturur ve kararlarının kasabaya
              etkisini görür.
            </p>
            <a className="text-link" href="/denge-kasabasi">
              Ürünü yakından tanıyın <Arrow />
            </a>
          </div>
        </article>
      </section>
      <section id="yaklasimimiz" className="approach section">
        <div className="container">
          <div className="section-heading">
            <div>
              <Eyebrow>YAKLAŞIMIMIZ</Eyebrow>
              <h2>
                Cevabı seçmenin ötesinde,
                <br />
                <em>düşünme sürecinin içinde.</em>
              </h2>
            </div>
            <p>
              Çocuğun ne düşündüğü kadar,
              <br />o düşünceye nasıl ulaştığı da değerli.
            </p>
          </div>
          <div className="approach-grid">
            {approaches.map(([title, lead, body], i) => (
              <article key={title}>
                <span className="index">0{i + 1}</span>
                <h3>{title}</h3>
                <p className="lead">{lead}</p>
                <p>{body}</p>
              </article>
            ))}
          </div>
          <p className="method-note">
            Bunlar tasarımımızın pedagojik hedefleridir. Öğrenme etkisinin
            kullanıcı testleri ve pedagojik pilotlarla değerlendirilmesi
            hedeflenmektedir.
          </p>
        </div>
      </section>
      <section id="gelecek" className="section container">
        <div className="section-heading">
          <div>
            <Eyebrow>GELECEK ÇÖZÜMLER</Eyebrow>
            <h2>
              Keşfedilecek daha
              <br />
              çok dünya var.
            </h2>
          </div>
          <p>
            Su yönetimiyle başlayan yolculuğu yeni alanlara taşımayı
            hedefliyoruz. Aşağıdaki başlıklar gelecekteki geliştirme
            alanlarımızdır.
          </p>
        </div>
        <div className="future-grid">
          {futureAreas.map(([n, title, body, icon]) => (
            <article key={n}>
              <div className="future-top">
                <Icon kind={icon} />
                <span>{n}</span>
              </div>
              <span className="future-label">GELECEK HEDEFİ</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="educators container">
        <div>
          <Eyebrow>EĞİTİMCİLER VE KURUMLAR İÇİN</Eyebrow>
          <h2>
            Oyunda başlayan sorular,
            <br />
            sınıfta derinleşen düşünceler.
          </h2>
        </div>
        <div>
          <p>
            Bir oyun deneyimi; kanıt, kaynak kullanımı ve kararlar üzerine ortak
            bir tartışmanın başlangıcı olabilir. Öğretmen rehberliğinde bireysel
            oyun ve ardından sınıf içi değerlendirme, önerdiğimiz kullanım
            yaklaşımıdır.
          </p>
          <p>
            Özel okullar ve eğitim kurumları için yıllık kurumsal lisanslama,
            ilerleyen aşamada kamu kurumlarına yönelik lisanslama modeli
            hedefliyoruz. Paket ve fiyatların pilotlar ve kurum görüşmeleriyle
            doğrulanması planlanıyor. Öğretmen rehberi ve kurumsal kullanım
            araçları gelecek geliştirme kapsamındadır.
          </p>
          <a className="text-link" href={`mailto:${site.email}`}>
            Kullanım olanaklarını konuşalım <Arrow />
          </a>
        </div>
      </section>
      <section id="hakkimizda" className="section container about">
        <div>
          <Eyebrow>HAKKIMIZDA</Eyebrow>
          <h2>
            Öğrenmeye meraklı.
            <br />
            <em>Geleceğe karşı sorumlu.</em>
          </h2>
        </div>
        <div>
          <p className="about-lead">
            Atlas Learning Technologies, çocukların karmaşık dünyayı anlamasına
            yardımcı olacak öğrenme deneyimleri geliştiren bir eğitim
            teknolojisi girişimidir.
          </p>
          <p>
            İlk ürünümüz Denge Kasabası ile su yönetimini; kanıt değerlendirme,
            sistem düşüncesi ve gerekçeli karar verme için bir keşif alanına
            dönüştürüyoruz.
          </p>
          <div className="team-summary">
            <span className="eyebrow">EKİBİMİZİN YAKLAŞIMI</span>
            <p>
              Hüseyin Deniz, kurucu olarak yazılım ve ürün geliştirmeyi
              üstleniyor. Fadime Aksoy, pedagojik tasarım ve oyun tasarımı
              alanında; öğrenme hedeflerinin oyun mekanikleriyle
              eşleştirilmesine ve pedagojik değerlendirme süreçlerine katkı
              sağlıyor.
            </p>
          </div>
        </div>
      </section>
      <Contact />
    </>
  );
}
function Product() {
  return (
    <>
      <section className="product-hero container">
        <a className="breadcrumb" href="/">
          Atlas <span aria-hidden="true">/</span>
        </a>
        <Eyebrow>DENGE KASABASI · İLK SENARYO</Eyebrow>
        <div className="product-hero-row">
          <div>
            <h1>
              Bir kasabanın geleceği.
              <br />
              <em>Senin kararların.</em>
            </h1>
            <p>
              Denge Kasabası: Su Krizi, 10–12 yaş çocukları su kaynakları azalan
              bir kasabada karar verici rolüne yerleştiren oyun tabanlı bir
              öğrenme prototipidir.
            </p>
          </div>
          <div className="product-hero-cta">
            <DemoLink />
            <span>Oynanabilir prototip · Yeni sekmede açılır</span>
          </div>
        </div>
        <div className="product-banner">
          <img
            src="/images/town.jpg"
            width="512"
            height="512"
            alt="Su kaynakları, evler ve tarım alanlarıyla Denge Kasabası’nın mevcut oyun görseli"
            fetchPriority="high"
          />
          <div>
            <span>İLK SENARYO</span>
            <strong>Su Krizi</strong>
            <p>
              Suyu yönet. Etkileri düşün.
              <br />
              Kasabanın dengesini gözet.
            </p>
          </div>
        </div>
      </section>
      <section className="section container product-intro">
        <div>
          <Eyebrow>DENGE KASABASI NEDİR?</Eyebrow>
          <h2>
            Birbiriyle bağlantılı
            <br />
            kararların oyun alanı.
          </h2>
        </div>
        <div>
          <p className="about-lead">
            Denge Kasabası, gerçek yaşam problemlerini keşif ve karar verme
            deneyimine dönüştüren ilk ürünümüz.
          </p>
          <p>
            İlk senaryo Su Krizi’nde amaç, kasabanın su ihtiyacını karşılarken
            bütçeyi ve tarımsal, çevresel etkileri birlikte düşünmek. Oyuncu
            farklı müdahaleleri karşılaştırır; planını uygular ve yeni bilgiyle
            yeniden değerlendirir.
          </p>
          <div className="facts">
            <span>
              <strong>10–12</strong>hedef yaş grubu
            </span>
            <span>
              <strong>Tek oyunculu</strong>tarayıcı deneyimi
            </span>
            <span>
              <strong>Su Krizi</strong>ilk oynanabilir senaryo
            </span>
          </div>
        </div>
      </section>
      <section className="section approach">
        <div className="container">
          <Eyebrow>ÖĞRENME YOLCULUĞU</Eyebrow>
          <h2>Her adım, yeni bir düşünme fırsatı.</h2>
          <ol className="flow">
            {flow.map(([title, body], i) => (
              <li key={title}>
                <span>
                  {String(i + 1).padStart(2, "0")}{" "}
                  <span aria-hidden="true">→</span>
                </span>
                <h3>{title}</h3>
                <p>{body}</p>
              </li>
            ))}
          </ol>
          <p className="method-note">
            Bu akışın tüm adımları mevcut prototipte bulunur. Gerekçelendirme
            hazır seçeneklerle, yansıtma iki seçim sorusuyla yapılır; plan bir
            kez revize edilebilir. Serbest açıklama ve daha kapsamlı pedagojik
            değerlendirme hedeflenen tasarımın parçalarıdır.
          </p>
        </div>
      </section>
      <section className="section container">
        <div className="section-heading">
          <div>
            <Eyebrow>MEVCUT DEMONUN İÇİNDEN</Eyebrow>
            <h2>
              Araştır. Karşılaştır.
              <br />
              Kendi planını kur.
            </h2>
          </div>
          <p>
            Aşağıdaki görseller çalışan yerel demodan alınmıştır. Oyunun mevcut
            arayüzünü gösterir.
          </p>
        </div>
        <div className="screens">
          <figure>
            <a
              href="/images/game-map.png"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/images/game-map.png"
                width="1440"
                height="1000"
                loading="lazy"
                alt="Beş keşif bölgesi ve görev paneliyle Denge Kasabası haritası; görseli yeni sekmede büyüt"
              />
            </a>
            <figcaption>
              <strong>01 / Kasabayı keşfet</strong>
              <span>Baraj, evler, tarım, park ve belediye.</span>
            </figcaption>
          </figure>
          <figure>
            <a
              href="/images/game-plan.png"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/images/game-plan.png"
                width="1440"
                height="1000"
                loading="lazy"
                alt="Maliyet ve etkileri gösteren beş müdahale seçeneğiyle planlama ekranı; görseli yeni sekmede büyüt"
              />
            </a>
            <figcaption>
              <strong>02 / Seçenekleri tart</strong>
              <span>Sınırlı bütçe, farklı faydalar ve yan etkiler.</span>
            </figcaption>
          </figure>
        </div>
        <div className="mechanics">
          <article>
            <h3>Farklı bilgi kaynakları</h3>
            <p>
              Altı kaynak kartı; uzman ve paydaş görüşleri, veri ve
              doğrulanmamış iddia gibi türleri ayırır. Çevre uzmanı kartının
              ayrıntılı içeriği henüz tamamlanmamıştır.
            </p>
          </article>
          <article>
            <h3>Sınırlı kaynaklarla planlama</h3>
            <p>
              Beş müdahale seçeneğinden en fazla üçü seçilebilir. Toplam maliyet
              başlangıçtaki 50 birim bütçeyi aşamaz. Bu sayılar oyun senaryosuna
              aittir.
            </p>
          </article>
          <article>
            <h3>Karar, sonuç ve yeni kanıt</h3>
            <p>
              Gerekçe seçimi ve 1–5 güven düzeyinden sonra su ve bütçe değişimi,
              nitel yan etkiler ve düşük yağış tahmini gösterilir.
            </p>
          </article>
        </div>
      </section>
      <section className="pedagogy">
        <div className="container pedagogy-inner">
          <div>
            <Eyebrow>PEDAGOJİK YAKLAŞIM</Eyebrow>
            <h2>
              Önemli olan yalnızca
              <br />
              sonuç değil,
              <br />
              <em>oraya nasıl ulaştığın.</em>
            </h2>
          </div>
          <div>
            <p>
              Deneyimsel öğrenme yaklaşımıyla çocuk, problemi eylemleri
              üzerinden keşfeder. Farklı seçeneklerin faydalarını ve bedellerini
              düşünmek sistem düşüncesine; yeni kanıtla planını gözden geçirmek
              ise kendi düşünme sürecini fark etmeye alan açar.
            </p>
            <p>
              Oturum sonunda incelenen bölgeler, kaynaklar, plan sayısı ve
              yeniden değerlendirme gibi etkileşimler özetlenir.
            </p>
            <p className="pedagogy-note">
              Bu göstergeler gözlenen davranış izleridir; doğrulanmış yetkinlik
              puanları veya kanıtlanmış öğrenme sonuçları değildir. Pedagojik
              etkiyi pilot çalışmalarla değerlendirmek hedeflenmektedir.
            </p>
          </div>
        </div>
      </section>
      <section className="section container">
        <div className="section-heading">
          <div>
            <Eyebrow>SINIFTA KULLANIM</Eyebrow>
            <h2>
              Birlikte oynamak.
              <br />
              Birlikte düşünmek.
            </h2>
          </div>
          <p>
            Öğretmen rehberliğinde önerilen kullanım senaryosu. Mevcut demo tek
            oyunculudur; birlikte kullanım aynı ekran etrafında tartışma
            biçimindedir.
          </p>
        </div>
        <div className="classroom">
          <article>
            <span>ÖNCE</span>
            <h3>Soruyu açın.</h3>
            <p>
              “Bir kasabanın suyu azalırsa kimler etkilenir?” sorusuyla
              çocukların ilk fikirlerini konuşun.
            </p>
          </article>
          <article>
            <span>OYUN SIRASINDA</span>
            <h3>Kararlara alan açın.</h3>
            <p>
              Öğrenciler bireysel veya aynı ekran başında ikili olarak
              seçenekleri değerlendirsin. “Bu kaynağa neden güvendin?” diye
              sorun.
            </p>
          </article>
          <article>
            <span>SONRA</span>
            <h3>Süreci tartışın.</h3>
            <p>
              Planları, yan etkileri ve yeni kanıtın kararları nasıl
              etkilediğini karşılaştırın. Oturum özetini tartışmanın başlangıcı
              olarak kullanın.
            </p>
          </article>
        </div>
        <p className="method-note">
          Öğretmen paneli, tamamlanmış öğretmen rehberi ve çok oyunculu özellik
          mevcut demoda yer almıyor. Rehber ve kurumsal kullanım araçları
          gelecek geliştirme hedefleri arasında.
        </p>
      </section>
      <section id="demo" className="demo-section container">
        <div>
          <Eyebrow>DENEYİMİ KEŞFEDİN</Eyebrow>
          <h2>
            Kasabanın ilk kararını
            <br />
            siz verin.
          </h2>
          <p>Su Krizi’nin çalışan prototipini tarayıcınızda deneyin.</p>
        </div>
        <div>
          <DemoLink light />
          <p>Demo ayrı bir sitede, yeni sekmede açılır.</p>
        </div>
      </section>
      <Contact />
    </>
  );
}
export function App({ path }: { path: string }) {
  const normalized = path.replace(/\/+$/, "") || "/";
  const product = normalized === "/denge-kasabasi";
  const gameRoute =
    normalized === "/denge-kasabasi/oyna" ||
    normalized.startsWith("/denge-kasabasi/oyna/");
  const known = normalized === "/" || product || gameRoute;
  useEffect(() => {
    const meta = pages[
      known ? (product || gameRoute ? "/denge-kasabasi" : "/") : "/404"
    ];
    document.title = meta.title;
    let tag = document.querySelector('meta[name="description"]');
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute("name", "description");
      document.head.append(tag);
    }
    tag.setAttribute("content", meta.description);
  }, [known, product, gameRoute]);
  return (
    <>
      <a className="skip-link" href="#main">
        İçeriğe geç
      </a>
      <Header product={product} />
      <main id="main">
        {known ? (
          product ? (
            <Product />
          ) : gameRoute ? (
            <Product />
          ) : (
            <Home />
          )
        ) : (
          <section className="container not-found">
            <Eyebrow>404 · SAYFA BULUNAMADI</Eyebrow>
            <h1>
              Bu yol başka bir
              <br />
              yere çıkıyor.
            </h1>
            <p>
              Aradığınız sayfa bulunamadı. Keşfe ana sayfadan devam
              edebilirsiniz.
            </p>
            <a className="button primary" href="/">
              Ana sayfaya dön <Arrow />
            </a>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
