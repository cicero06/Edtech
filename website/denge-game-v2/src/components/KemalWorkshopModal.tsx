/**
 * İşçi Kemal's smart-park workshop — the web port of the Unity mini-game
 * (GameHUD.Kemal.cs). Replaces the plain Park investigation card.
 *
 *   1. briefing — Kemal explains the 25 L park reading and the wet paths
 *   2. align    — turn 3 sprinklers so none spray onto asphalt
 *   3. hour     — predict the watering time with the least evaporation
 *   4. done     — "Yeşil Vaha Koruyucusu" badge, +10 L saved
 *
 * The student's path (rotations, wrong guesses) is reported as metrics so
 * the teacher can see *how* they got there, not only that they finished.
 */
import { useMemo, useState } from 'react';
import type { MinigameResult } from '../Game/data/minigames';
import { SPRITESHEET_ASSETS, TextureKeys } from '../Game/data/assets';
import { playTone } from './workshopAudio';
import './KemalWorkshop.css';

type Dir = 0 | 1 | 2 | 3; // N, E, S, W
type Surface = 'grass' | 'flowers' | 'trees' | 'asphalt' | 'pavement';

interface Sector {
  name: string;
  /** What lies in each direction (N, E, S, W) from the sprinkler. */
  sides: [Surface, Surface, Surface, Surface];
  labels: [string, string, string, string];
}

const SECTORS: readonly Sector[] = [
  {
    name: 'Merkez Havuz & Bulvar',
    sides: ['asphalt', 'flowers', 'asphalt', 'grass'],
    labels: ['Bulvar yolu', 'Refüj çiçekleri', 'Kavşak asfaltı', 'Park çimi'],
  },
  {
    name: 'Kiraz Parkı & Kamelya',
    sides: ['trees', 'pavement', 'flowers', 'asphalt'],
    labels: ['Kiraz ağaçları', 'Mahalle kaldırımı', 'Gül tarhı', 'Cadde asfaltı'],
  },
  {
    name: 'Çocuk Parkı',
    sides: ['pavement', 'asphalt', 'asphalt', 'grass'],
    labels: ['Tarla sınır yolu', 'Belediye caddesi', 'Çevre yolu', 'Oyun parkı çimi'],
  },
];

const SURFACE_ICON: Record<Surface, string> = {
  grass: '🌿',
  flowers: '🌸',
  trees: '🌳',
  asphalt: '⬛',
  pavement: '🧱',
};

const isGreen = (s: Surface) => s === 'grass' || s === 'flowers' || s === 'trees';
const ARROWS = ['⬆', '➔', '⬇', '⬅'] as const;

/** Every sprinkler starts pointing at a path — the problem Kemal reported. */
const START_DIRS: Dir[] = [0, 1, 0];
/** Fewest taps that fix all three (rotation is clockwise only). */
const MIN_ROTATIONS = SECTORS.reduce((sum, sector, i) => {
  let steps = 0;
  let d = START_DIRS[i];
  while (!isGreen(sector.sides[d])) {
    d = ((d + 1) % 4) as Dir;
    steps++;
  }
  return sum + steps;
}, 0);

interface HourOption {
  id: 'noon' | 'morning' | 'night';
  label: string;
  loss: number;
  feedback: string;
}

const HOURS: readonly HourOption[] = [
  {
    id: 'noon',
    label: '☀️ 13:00 — Öğle',
    loss: 28,
    feedback: 'Öğle güneşi suyun %28’ini buharlaştırır — su köklere inmeden havaya karışır.',
  },
  {
    id: 'morning',
    label: '🌅 06:00 — Sabah',
    loss: 4,
    feedback: 'Doğru! Sabah serinliğinde kayıp yalnızca %4. Toprak suyu emer, kökler doyar.',
  },
  {
    id: 'night',
    label: '🌙 21:00 — Gece',
    loss: 7,
    feedback: 'Kayıp az (%7) ama gece biriken nem köklerde çürümeye ve mantara yol açabilir.',
  },
];

