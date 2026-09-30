import { site } from "../config";
import { Arrow } from "./Arrow";
import { Brand } from "./Brand";

export function Footer() {
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
          <a href="/kurumlar">Kurumlarla iş birliği</a>
          <a href="/blog">Blog &amp; notlar</a>
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
