import { site } from "../config";
import { Arrow } from "./Arrow";

export function SeqCinematic({ onOpenTrailer }: { onOpenTrailer?: () => void }) {
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
            {onOpenTrailer && (
              <button
                type="button"
                className="button light button-trailer"
                onClick={onOpenTrailer}
              >
                <span className="play-icon" aria-hidden="true">▶</span>
                Tanıtım Filmi (1:20)
              </button>
            )}
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