const WATER_SAVED_L = 10;

interface Props {
  onComplete: (result: MinigameResult) => void;
  onClose: () => void;
}

type Step = 'briefing' | 'align' | 'hour' | 'done';

const STEP_LABEL: Record<Step, string> = {
  briefing: 'ADIM 1 · SAHA GÖZLEMİ',
  align: 'ADIM 2 · FISKİYE HİZASI',
  hour: 'ADIM 3 · SULAMA SAATİ',
  done: 'GÖREV TAMAMLANDI',
};

/** Front-facing first frame of Kemal's walk strip, like the investigation cards. */
function KemalPortrait() {
  const sheet = SPRITESHEET_ASSETS.find((s) => s.key === TextureKeys.WORKER_KEMAL);
  if (!sheet) return null;
  const height = 64;
  const frameW = (sheet.frameWidth / sheet.frameHeight) * height;
  return (
    <div className="kemal-portrait" style={{ width: frameW }} aria-hidden>
      <img
        src={`${import.meta.env.BASE_URL}${encodeURI(sheet.path)}`}
        alt=""
        style={{ width: frameW * sheet.columns, height }}
        draggable={false}
      />
    </div>
  );
}

export default function KemalWorkshopModal({ onComplete, onClose }: Props) {
  const [step, setStep] = useState<Step>('briefing');
  const [sound, setSound] = useState(true);
  const [dirs, setDirs] = useState<Dir[]>(START_DIRS);
  const [rotations, setRotations] = useState(0);
  const [hour, setHour] = useState<HourOption['id'] | null>(null);
  const [wrongHourPicks, setWrongHourPicks] = useState(0);
  const [firstGuess, setFirstGuess] = useState<HourOption['id'] | null>(null);

  const wasted = useMemo(
    () => dirs.filter((d, i) => !isGreen(SECTORS[i].sides[d])).length,
    [dirs],
  );
  const selectedHour = HOURS.find((h) => h.id === hour) ?? null;

  const rotate = (i: number) => {
    const next = [...dirs];
    next[i] = ((next[i] + 1) % 4) as Dir;
    setDirs(next);
    setRotations((r) => r + 1);
    const nowWasted = next.filter((d, k) => !isGreen(SECTORS[k].sides[d])).length;
    playTone(nowWasted === 0 ? 'win' : 'tap', sound);
  };

  const pickHour = (option: HourOption) => {
    if (hour === 'morning') return;
    setHour(option.id);
    setFirstGuess((g) => g ?? option.id);
    if (option.id === 'morning') {
      playTone('win', sound);
    } else {
      setWrongHourPicks((n) => n + 1);
      playTone('alert', sound);
    }
  };

  const finish = () => {
    const extraTurns = Math.max(0, rotations - MIN_ROTATIONS);
    const score = Math.max(40, Math.min(100, 100 - wrongHourPicks * 15 - extraTurns * 2));
    onComplete({
      gameId: 'kemal',
      score,
      metrics: {
        waterSaved: WATER_SAVED_L,
        rotations,
        extraTurns,
        wrongHourPicks,
        firstGuessCorrect: firstGuess === 'morning' ? 1 : 0,
      },
    });
  };

  const speech: Record<Step, string> = {
    briefing:
      'Merhaba genç dostum! Parkta ölçtüğümüz 25 litre suyun bir kısmı çimlere hiç ulaşmıyor. Fıskiyeler taş yollara su sıçratıyor, üstelik öğle sıcağında suluyoruz. Gel, birlikte düzeltelim!',
    align:
      wasted > 0
        ? `Dikkat! ${wasted} fıskiye hâlâ yola ya da kaldırıma su basıyor. Fıskiyeye dokunarak yönünü çimlere, çiçeklere veya ağaçlara çevir.`
        : 'Harika hizalama! Yollar kuru, bütün su yeşil alanlara gidiyor. Şimdi sulama saatine bakalım.',
    hour: selectedHour
      ? selectedHour.feedback
      : 'Sence hangi saatte sularsak suyun en azı buharlaşır? Tahminini seç, sonucu birlikte görelim.',
    done: `Aslanımsın! Sıfır yol israfı, %4 buharlaşma ve ${WATER_SAVED_L} litre net tasarruf. Park hem yemyeşil hem de kuraklığa hazır!`,
  };

  return (
    <div className="kemal-overlay" role="dialog" aria-modal="true" aria-label="İşçi Kemal'in park atölyesi">
      <div className="kemal-shell">
        <header className="kemal-top">
          <div>
            <div className="kemal-eyebrow">HARMONY TOWN · PARK VE BAHÇELER ŞEFLİĞİ</div>
            <h1 className="kemal-title">İşçi Kemal’in Akıllı Park Atölyesi</h1>
          </div>
          <div className="kemal-top-actions">
            <span className="kemal-badge">{STEP_LABEL[step]}</span>
            <button className="kemal-btn ghost" onClick={() => setSound(!sound)}>
              {sound ? '🔊' : '🔇'}
            </button>
            <button className="kemal-btn ghost" onClick={onClose} aria-label="Kapat">
              ✕
            </button>
          </div>
        </header>

        <section className="kemal-speech">
          <KemalPortrait />
          <div>
            <div className="kemal-eyebrow">👷 İŞÇİ KEMAL</div>
            <p>{speech[step]}</p>
          </div>
        </section>

        <div className="kemal-chips">
          <Chip ok={step === 'done'} label={step === 'done' ? 'Debi 15 L/sn' : 'Debi 25 L/sn'} icon="🚰" />
          <Chip
            ok={wasted === 0 && step !== 'briefing'}
            label={wasted === 0 && step !== 'briefing' ? 'Yol israfı yok' : `${wasted} yolda israf`}
            icon="🧱"
          />
          <Chip
            ok={hour === 'morning'}
            label={selectedHour ? `Buharlaşma %${selectedHour.loss}` : 'Buharlaşma %28'}
            icon="☀️"
          />
          <Chip ok={step === 'done'} label={step === 'done' ? `+${WATER_SAVED_L} L tasarruf` : 'Tasarruf 0 L'} icon="🌿" />
        </div>

        {step === 'briefing' && (
          <section className="kemal-panel">
            <h2>Sahada gördüklerimiz</h2>
            <ul className="kemal-facts">
              <li>💧 Park her gün <b>25 litre</b> su alıyor.</li>
              <li>🧱 Fıskiyelerin yanındaki <b>taş yollar ve kaldırımlar ıslak</b> — su çimlere gitmiyor.</li>
              <li>☀️ Sulama <b>öğle saatinde</b> yapılıyor; güneş suyu buharlaştırıyor.</li>
            </ul>
            <button className="kemal-btn primary" onClick={() => { playTone('tap', sound); setStep('align'); }}>
              Fıskiyeleri incele →
            </button>
          </section>
        )}

        {step === 'align' && (
          <section className="kemal-panel">
            <h2>Fıskiyeleri yeşil alanlara çevir</h2>
            <p className="kemal-hint">Fıskiyeye dokun: saat yönünde döner. Kırmızı = su boşa gidiyor.</p>
            <div className="kemal-sectors">
              {SECTORS.map((sector, i) => (
                <SectorCard key={sector.name} index={i} sector={sector} dir={dirs[i]} onRotate={() => rotate(i)} />
              ))}
            </div>
            <div className="kemal-row-end">
              <button
                className="kemal-btn primary"
                disabled={wasted > 0}
                onClick={() => { playTone('tap', sound); setStep('hour'); }}
              >
                {wasted > 0 ? `Önce ${wasted} fıskiyeyi düzelt` : 'Sulama saatine geç →'}
              </button>
            </div>
          </section>
        )}

        {step === 'hour' && (
          <section className="kemal-panel">
            <h2>Hangi saatte sulamalıyız?</h2>
            <div className="kemal-hours">
              {HOURS.map((option) => {
                const state = hour === option.id ? (option.id === 'morning' ? 'right' : 'wrong') : '';
                return (
                  <button
                    key={option.id}
                    className={`kemal-hour ${state}`}
                    onClick={() => pickHour(option)}
                    disabled={hour === 'morning' && option.id !== 'morning'}
                  >
                    <span>{option.label}</span>
                    {hour === option.id && <small>%{option.loss} buharlaşma</small>}
                  </button>
                );
              })}
            </div>
            {hour && hour !== 'morning' && (
              <p className="kemal-hint">Başka bir saat dene — en az kaybı bulmaya çalış.</p>
            )}
            <div className="kemal-row-end">
              <button
                className="kemal-btn primary"
                disabled={hour !== 'morning'}
                onClick={() => { playTone('win', sound); setStep('done'); }}
              >
                Sonucu gör →
              </button>
            </div>
          </section>
        )}

        {step === 'done' && (
          <section className="kemal-panel kemal-win">
            <div className="kemal-medal" aria-hidden>🏅</div>
            <div>
              <h2>Yeşil Vaha Koruyucusu rozeti kazandın!</h2>
              <ul className="kemal-facts">
                <li>🧱 Yol israfı: <b>0 bölge</b></li>
                <li>☀️ Buharlaşma: <b>%28 → %4</b> (sabah 06:00)</li>
                <li>🌿 Günlük tasarruf: <b>{WATER_SAVED_L} litre</b></li>
              </ul>
              <p className="kemal-hint">
                Öğrendiğin: Yeşil alanları susuz bırakmadan da su tasarrufu yapılabilir — doğru yön ve doğru saat yeter.
              </p>
              <button className="kemal-btn primary" onClick={finish}>
                📋 Kanıtı deftere işle
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function Chip({ ok, label, icon }: { ok: boolean; label: string; icon: string }) {
  return (
    <div className={`kemal-chip ${ok ? 'ok' : ''}`}>
      <span aria-hidden>{icon}</span> {label} {ok && '✓'}
    </div>
  );
}

/** Plus-shaped plot: sprinkler in the centre, the four surfaces around it. */
function SectorCard({
  index,
  sector,
  dir,
  onRotate,
}: {
  index: number;
  sector: Sector;
  dir: Dir;
  onRotate: () => void;
}) {
  const green = isGreen(sector.sides[dir]);
  // grid cells for N, E, S, W around the centre of a 3×3 grid
  const area: Record<Dir, string> = { 0: 'n', 1: 'e', 2: 's', 3: 'w' };
  return (
    <div className={`kemal-sector ${green ? 'ok' : 'bad'}`}>
      <div className="kemal-sector-head">
        <b>Sektör {index + 1}</b>
        <span>{sector.name}</span>
      </div>
      <div className="kemal-plot">
        {([0, 1, 2, 3] as Dir[]).map((d) => (
          <div
            key={d}
            className={`kemal-cell ${area[d]} ${isGreen(sector.sides[d]) ? 'green' : 'hard'} ${d === dir ? 'wet' : ''}`}
            title={sector.labels[d]}
          >
            <span aria-hidden>{SURFACE_ICON[sector.sides[d]]}</span>
            <small>{sector.labels[d]}</small>
          </div>
        ))}
        <button className="kemal-sprinkler" onClick={onRotate} aria-label={`Sektör ${index + 1} fıskiyesini döndür`}>
          {ARROWS[dir]}
        </button>
      </div>
      <div className="kemal-sector-foot">
        {green ? `✓ ${sector.labels[dir]} sulanıyor` : `⚠ Su ${sector.labels[dir].toLocaleLowerCase('tr')} üzerine gidiyor`}
      </div>
    </div>
  );
}
