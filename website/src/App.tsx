import { useEffect, useRef, useState } from "react";
import { site, pages } from "./config";
import { approaches, futureAreas, flow } from "./content";
import { gsap, prefersReducedMotion, startSmoothScroll } from "./motion";

function Arrow({ external = false }: { external?: boolean }) {
  return <span aria-hidden="true">{external ? "↗" : "↗"}</span>;
}
function DemoLink({ light = false }: { light?: boolean }) {
  return (
    <a
      className={`button ${light ? "light" : "primary"}`}
      href={site.demoUrl}
      target="_blank"
      rel="noreferrer"
    >
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
  ["Denge Kasabası", "/denge-kasabasi"],
  ["Yaklaşımımız", "/#yaklasimimiz"],
  ["Ekip", "/#hakkimizda"],
  ["Eğitimciler", "/#egitimciler"],
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
              {label === "Denge Kasabası" && (
                <span className="nav-badge">YENİ</span>
              )}
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
        <div data-reveal>
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
        <a className="contact-link" href={`mailto:${site.email}`} data-reveal>
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
      <div className="footer-cols">
        <div className="footer-links">
          <span className="footer-head">ÜRÜN</span>
          <a href="/denge-kasabasi">Denge Kasabası</a>
          <a href="/denge-kasabasi/oyna/">Başvuru sürümü (v1)</a>
          <a href="/denge-kasabasi/ongosteri/">Ön gösterim (v2)</a>
        </div>
        <div className="footer-links">
          <span className="footer-head">ŞİRKET</span>
          <a href="/#hakkimizda">Hakkımızda &amp; Ekip</a>
          <a href="/#yaklasimimiz">Öğrenme yaklaşımımız</a>
          <a href={`mailto:${site.email}`}>
            Bize yazın <Arrow />
          </a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Atlas Learning Technologies · Türkiye</span>
        <span>Çerez ve izleme araçları kullanılmaz.</span>
      </div>
    </footer>
  );
}
function splitWords(el: HTMLElement) {
  Array.from(el.childNodes).forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const frag = document.createDocumentFragment();
      (node.textContent || "").split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(part));
        } else {
          const s = document.createElement("span");
          s.className = "w";
          s.textContent = part;
          frag.appendChild(s);
        }
      });
      node.replaceWith(frag);
    } else if (node instanceof HTMLElement && node.tagName !== "BR") {
      splitWords(node);
    }
  });
}
function useReveals(root: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.from(el, {
          y: 46,
          opacity: 0,
          duration: 0.85,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        });
      });
      gsap.utils.toArray<HTMLElement>("[data-reveal-group]").forEach((group) => {
        gsap.from(group.children, {
          y: 40,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.09,
          scrollTrigger: { trigger: group, start: "top 82%", once: true },
        });
      });
    }, root);
    return () => ctx.revert();
  }, [root]);
}
function useSeqAnimations(
  root: React.RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const seq = root.current?.querySelector<HTMLElement>(".seq");
      const map = root.current?.querySelector<HTMLElement>(".seq-map");
      if (!seq || !map) return;
      const W = () => map.offsetWidth;
      const H = () => map.offsetHeight;
      const cam = (px: number, py: number, s: number) => ({
        x: () => (0.5 - px) * W() * s,
        y: () => (0.5 - py) * H() * s,
        scale: s,
        ease: "power1.inOut" as const,
      });
      const fit = () =>
        Math.min(window.innerWidth / W(), window.innerHeight / H());
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: seq,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
      tl.fromTo(
        map,
        { x: 0, y: 0, scale: () => fit() * 0.92 },
        { x: 0, y: 0, scale: () => fit() * 0.92, duration: 0.01 },
        0,
      );
      tl.to(map, { ...cam(0.5, 0.13, 2.4), duration: 3 }, 2)
        .to(map, { ...cam(0.16, 0.47, 2.4), duration: 3 }, 6)
        .to(map, { ...cam(0.5, 0.5, 2.6), duration: 3 }, 10)
        .to(map, { ...cam(0.84, 0.5, 2.4), duration: 3 }, 14)
        .to(map, { ...cam(0.5, 0.88, 2.4), duration: 3 }, 18)
        .to(map, { ...cam(0.5, 0.5, 1.35), duration: 3 }, 22);
      const beats: [string, number, number][] = [
        [".seq-t1", 0.3, 1.8],
        [".seq-t2", 3.4, 5.4],
        [".seq-t3", 7.4, 9.4],
        [".seq-t4", 11.4, 13.4],
        [".seq-t5", 15.4, 17.4],
        [".seq-t6", 19.4, 21.4],
        [".seq-end", 22.6, 25],
      ];
      beats.forEach(([sel, at, out]) => {
        tl.fromTo(
          sel,
          { opacity: 0, y: 44 },
          { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
          at,
        );
        if (out < 24) {
          tl.to(
            sel,
            { opacity: 0, y: -32, duration: 0.5, ease: "power2.in" },
            out,
          );
        }
      });
      tl.to(".seq-hint", { opacity: 0, duration: 0.4 }, 0.8);
    }, root);
    return () => ctx.revert();
  }, [root]);
}
function useHomeAnimations(
  root: React.RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const cleanups: (() => void)[] = [];
    const ctx = gsap.context(() => {
      gsap.from(".hero-copy > *", {
        y: 42,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.09,
      });
      gsap.from(".hero-art", {
        y: 70,
        opacity: 0,
        duration: 1.05,
        ease: "power3.out",
        delay: 0.15,
      });
      gsap.to(".hero-art > img", {
        yPercent: 8,
        scale: 1.06,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
      const manifesto =
        root.current?.querySelector<HTMLElement>(".intro-inner h2");
      if (manifesto) {
        splitWords(manifesto);
        gsap.fromTo(
          manifesto.querySelectorAll(".w"),
          { opacity: 0.2 },
          {
            opacity: 1,
            stagger: 0.05,
            ease: "none",
            scrollTrigger: {
              trigger: manifesto,
              start: "top 82%",
              end: "top 35%",
              scrub: true,
            },
          },
        );
      }
      const sysMap =
        root.current?.querySelector<HTMLElement>(".system-map");
      if (sysMap) {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: sysMap, start: "top 82%", once: true },
        });
        tl.from(sysMap.querySelectorAll(".sys-node"), {
          scale: 0.5,
          opacity: 0,
          duration: 0.5,
          ease: "back.out(2)",
          stagger: 0.18,
        }).from(
          sysMap.querySelectorAll(".sys-link"),
          {
            scaleX: 0,
            duration: 0.45,
            ease: "power2.out",
            stagger: 0.18,
          },
          0.2,
        );
      }
      const props = gsap.utils.toArray<HTMLElement>(".hero-prop");
      const hero = root.current?.querySelector<HTMLElement>(".hero");
      if (hero && props.length) {
        const depths = [34, -22, 26];
        const qx = props.map((prop) =>
          gsap.quickTo(prop, "x", { duration: 0.9, ease: "power3.out" }),
        );
        const qy = props.map((prop) =>
          gsap.quickTo(prop, "y", { duration: 0.9, ease: "power3.out" }),
        );
        const onMove = (e: MouseEvent) => {
          const r = hero.getBoundingClientRect();
          const nx = (e.clientX - r.left) / r.width - 0.5;
          const ny = (e.clientY - r.top) / r.height - 0.5;
          props.forEach((prop, i) => {
            const d = depths[i % depths.length];
            qx[i](nx * d);
            qy[i](ny * d * 0.7);
          });
        };
        hero.addEventListener("mousemove", onMove);
        cleanups.push(() => hero.removeEventListener("mousemove", onMove));
      }
      const tiltCards = gsap.utils.toArray<HTMLElement>(
        ".future-grid article, .team-card",
      );
      tiltCards.forEach((card) => {
        const rx = gsap.quickTo(card, "rotationX", {
          duration: 0.6,
          ease: "power3.out",
        });
        const ry = gsap.quickTo(card, "rotationY", {
          duration: 0.6,
          ease: "power3.out",
        });
        const onTilt = (e: MouseEvent) => {
          const r = card.getBoundingClientRect();
          ry(((e.clientX - r.left) / r.width - 0.5) * 10);
          rx(-((e.clientY - r.top) / r.height - 0.5) * 10);
        };
        const onLeave = () => {
          rx(0);
          ry(0);
        };
        card.addEventListener("mousemove", onTilt);
        card.addEventListener("mouseleave", onLeave);
        cleanups.push(() => {
          card.removeEventListener("mousemove", onTilt);
          card.removeEventListener("mouseleave", onLeave);
        });
      });
      const mm = gsap.matchMedia();
      mm.add("(min-width: 900px)", () => {
        const pinEl =
          root.current?.querySelector<HTMLElement>(".how-to-pin");
        const track =
          root.current?.querySelector<HTMLElement>(".how-to-tutorial");
        const bar = root.current?.querySelector<HTMLElement>(
          ".how-to-progress span",
        );
        if (!pinEl || !track) return;
        const distance = () =>
          Math.max(track.scrollWidth - window.innerWidth + 48, 0);
        gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: pinEl,
            start: "top top+=92",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });
        if (bar) {
          gsap.to(bar, {
            scaleX: 1,
            ease: "none",
            scrollTrigger: {
              trigger: pinEl,
              start: "top top+=92",
              end: () => `+=${distance()}`,
              scrub: 1,
              invalidateOnRefresh: true,
            },
          });
        }
      });
    }, root);
    return () => {
      ctx.revert();
      cleanups.forEach((fn) => fn());
    };
  }, [root]);
}
function SeqCinematic() {
  return (
    <section className="seq" aria-label="Denge Kasabası tanıtım sekansı">
      <div className="seq-stage">
        <img
          className="seq-map"
          src="/images/denge-world-map.png"
          alt="Denge Kasabası haritası; baraj, tarım arazileri, park, evler ve belediye"
        />
        <div className="seq-vignette" aria-hidden="true" />
        <div className="seq-text seq-t1">
          <span className="seq-eyebrow">İLK ÜRÜNÜMÜZ · İLK SENARYO</span>
          <h1>Denge Kasabası</h1>
          <p>Su Krizi — bir kasaba, birbirine bağlı birçok karar.</p>
        </div>
        <div className="seq-text seq-t2">
          <h2>Su azalıyor.</h2>
          <p>Kasabanın en değerli kaynağı tehlikede.</p>
        </div>
        <div className="seq-text seq-t3">
          <span className="seq-char char-riza" aria-hidden="true">
            <img src="/images/char-riza.png" alt="" />
          </span>
          <h2>Tarım susuz kalırsa?</h2>
          <p>Çiftçi Rıza’nın tarlaları senin kararlarına bağlı.</p>
        </div>
        <div className="seq-text seq-t4">
          <span className="seq-char char-aylin" aria-hidden="true">
            <img src="/images/char-aylin.png" alt="" />
          </span>
          <h2>Kanıt her yerde.</h2>
          <p>Mühendis Aylin’in raporları, uzman görüşleri, ölçüm verileri.</p>
        </div>
        <div className="seq-text seq-t5">
          <span className="seq-char char-nuri" aria-hidden="true">
            <img src="/images/char-nuri.png" alt="" />
          </span>
          <h2>Herkes bir paydaş.</h2>
          <p>Nuri Amca gibi kasabalıların ihtiyaçlarını dinle.</p>
        </div>
        <div className="seq-text seq-t6">
          <h2>Karar senin.</h2>
          <p>
            Kanıtı değerlendir, planını kur,
            <br />
            kasabanın dengesini koru.
          </p>
        </div>
        <div className="seq-text seq-end">
          <p className="seq-eyebrow">OYUNLA KEŞFET · KANITLA DÜŞÜN</p>
          <h2>Kasabanın ilk kararını sen ver.</h2>
          <div className="seq-actions">
            <a className="button primary" href={site.demoUrl}>
              Demoyu Oyna <Arrow />
            </a>
          </div>
          <span className="seq-note">
            Oynanabilir prototip · 10–12 yaş için tasarlandı
          </span>
        </div>
        <span className="seq-hint" aria-hidden="true">
          KAYDIR ↓
        </span>
      </div>
    </section>
  );
}
function Home() {
  const root = useRef<HTMLDivElement>(null);
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
            <a className="button light" href="#nasil-oynanir">
              Nasıl Oynanır? (2 Dk)
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
            <figure className="char-card">
              <span className="soon-badge">YAKINDA</span>
              <div className="char-fig char-betul">
                <img
                  src="/images/char-betul.png"
                  alt="Dr. Betül karakteri"
                />
              </div>
              <figcaption>
                <strong>Dr. Betül</strong>
                <span>Kasabanın Doktoru</span>
                <p>“Sağlıklı bir kasaba temiz suyla başlar — değerleri takip et!”</p>
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
              <h3>Görev başlatılır</h3>
              <p>
                Kullanıcı oyuna girdiğinde karşısına kasabanın mevcut sorunu ve
                hedefi çıkar. Bu ekran, “neden bu kararı veriyoruz?” sorusunu
                netleştirir ve oyuncunun odak noktasını belirler.
              </p>
              <ul>
                <li>Görevi okur</li>
                <li>Kasabanın ana sorunu anlar</li>
                <li>Bu probleme çözüm aramaya başlar</li>
              </ul>
            </div>
            <figure className="tutorial-visual">
              <div className="screen-label">Giriş ekranı</div>
              <img
                src="/denge-kasabasi/oyna/assets/town-intro.jpg"
                alt="Denge Kasabası görev başlatma ekranı; kullanıcı oyuna başlıyor ve kasabanın su krizini okuyup başlayacak."
              />
              <figcaption className="tutorial-caption">
                <span>Adım</span>
                <strong>Görevi oku ve problemi tanı.</strong>
              </figcaption>
            </figure>
          </article>

          <article className="tutorial-step">
            <div className="tutorial-copy">
              <span className="step-number">02</span>
              <h3>Haritada araştırma yapılır</h3>
              <p>
                Ardından kullanıcı kasabanın haritasını inceler. Baraj, evler,
                tarım alanları ve belediye gibi alanlara tek tek bakar. Burada neyin
                suya daha çok ihtiyaç duyduğunu görmeye başlar.
              </p>
              <ul>
                <li>Bölgeleri tek tek açar</li>
                <li>Su kaynaklarını ve yaşam alanlarını karşılaştırır</li>
                <li>En kritik alanı belirler</li>
              </ul>
            </div>
            <figure className="tutorial-visual">
              <div className="screen-label">Harita ekranı</div>
              <img
                src="/images/game-map.png"
                alt="Denge Kasabası harita ekranı; kullanıcının bölgeleri tıklayıp kasabayı gezmesi gerekir."
              />
              <figcaption className="tutorial-caption">
                <span>Adım</span>
                <strong>Kasabayı gezip sorunlu alanı bul.</strong>
              </figcaption>
            </figure>
          </article>

          <article className="tutorial-step">
            <div className="tutorial-copy">
              <span className="step-number">03</span>
              <h3>Kanıtlar toplanır ve incelenir</h3>
              <p>
                Seçilen alan için kullanıcı görüşme, maliyet, kullanım ve risk
                bilgilerini ortaya çıkarır. Bu ekran, karar vermeden önce veri ve
                kanıtları anlamanın ne kadar önemli olduğunu gösterir.
              </p>
              <ul>
                <li>Kaynak ve bilgi kartlarını okur</li>
                <li>Seçenekleri karşılaştırır</li>
                <li>En etkili çözüm için mantık kurar</li>
              </ul>
            </div>
            <figure className="tutorial-visual">
              <div className="screen-label">Bilgi ekranı</div>
              <img
                src="/images/game-plan.png"
                alt="Denge Kasabası bilgi kartları ekranı; kullanıcı kanıtları okur ve karşılaştırır."
              />
              <figcaption className="tutorial-caption">
                <span>Adım</span>
                <strong>Kanıtları oku ve çözüm seçeneklerini kıyasla.</strong>
              </figcaption>
            </figure>
          </article>

          <article className="tutorial-step">
            <div className="tutorial-copy">
              <span className="step-number">04</span>
              <h3>Plan oluşturulur</h3>
              <p>
                Kullanıcı, mevcut seçeneklerden uygun müdahaleleri seçerek bir plan
                oluşturur. Burada kararlar sadece tek tek değil, birlikte kasabanın
                geleceğini şekillendirir.
              </p>
              <ul>
                <li>Çözüm adımlarını seçer</li>
                <li>Ek maliyet ve etkiyi görür</li>
                <li>Planı kaydeder ve ilerler</li>
              </ul>
            </div>
            <figure className="tutorial-visual">
              <div className="screen-label">Plan ekranı</div>
              <img
                src="/images/game-plan.png"
                alt="Denge Kasabası plan oluşturma ekranı; kullanıcı müdahale seçeneklerini seçer."
              />
              <figcaption className="tutorial-caption">
                <span>Adım</span>
                <strong>Bir plan oluştur ve seçtiğin adımları uygula.</strong>
              </figcaption>
            </figure>
          </article>

          <article className="tutorial-step">
            <div className="tutorial-copy">
              <span className="step-number">05</span>
              <h3>Karar uygulanır ve değerlendirilir</h3>
              <p>
                Plan onaylandıktan sonra kullanıcı kararının etkisini görür. Bu
                aşamada oyunun en önemli fikri ortaya çıkar: “Karar, sadece bir
                seçenek değil; bütün sistemi etkiler.”
              </p>
              <ul>
                <li>Kararını uygular</li>
                <li>Sonuç çıktısını inceler</li>
                <li>Etkiyi yorumlar</li>
              </ul>
            </div>
            <figure className="tutorial-visual">
              <div className="screen-label">Sonuç ekranı</div>
              <div className="result-visual" aria-label="Denge Kasabası sonuç ekranı görseli">
                <div className="result-header">
                  <span>SONUÇLAR &amp; YENİ BİLGİ</span>
                  <strong>FİNAL SONUÇ</strong>
                </div>
                <div className="result-metrics">
                  <div className="result-card result-water">
                    <label>SU DURUMU</label>
                    <strong>+12</strong>
                    <small>Önce %42 → Sonra %54</small>
                  </div>
                  <div className="result-card result-budget">
                    <label>BÜTÇE</label>
                    <strong>−27</strong>
                    <small>Önce 50 → Sonra 23</small>
                  </div>
                </div>
                <div className="result-secondary">
                  <div className="result-card result-small">
                    <label>TARIM</label>
                    <small>Nitel gözlem</small>
                  </div>
                  <div className="result-card result-small">
                    <label>ÇEVRE</label>
                    <small>Uzun vadeli fayda yüksek</small>
                  </div>
                </div>
                <div className="result-note">
                  Yeni bilgi: Yağmur suyu toplama sistemi kısa vadede beklenenden daha az su sağlayabilir.
                </div>
              </div>
              <figcaption className="tutorial-caption">
                <span>Adım</span>
                <strong>Kararın etkisini gör ve öğren.</strong>
              </figcaption>
            </figure>
          </article>

          <article className="tutorial-step">
            <div className="tutorial-copy">
              <span className="step-number">06</span>
              <h3>Sonuçlar değerlendirilir ve raporlanır</h3>
              <p>
                Sonuç ekranında kullanıcı, önceki adımlara geri dönüp farklı bir
                karar deneyebilir. Aynı zamanda toplanan veriler öğretmenler ve
                velilerle açık şekilde paylaşılabilecek bir rapor haline gelir;
                böylece süreç sadece oyun değil, öğrenme ve izleme aracı olur.
              </p>
              <ul>
                <li>Önceki adımlara geri döner</li>
                <li>Farklı bir seçenek deneyip karşılaştırır</li>
                <li>Sonuçları rapor halinde paylaşabilir</li>
              </ul>
            </div>
            <figure className="tutorial-visual">
              <div className="screen-label">Rapor ekranı</div>
              <img
                src="/images/game-plan.png"
                alt="Denge Kasabası geri dönüp değerlendirme ve raporlama ekranı; kullanıcı kararları ve sonuçları öğretmen ve veliler için paylaşabilir."
              />
              <figcaption className="tutorial-caption">
                <span>Özellik</span>
                <strong>Sonuçlar açık raporla öğretmen ve velilere ulaşır.</strong>
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
          <li>
            <span className="step-dot" aria-hidden="true" />
            <strong>Sonuç ekranı &amp; final raporu</strong>
            <span>“30 gün sonra” sonuçları ve oturum değerlendirmesi</span>
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
      <Contact />
    </div>
  );
}
function Product() {
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
export function App({ path }: { path: string }) {
  const normalized = path.replace(/\/+$/, "") || "/";
  const product = normalized === "/denge-kasabasi";
  const gameRoute =
    normalized === "/denge-kasabasi/oyna" ||
    normalized.startsWith("/denge-kasabasi/oyna/") ||
    normalized === "/denge-kasabasi/ongosteri" ||
    normalized.startsWith("/denge-kasabasi/ongosteri/");
  const known = normalized === "/" || product || gameRoute;
  useEffect(() => {
    startSmoothScroll();
  }, []);
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
