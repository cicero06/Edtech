import { useRef, useState } from "react";
import { site } from "../config";
import { approaches, futureAreas, partnerModels } from "../content";
import { Arrow } from "../components/Arrow";
import { Contact } from "../components/Contact";
import { Eyebrow } from "../components/Eyebrow";
import { Icon } from "../components/Icon";
import { VideoModal } from "../components/VideoModal";
import { useHomeAnimations } from "../hooks/useHomeAnimations";
import { useReveals } from "../hooks/useReveals";

export function Home() {
  const root = useRef<HTMLDivElement>(null);
  const [trailerOpen, setTrailerOpen] = useState(false);
  useHomeAnimations(root);
  useReveals(root);
  return (
    <div className="home" ref={root}>
      <section className="hero container">
        <div className="hero-copy">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            <span>Eğitim Teknolojileri · Oyun Tabanlı Öğrenme</span>
          </div>
          <h1>
            Oyunla keşfet,
            <br />
            kanıtla düşün,
            <br />
            <em>geleceği şekillendir!</em>
          </h1>
          <p>
            Atlas Learning Technologies, çocukların gerçek yaşam problemlerini
            oyunla keşfettiği öğrenme deneyimleri tasarlar. Teorik ezber yerine
            kasaba yönetir, veri toplar, hipotez test eder ve kararlarının
            etkisini görürler.
          </p>
          <div className="actions">
            <a className="button primary" href="/denge-kasabasi">
              Denge Kasabası&apos;nı Keşfet <Arrow />
            </a>
            <button
              type="button"
              className="button light button-trailer"
              onClick={() => setTrailerOpen(true)}
            >
              <span className="play-icon" aria-hidden="true">▶</span>
              Tanıtım Filmi (1:20)
            </button>
            <a className="button light" href="#nasil-oynanir">
              Nasıl Oynanır?
            </a>
          </div>
          <p className="version-note">
            Başvuru sürümü yayında ·{" "}
            <a href="/denge-kasabasi/ongosteri/">
              v2 yeni harita ön gösterimde <Arrow />
            </a>
          </p>
          <div className="hero-foot">
            <span className="little-orbit" aria-hidden="true">
              ✓
            </span>
            <span>
              Sosyal Bilgiler ve Fen kazanım
              <br />
              alanlarıyla ilişkili, 10–12 yaş için.
            </span>
          </div>
        </div>
        <div className="hero-art">
          <button
            type="button"
            className="art-play-badge"
            onClick={() => setTrailerOpen(true)}
            aria-label="3D Tanıtım Filmini İzle"
          >
            <span className="play-icon" aria-hidden="true">▶</span>
            3D Tanıtım Filmi
          </button>
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
        <span className="hero-prop prop-windmill" aria-hidden="true">
          <img src="/images/windmill.png" alt="" />
        </span>
        <span className="hero-prop prop-drop" aria-hidden="true">
          <img src="/images/cursor-drop.png" alt="" />
        </span>
        <span className="hero-prop prop-tree" aria-hidden="true">
          <img src="/images/tree-blossom.png" alt="" />
        </span>
      </section>
      <section className="glance" aria-label="Bir bakışta Atlas">
        <div className="container glance-grid" data-reveal-group>
          <div>
            <strong>Eğitim teknolojisi</strong>
            <span>odak alanımız</span>
          </div>
          <div>
            <strong>Oyun tabanlı öğrenme</strong>
            <span>temel yaklaşımımız</span>
          </div>
          <div>
            <strong>10–12 yaş</strong>
            <span>hedef kitle</span>
          </div>
          <div>
            <strong>1 oynanabilir ürün</strong>
            <span>2 sürümü yayında</span>
          </div>
          <div>
            <strong>Türkiye</strong>
            <span>yerleşik ekip</span>
          </div>
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

      <section id="hakkimizda" className="section container about">
        <div data-reveal>
          <Eyebrow>HAKKIMIZDA</Eyebrow>
          <h2>
            Öğrenmeye meraklı.
            <br />
            <em>Geleceğe karşı sorumlu.</em>
          </h2>
        </div>
        <div data-reveal>
          <p className="about-lead">
            Atlas Learning Technologies, çocukların karmaşık dünyayı anlamasına
            yardımcı olacak öğrenme deneyimleri geliştirir.
          </p>
          <p>
            İlk ürünümüz Denge Kasabası ile su yönetimini, sistem düşüncesini ve
            gerekçeli karar vermeyi bir araya getiren oyun tabanlı bir öğrenme
            deneyimi sunuyoruz.
          </p>

          <div className="team-summary">
            <span className="eyebrow">ATLAS EKİBİ</span>
            <p>
              Üç kişilik çekirdek ekibimiz, bir edtech ürününün üç kritik
              ayağını — mühendislik, pedagoji ve tasarımı — doğrudan
              karşılıyor. Denge Kasabası'nın fikirden oynanabilir iki sürüme
              uzanan geliştirmesi bu ekibin işi.
            </p>
          </div>

          <div className="team-grid" data-reveal-group>
            <article className="team-card">
              <img
                className="team-avatar team-avatar--photo"
                src="/images/team/huseyin.jpg"
                alt="Hüseyin Deniz"
                loading="lazy"
              />
              <h3>Hüseyin Deniz</h3>
              <p className="team-role">Kurucu · Ürün &amp; Yazılım</p>
              <p>
                Ürün vizyonu, teknik mimari ve oyunun geliştirme sürecini
                yürütür; Denge Kasabası'nın oynanabilir prototipinden canlı ön
                gösterime uzanan mühendisliğin sahibi.
              </p>
            </article>

            <article className="team-card">
              <img
                className="team-avatar team-avatar--photo"
                src="/images/team/fadime.jpg"
                alt="Fadime Aksoy"
                loading="lazy"
              />
              <h3>Fadime Aksoy</h3>
              <p className="team-role">Pedagoji &amp; Öğrenme Tasarımı</p>
              <p>
                Öğrenme hedeflerini oyun mekaniklerine çevirir; kanıt
                değerlendirme ve yansıtma döngüsünün pedagojik temellerini
                kurar.
              </p>
            </article>

            <article className="team-card">
              <img
                className="team-avatar team-avatar--photo"
                src="/images/team/deniz.jpg"
                alt="Deniz Aşçıoğlu"
                loading="lazy"
              />
              <h3>Deniz Aşçıoğlu</h3>
              <p className="team-role">Tasarım &amp; Deneyim</p>
              <p>
                Görsel dünya, karakter tasarımı ve çocukların kolay
                anlayabileceği arayüz akışlarından sorumlu.
              </p>
            </article>
          </div>

          <div className="team-summary team-summary--accent">
            <span className="eyebrow">MİSYONUMUZ</span>
            <p>
              Çocuklara sadece içerik sunmak değil; onları düşünmeye, kanıtları
              değerlendirmeye, karar vermeye ve kararlarını sorgulamaya teşvik
              eden eğitim teknolojileri geliştirmek.
            </p>
          </div>

          <div className="team-summary team-summary--accent">
            <span className="eyebrow">VİZYONUMUZ</span>
            <p>
              Yaşadığı dünyayı anlayan, kanıta dayalı düşünen ve geleceği
              şekilliren bir nesil — Türkiye&apos;den çıkan, dünya standartlarında
              oyun tabanlı öğrenme deneyimleri.
            </p>
          </div>
        </div>
      </section>

      <section className="chars" aria-labelledby="chars-title">
        <div className="container">
          <div className="section-heading" data-reveal>
            <div>
              <Eyebrow>KASABANIN SAKİNLERİ</Eyebrow>
              <h2>
                Kasabada tanışacağın
                <br />
                <em>sesler.</em>
              </h2>
            </div>
            <p>
              Her karakter farklı bir çıkar, farklı bir gündem, farklı bir
              kanıt taşır. Karar verirken hepsi masada olacak.
            </p>
          </div>
          <div className="chars-grid" data-reveal-group>
            <figure className="char-card">
              <div className="char-fig char-lina">
                <img
                  src="/images/char-lina.png"
                  alt="Lina karakteri"
                />
              </div>
              <figcaption>
                <strong>Lina</strong>
                <span>Senin Rehberin</span>
                <p>“Kasabayı gezelim, önce kimlerin ne istediğine bakalım.”</p>
              </figcaption>
            </figure>
            <figure className="char-card">
              <div className="char-fig char-riza">
                <img
                  src="/images/char-riza.png"
                  alt="Çiftçi Rıza karakteri"
                />
              </div>
              <figcaption>
                <strong>Çiftçi Rıza</strong>
                <span>Tarım Kestanesi</span>
                <p>“Su kesilirse mahsul gider, mahsul giderse kasaba aç kalır.”</p>
              </figcaption>
            </figure>
            <figure className="char-card">
              <div className="char-fig char-aylin">
                <img
                  src="/images/char-aylin.png"
                  alt="Mühendis Aylin karakteri"
                />
              </div>
              <figcaption>
                <strong>Mühendis Aylin</strong>
                <span>Altyapı ve Kanıt</span>
                <p>“Hissetmek yetmez; veri, ölçüm ve planla konuşuruz.”</p>
              </figcaption>
            </figure>
            <figure className="char-card">
              <div className="char-fig char-nuri">
                <img
                  src="/images/char-nuri.png"
                  alt="Nuri Amca karakteri"
                />
              </div>
              <figcaption>
                <strong>Nuri Amca</strong>
                <span>Kasabanın Hafızası</span>
                <p>“Ben bu kasabada üç kuraklık gördüm; üçü de aynı hatayla başladı.”</p>
              </figcaption>
            </figure>
          </div>
          <div className="chars-cta" data-reveal>
            <a className="button primary" href="/denge-kasabasi">
              Kasabayı Ziyaret Et <Arrow />
            </a>
          </div>
        </div>
      </section>

      <section className="section container" id="urun">
        <div className="section-heading" data-reveal>
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
        <article className="product-feature" data-reveal>
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
            <div className="version-chips">
              <span>v1 · ETKİM başvuru sürümü</span>
              <span>v2 · Ön gösterim</span>
            </div>
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
      <section id="nasil-oynanir" className="section container how-to">
        <div className="section-heading" data-reveal>
          <div>
            <Eyebrow>NASIL OYNANIR?</Eyebrow>
            <h2>
              Bir kasabanın geleceği,
              <br />
              <em>kararlarınla şekillenir.</em>
            </h2>
          </div>
          <p>
            Oyun, tek bir doğru cevap bulmak için değil; farklı kaynakları
            değerlendirmek ve sonuçlarını görmek için tasarlandı.
            <span className="flow-note">
              Aşağıdaki akış yayınlanan sürüme aittir. Ön gösterim sürümünde
              profil ekranı, yenilenen belediye toplantısı ve duyuru turuyla
              akış genişledi.
            </span>
          </p>
        </div>

        <div className="how-to-pin">
          <div className="how-to-progress" aria-hidden="true">
            <span />
          </div>
          <div className="how-to-tutorial">
          <article className="tutorial-step">
            <div className="tutorial-copy">
              <span className="step-number">01</span>
              <h3>Görev &amp; Öğrenci Profili</h3>
              <p>
                Kullanıcı oyuna girdiğinde kendi adını ve karakter avatarını
                seçer. Rehber Lina ile tanışır ve kasabanın mevcut su krizini,
                ekonomik ve çevresel dengesini netleştirir.
              </p>
              <ul>
                <li>Öğrenci profilini oluşturur</li>
                <li>Kasabanın kriz durumunu öğrenir</li>
                <li>Rehber Lina eşliğinde göreve başlar</li>
              </ul>
            </div>
            <figure className="tutorial-visual">
              <div className="screen-label">Giriş &amp; Profil</div>
              <img
                src="/images/v2-lina-map.png"
                alt="Denge Kasabası v2 sinematik giriş ve profil ekranı."
              />
              <figcaption className="tutorial-caption">
                <span>Adım</span>
                <strong>Profilini oluştur, görevi oku ve problemi tanı.</strong>
              </figcaption>
            </figure>
          </article>

          <article className="tutorial-step">
            <div className="tutorial-copy">
              <span className="step-number">02</span>
              <h3>Kasabada Canlı Keşif</h3>
              <p>
                Kullanıcı kasabanın sokaklarını adımlar. Baraj, konutlar, tarım
                alanları ve belediyeyi gezer; Nuri Amca&apos;nın sokağındaki patlak
                boruyu ve fışkıran suyu yerinde inceler.
              </p>
              <ul>
                <li>Sokakları serbestçe gezer ve tanıklarla konuşur</li>
                <li>Su kaynaklarını ve yaşam alanlarını inceler</li>
                <li>Kritik kaçak ve kuraklık noktalarını deftere kaydeder</li>
              </ul>
            </div>
            <figure className="tutorial-visual">
              <div className="screen-label">Canlı Keşif</div>
              <img
                src="/images/v2-before-leak.png"
                alt="Denge Kasabası canlı keşif: sokaktaki patlak boru ve Nuri Amca."
              />
              <figcaption className="tutorial-caption">
                <span>Adım</span>
                <strong>Kasabayı gez, patlak boruyu ve tanıkları bul.</strong>
              </figcaption>
            </figure>
          </article>

          <article className="tutorial-step">
            <div className="tutorial-copy">
              <span className="step-number">03</span>
              <h3>Kanıtlar &amp; Belediye Meclisi</h3>
              <p>
                Mühendis Aylin&apos;in baraj ölçüm verilerini ve uzman görüşlerini
                inceler. Belediye Meclisi&apos;nde ₺1.000.000 bütçeyle en etkili
                çözüm paketini seçer ve gerekçelendirir.
              </p>
              <ul>
                <li>Veri grafiklerini ve kanıt kartlarını değerlendirir</li>
                <li>₺1.000.000 bütçeyle önceliklendirme yapar</li>
                <li>Kararını savunacak gerekçeyi belirler</li>
              </ul>
            </div>
            <figure className="tutorial-visual">
              <div className="screen-label">Belediye Meclisi</div>
              <img
                src="/images/v2-gameplay.png"
                alt="Denge Kasabası belediye meclisi ve karar ekranı."
              />
              <figcaption className="tutorial-caption">
                <span>Adım</span>
                <strong>Kanıtları topla, bütçeyle meclis kararını oluştur.</strong>
              </figcaption>
            </figure>
          </article>

          <article className="tutorial-step">
            <div className="tutorial-copy">
              <span className="step-number">04</span>
              <h3>Uygulama: 30 Gün İlerler</h3>
              <p>
                Plan onaylandıktan sonra zaman hızla ilerler (TimeShift). 7., 15.
                ve 30. gün duraklarında şantiyeler kurulur, işçiler ve makineler
                sahaya iner, uygulama adım adım tamamlanır.
              </p>
              <ul>
                <li>Zaman akışı animasyonuyla ilerleme hissedilir</li>
                <li>Sokaklarda şantiyeler ve onarım çalışmaları başlar</li>
                <li>Halkın tepkisi ve gelişmeler takip edilir</li>
              </ul>
            </div>
            <figure className="tutorial-visual">
              <div className="screen-label">30 Gün Sonra</div>
              <img
                src="/images/v2-repair-crew.jpg"
                alt="Denge Kasabası sokak onarım şantiyesi ve işçiler."
              />
              <figcaption className="tutorial-caption">
                <span>Adım</span>
                <strong>Zaman ilerler: şantiyeler kurulur ve uygulama tamamlanır.</strong>
              </figcaption>
            </figure>
          </article>

          <article className="tutorial-step">
            <div className="tutorial-copy">
              <span className="step-number">05</span>
              <h3>Fiziksel Kasaba Dönüşümü</h3>
              <p>
                30 gün sonunda kararın somut etkisi kasaba haritasına yansır.
                Patlak boru yeni asfalt yamasıyla onarılmış, tarlalara damla
                sulama hatları döşenmiştir.
              </p>
              <ul>
                <li>Fiziksel kasaba haritasındaki görsel dönüşümü görür</li>
                <li>Su, çevre, ekonomi ve toplum dengesini inceler</li>
                <li>Sistemin bir bütün olarak tepkisini kavrar</li>
              </ul>
            </div>
            <figure className="tutorial-visual">
              <div className="screen-label">Dönüşüm Sonucu</div>
              <img
                src="/images/v2-after-leak.png"
                alt="Denge Kasabası dönüşüm sonucu: onarılan sokak ve yeni asfalt yaması."
              />
              <figcaption className="tutorial-caption">
                <span>Adım</span>
                <strong>Kararın kasabaya fiziksel etkisini ve yeni dengeyi gör.</strong>
              </figcaption>
            </figure>
          </article>

          <article className="tutorial-step">
            <div className="tutorial-copy">
              <span className="step-number">06</span>
              <h3>Öğrenci &amp; Oturum Raporu</h3>
              <p>
                Süreç sonunda toplanan kanıtlar, bütçe kullanımı ve yansıtma
                kararları hem öğrenci karnesine hem de öğretmen ve veliler için
                açık değerlendirme raporuna dönüşür.
              </p>
              <ul>
                <li>Öğrenci karnesinde güçlü yönleri ve kararları görür</li>
                <li>Öğretmenler oturumun pedagojik izlerini inceler</li>
                <li>İstenirse alternatif bir planla deneyim tekrarlanabilir</li>
              </ul>
            </div>
            <figure className="tutorial-visual">
              <div className="screen-label">Raporlama</div>
              <img
                src="/images/v2-mayor-council.jpg"
                alt="Denge Kasabası belediye başkanı ve oturum raporlama."
              />
              <figcaption className="tutorial-caption">
                <span>Özellik</span>
                <strong>Süreç analizi, öğrenci ve öğretmen raporuyla kalıcı öğrenmeye dönüşür.</strong>
              </figcaption>
            </figure>
          </article>
          </div>
        </div>

        <div className="how-to-cta" data-reveal>
          <p>
            Kısacası: çocuk haritayı inceler, kanıtları okur, karar verir ve
            sonuçları sorgular.
          </p>
          <a className="text-link" href="/denge-kasabasi">
            Demoyu kendi başına deneyimle <Arrow />
          </a>
        </div>
      </section>

      <section id="yaklasimimiz" className="approach section">
        <div className="container">
          <div className="section-heading" data-reveal>
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
          <div className="system-map">
            <span className="system-label">BİR KARAR, BİRDEN FAZLA ETKİ</span>
            <div className="system-flow">
              <span className="sys-node sys-su">Su</span>
              <span className="sys-link" />
              <span className="sys-node sys-butce">Bütçe</span>
              <span className="sys-link" />
              <span className="sys-node sys-tarim">Tarım</span>
              <span className="sys-link" />
              <span className="sys-node sys-cevre">Çevre</span>
            </div>
          </div>
          <div className="approach-grid" data-reveal-group>
            {approaches.map(([title, lead, body], i) => (
              <article key={title}>
                <span className="index">0{i + 1}</span>
                <h3>{title}</h3>
                <p className="lead">{lead}</p>
                <p>{body}</p>
              </article>
            ))}
          </div>
          <p className="method-note" data-reveal>
            Bunlar tasarımımızın pedagojik hedefleridir. Öğrenme etkisinin
            kullanıcı testleri ve pedagojik pilotlarla değerlendirilmesi
            hedeflenmektedir.
          </p>
        </div>
      </section>
      <section className="roadmap container" aria-label="Yol haritası">
        <div className="section-heading" data-reveal>
          <div>
            <Eyebrow>YOL HARİTASI</Eyebrow>
            <h2>
              Bugünden başlayan,
              <br />
              adım adım büyüyen bir yol.
            </h2>
          </div>
          <p>
            Atlas için oyun bir ürün değil, bir öğrenme modeli. Denge Kasabası
            bu modelin ilk kanıtı; her adımı gerçek kullanıcılarla
            doğrulamayı hedefliyoruz.
          </p>
        </div>
        <ol className="roadmap-steps" data-reveal-group>
          <li className="done">
            <span className="step-dot" aria-hidden="true" />
            <strong>Oynanabilir prototip</strong>
            <span>Yayında — tarayıcıda ücretsiz demo</span>
          </li>
          <li className="done">
            <span className="step-dot" aria-hidden="true" />
            <strong>Yeni sürüm ön gösterimi</strong>
            <span>Yeni harita, karakterler ve görev akışı</span>
          </li>
          <li className="done">
            <span className="step-dot" aria-hidden="true" />
            <strong>Sonuç ekranı &amp; 30 gün raporu</strong>
            <span>Yayında — “30 gün sonra” (TimeShift), kasaba dönüşümü ve oturum değerlendirmesi</span>
          </li>
          <li>
            <span className="step-dot" aria-hidden="true" />
            <strong>Pilot okul çalışmaları</strong>
            <span>Sınıf içi kullanım ve pedagojik etki ölçümü</span>
          </li>
          <li>
            <span className="step-dot" aria-hidden="true" />
            <strong>Öğretmen araçları</strong>
            <span>Rehber, oturum özetleri ve kurumsal lisanslama</span>
          </li>
          <li>
            <span className="step-dot" aria-hidden="true" />
            <strong>Yeni öğrenme dünyaları</strong>
            <span>Enerji, atık, gıda ve kent temaları</span>
          </li>
        </ol>
      </section>
      <section id="gelecek" className="section container">
        <div className="section-heading" data-reveal>
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
        <div className="future-grid" data-reveal-group>
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
        <p className="method-note" data-reveal>
          Denge Kasabası tek başına son ürün değil; uzun vadede ortak bir Atlas
          hesabı ve öğretmen araçlarıyla birleşen bir öğrenme dünyası vizyonunun
          ilk adımıdır.
        </p>
      </section>
      <section className="trust" aria-label="Güven ve etik">
        <div className="container trust-inner" data-reveal-group>
          <div className="trust-head">
            <Eyebrow>GÜVENLE TASARLANDI</Eyebrow>
            <h2>
              Çocuklar keşfederken,
              <br />
              yetişkinlerin içi rahat olsun.
            </h2>
          </div>
          <ul className="trust-grid">
            <li>
              <strong>Reklamsız deneyim</strong>
              <span>Reklam, satın alma yönlendirmesi ve dikkat tuzakları yok.</span>
            </li>
            <li>
              <strong>Veri toplamayan tasarım</strong>
              <span>Oturum yalnızca tarayıcıda tutulur; kişisel veri sunucuya gönderilmez.</span>
            </li>
            <li>
              <strong>Yaşa uygun içerik</strong>
              <span>10–12 yaş için tasarlanmış dil, tempo ve görsel dünya.</span>
            </li>
            <li>
              <strong>Öğretmen gözetiminde kurgu</strong>
              <span>Sınıf içi tartışma ve değerlendirmeyle birlikte önerilir.</span>
            </li>
          </ul>
        </div>
      </section>
      <section id="egitimciler" className="educators container">
        <div data-reveal>
          <Eyebrow>EĞİTİMCİLER VE KURUMLAR İÇİN</Eyebrow>
          <h2>
            Oyunda başlayan sorular,
            <br />
            sınıfta derinleşen düşünceler.
          </h2>
        </div>
        <div data-reveal>
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
          <div className="pilot-cta">
            <strong>Pilot programı</strong>
            <p>
              Sınıfında denemek isteyen okullarla küçük ölçekli pilot
              çalışmalar planlıyoruz. İlk pilot okullardan biri olmak
              isterseniz yazın.
            </p>
            <a
              className="button primary"
              href={`mailto:${site.email}?subject=${encodeURIComponent("Denge Kasabası Pilot Programı")}`}
            >
              Pilot okul olmak istiyoruz <Arrow />
            </a>
          </div>
        </div>
      </section>
      <section id="kurumlar" className="section container partners-teaser">
        <div className="section-heading" data-reveal>
          <div>
            <Eyebrow>KURUMLARLA İŞ BİRLİĞİ</Eyebrow>
            <h2>
              Öğrenme dünyalarını
              <br />
              <em>birlikte kuralım.</em>
            </h2>
          </div>
          <p>
            Belediyeler, şirketler, üniversiteler ve STK&apos;lar için sponsorlu
            senaryolar ve kuruma özel öğrenme deneyimleri tasarlıyoruz.
          </p>
        </div>
        <div className="partner-cards" data-reveal-group>
          {partnerModels.slice(0, 3).map(([title, lead, body]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p className="lead">{lead}</p>
              <p>{body}</p>
            </article>
          ))}
        </div>
        <p className="method-note" data-reveal>
          Bunlar hedeflediğimiz iş birliği modelleridir; kapsam ve koşullar
          kurum görüşmeleriyle şekillenir.
        </p>
        <a className="text-link" href="/kurumlar" data-reveal>
          İş birliği olanaklarını inceleyin <Arrow />
        </a>
      </section>
      <Contact />
      <VideoModal
        isOpen={trailerOpen}
        onClose={() => setTrailerOpen(false)}
      />
    </div>
  );
}
