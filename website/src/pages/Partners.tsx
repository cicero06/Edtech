import { useRef } from "react";
import { site } from "../config";
import { partnerModels, partnerAudiences, partnerSteps } from "../content";
import { Arrow } from "../components/Arrow";
import { Contact } from "../components/Contact";
import { Eyebrow } from "../components/Eyebrow";
import { useReveals } from "../hooks/useReveals";

export function Partners() {
  const root = useRef<HTMLDivElement>(null);
  useReveals(root);
  return (
    <div className="partners-page" ref={root}>
      <section className="section container product-intro">
        <div data-reveal>
          <a className="breadcrumb" href="/">
            Atlas <span aria-hidden="true">/</span>
          </a>
          <Eyebrow>KURUMLARLA İŞ BİRLİĞİ</Eyebrow>
          <h1>
            Öğrenme deneyimini
            <br />
            birlikte tasarlayalım.
          </h1>
        </div>
        <div data-reveal>
          <p className="about-lead">
            Atlas&apos;ın oyun tabanlı öğrenme altyapısı; belediyeler,
            şirketler, üniversiteler ve eğitim kurumları için yeni öğrenme
            dünyalarına dönüşebilir.
          </p>
          <p>
            Denge Kasabası ile kurduğumuz harita, senaryo ve görev altyapısını
            yalnızca kendi ürünümüz için değil; ortak bir öğrenme hedefi olan
            kurumlar için de kullanmayı hedefliyoruz. Temel ilkemiz net:
            çocuklara yönelik ekranlarda reklam gösterilmez; kurum katkısı
            &quot;eğitim partnerliği&quot; olarak konumlanır.
          </p>
          <p>
            Bu sayfadaki modeller hedeflediğimiz iş birliği biçimleridir; her
            projenin kapsamı, takvimi ve koşulları kurum görüşmeleriyle
            şekillenir.
          </p>
        </div>
      </section>

      <section className="section container partner-models">
        <div className="section-heading" data-reveal>
          <div>
            <Eyebrow>İŞ BİRLİĞİ MODELLERİ</Eyebrow>
            <h2>
              Birlikte neler
              <br />
              yapabiliriz?
            </h2>
          </div>
          <p>
            Aynı altyapı; farklı kurumlar, farklı temalar ve farklı öğrenme
            hedefleri için yeniden kurgulanabilir.
          </p>
        </div>
        <div className="partner-cards four" data-reveal-group>
          {partnerModels.map(([title, lead, body], i) => (
            <article key={title}>
              <span className="index">0{i + 1}</span>
              <h3>{title}</h3>
              <p className="lead">{lead}</p>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section container partner-fit">
        <div className="partner-fit-inner" data-reveal-group>
          <div>
            <Eyebrow>KİMLERLE?</Eyebrow>
            <h2>
              Ortak bir öğrenme hedefi olan
              <br />
              her kurumla.
            </h2>
            <ul className="partner-audience">
              {partnerAudiences.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
          <div className="partner-example">
            <span className="vtag">ÖRNEK KONSEPT</span>
            <h3>Enerji Kasabası</h3>
            <p>
              Bir enerji şirketiyle geliştirilebilecek sponsorlu senaryo:
              yenilenebilir üretim, kaynak dağıtımı ve şehir planlama
              kararları üzerine bir öğrenme dünyası.
            </p>
            <p>
              Sürdürülebilirlik, dijital vatandaşlık, finansal okuryazarlık
              veya sağlıklı yaşam gibi alanlarda benzer dünyalar tasarlanabilir.
            </p>
          </div>
        </div>
      </section>

      <section className="section container partner-process">
        <div className="section-heading" data-reveal>
          <div>
            <Eyebrow>SÜREÇ NASIL İLERLER?</Eyebrow>
            <h2>
              Tanışmadan kullanıma,
              <br />
              dört adımda.
            </h2>
          </div>
        </div>
        <ol className="flow partner-flow" data-reveal-group>
          {partnerSteps.map(([title, body], i) => (
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
        <div className="pilot-cta" data-reveal>
          <strong>Birlikte tasarlayalım</strong>
          <p>
            Kurumunuzun konusu, hedef kitlesi veya eğitim ihtiyacı üzerine bir
            senaryo fikri mi var? Kısa bir e-posta ile başlayalım.
          </p>
          <a
            className="button primary"
            href={`mailto:${site.email}?subject=${encodeURIComponent("Kurumsal iş birliği")}`}
          >
            İş birliği için yazın <Arrow />
          </a>
        </div>
      </section>
      <Contact />
    </div>
  );
}
