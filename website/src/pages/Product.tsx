import { useEffect, useRef, useState } from "react";
import { flow } from "../content";
import { Arrow } from "../components/Arrow";
import { Contact } from "../components/Contact";
import { DemoLink } from "../components/DemoLink";
import { Eyebrow } from "../components/Eyebrow";
import { SeqCinematic } from "../components/SeqCinematic";
import { useReveals } from "../hooks/useReveals";
import { useSeqAnimations } from "../hooks/useSeqAnimations";

export function Product() {
  const root = useRef<HTMLDivElement>(null);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  useSeqAnimations(root);
  useReveals(root);
  useEffect(() => {
    const img = new Image();
    img.onload = () => setMapReady(true);
    img.onerror = () => setMapReady(true);
    img.src = "/images/denge-world-map.png";
  }, []);

  return (
    <div className="product-page" ref={root}>
      <div
        className={mapReady ? "site-loader done" : "site-loader"}
        aria-hidden={mapReady}
      >
        <span className="loader-brand">
          denge<small>KASABASI</small>
        </span>
        <span className="loader-bar">
          <span />
        </span>
        <span className="loader-note">Kasaba hazırlanıyor…</span>
      </div>
      <SeqCinematic />
      <section className="stats-strip" aria-label="Oyun içeriği özeti">
        <div className="container stats-grid" data-reveal-group>
          <div className="stat">
            <strong>5</strong>
            <span>keşfedilecek bölge</span>
          </div>
          <div className="stat">
            <strong>10+</strong>
            <span>farklı gündemli kasabalı</span>
          </div>
          <div className="stat">
            <strong>5</strong>
            <span>kanıta dayalı müdahale paketi</span>
          </div>
          <div className="stat">
            <strong>4</strong>
            <span>denge ekseni: ev · tarım · doğa · su</span>
          </div>
        </div>
        <p className="container stats-note">
          İçerik sayıları ön gösterim (v2) sürümüne göredir.
        </p>
      </section>
      {noticeOpen && (
        <div
          className="notice-modal"
          onClick={() => setNoticeOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="notice-title"
        >
          <div
            className="notice-modal__panel"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="notice-modal__close"
              aria-label="Duyuruyu kapat"
              onClick={() => setNoticeOpen(false)}
            >
              ×
            </button>
            <img
              className="notice-modal__image"
              src="/images/denge-world-map.png"
              alt="Denge Kasabası genel haritası"
            />
            <span className="notice-modal__eyebrow">DUYURU</span>
            <h2 id="notice-title">Yeni sürüm ön gösterimde!</h2>
            <p>
              ETKİM başvurusunda sunduğumuz sürüm (v1) yayında kalıyor;
              başvurudan bu yana geliştirdiğimiz yeni sürüm (v2) ise ön
              gösterim olarak açık — yeni harita, bölge bazlı ses sistemi,
              gerçek yürüme animasyonları, öğrenci profili, yenilenen belediye
              toplantısı ve duyuru turu içeriyor.
            </p>
            <div className="notice-modal__actions">
              <a
                className="notice-modal__button"
                href="/denge-kasabasi/ongosteri/"
              >
                Ön gösterimi aç <Arrow />
              </a>
              <button
                type="button"
                className="notice-modal__button ghost"
                onClick={() => setNoticeOpen(false)}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="section container product-intro">
        <div data-reveal>
          <a className="breadcrumb" href="/">
            Atlas <span aria-hidden="true">/</span>
          </a>
          <Eyebrow>DENGE KASABASI NEDİR?</Eyebrow>
          <h2>
            Birbiriyle bağlantılı
            <br />
            kararların oyun alanı.
          </h2>
        </div>
        <div data-reveal>
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
          <div className="version-box">
            <div className="version-box__col">
              <span className="vtag">v1 · Başvuru sürümü</span>
              <p>ETKİM başvurusunda sunulan oynanabilir prototip.</p>
              <a href="/denge-kasabasi/oyna/">
                Bu sürümü oyna <Arrow />
              </a>
            </div>
            <div className="version-box__col">
              <span className="vtag new">v2 · Aktif geliştirme</span>
              <p>
                Başvurudan bu yana geliştirmeye devam ettik — yeni harita, ses
                sistemi ve genişleyen akış.
              </p>
              <a href="/denge-kasabasi/ongosteri/">
                Ön gösterimi aç <Arrow />
              </a>
            </div>
          </div>
        </div>
      </section>
      <div className="container notice-slot" data-reveal>
        <div
          className="notice-card"
          onClick={() => setNoticeOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setNoticeOpen(true);
            }
          }}
          role="button"
          tabIndex={0}
        >
          <div className="notice-card__layout">
            <div className="notice-card__content">
              <div className="notice-card__media">
                <img
                  src="/images/denge-world-map.png"
                  alt="Denge Kasabası genel haritası"
                />
              </div>
              <span className="notice-card__eyebrow">DUYURU</span>
              <h3>Yeni sürüm ön gösterimde!</h3>
              <p>
                Başvurudan sonra da durmadık — yeni harita, ses sistemi ve
                genişleyen görev akışıyla v2 ön gösterimi yayında.
              </p>
              <span className="notice-card__cta">Neler değişti?</span>
            </div>
            <div className="notice-card__persona" aria-hidden="true">
              <div className="notice-card__bubble">
                “Yeni haritamız ve yeni senaryolarımız çok yakında burada!”
              </div>
              <img src="/images/lina.png" alt="Lina" />
            </div>
          </div>
        </div>
      </div>
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
            <Eyebrow>MEVCUT DEMONUN İÇİNDEN · v1</Eyebrow>
            <h2>
              Araştır, Karşılaştır
              <br />
              Kendi planını kur
            </h2>
          </div>
          <p>
            Aşağıdaki görseller çalışan yerel demodan alınmıştır. Oyunun mevcut
            arayüzünü gösterir.
          </p>
        </div>
        <div className="screens" data-reveal-group>
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
      <section className="section container v2-shots">
        <div className="section-heading">
          <div>
            <Eyebrow>ÖN GÖSTERİMDEN · v2</Eyebrow>
            <h2>
              Aynı kasaba,
              <br />
              yeni haliyle.
            </h2>
          </div>
          <p>
            Başvurudan sonra geliştirdiğimiz sürümden gerçek ekranlar — yeni
            harita, diyalog sistemi ve canlı kasaba görünümü.
          </p>
        </div>
        <div className="screens screens--wide" data-reveal-group>
          <figure>
            <a
              href="/images/v2-lina-map.png"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/images/v2-lina-map.png"
                loading="lazy"
                alt="Ön gösterim sürümünden sinematik giriş — kasabanın genel görünümü ve Lina; görseli yeni sekmede büyüt"
              />
            </a>
            <figcaption>
              <strong>Sinematik giriş</strong>
              <span>Video ile kasabaya yaklaşma ve rehber Lina ile tanışma.</span>
            </figcaption>
          </figure>
          <figure>
            <a
              href="/images/v2-gameplay.png"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/images/v2-gameplay.png"
                loading="lazy"
                alt="Ön gösterim sürümünden oyun içi görünüm — Merkez Park, diyalog penceresi ve gösterge çubuğu; görseli yeni sekmede büyüt"
              />
            </a>
            <figcaption>
              <strong>Oyun içi görünüm</strong>
              <span>Diyaloglar, görev işaretleri ve denge eksenleri.</span>
            </figcaption>
          </figure>
        </div>
      </section>
      <section className="pedagogy">
        <div className="container pedagogy-inner" data-reveal-group>
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
          <div className="pedagogy-map">
            <span className="pedagogy-map-title">OYUN MEKANİĞİ → BECERİ</span>
            <ul>
              <li>
                <span>Kanıt kartlarını karşılaştırma</span>
                <em>Bilgi okuryazarlığı · kaynak sorgulama</em>
              </li>
              <li>
                <span>Bütçeyle müdahale planı kurma</span>
                <em>Karar verme · önceliklendirme</em>
              </li>
              <li>
                <span>Paydaşları dinleme</span>
                <em>Empati · çoklu perspektif</em>
              </li>
              <li>
                <span>Yeni kanıtla planı revize etme</span>
                <em>Yansıtıcı düşünme · uyum</em>
              </li>
            </ul>
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
        <div className="classroom" data-reveal-group>
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
        <div data-reveal>
          <Eyebrow>DENEYİMİ KEŞFEDİN</Eyebrow>
          <h2>
            Kasabanın ilk kararını
            <br />
            siz verin.
          </h2>
          <p>Su Krizi’nin çalışan prototipini tarayıcınızda deneyin.</p>
        </div>
        <div className="demo-versions">
          <div className="demo-version" data-reveal>
            <span className="vtag">v1 · Başvuru sürümü</span>
            <p>
              ETKİM başvurusunda sunduğumuz oynanabilir prototip — aynen
              başvurudaki haliyle yayında.
            </p>
            <DemoLink light />
            <p className="demo-hint">Bu sitede, yeni sekmede açılır.</p>
          </div>
          <div className="demo-version" data-reveal>
            <span className="vtag new">v2 · Aktif geliştirme</span>
            <p>
              Başvurudan sonra yayınladığımız ön gösterim. Aynı öğrenme
              döngüsü, genişleyen deneyim:
            </p>
            <ul className="whats-new">
              <li>Yeni harita ve bölge bazlı ortam sesleri</li>
              <li>Gerçek yürüme animasyonları ve canlı kasaba</li>
              <li>Öğrenci profili ve oturum kaydı</li>
              <li>Kanıt rozetli belediye toplantısı ve gerekçe adımı</li>
              <li>Planı halka duyurma turu ve yeni karakterler</li>
            </ul>
            <a
              className="button light preview-link"
              href="/denge-kasabasi/ongosteri/"
              target="_blank"
              rel="noreferrer"
            >
              Ön Gösterimi Aç <Arrow />
            </a>
          </div>
        </div>
      </section>
      <Contact />
    </div>
  );
}
