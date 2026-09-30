import { site } from "../config";
import { Arrow } from "./Arrow";
import { Eyebrow } from "./Eyebrow";

export function Contact() {
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
