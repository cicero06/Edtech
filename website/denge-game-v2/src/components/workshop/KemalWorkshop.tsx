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
import type { MinigameResult } from '../../Game/data/minigames';
import { TextureKeys } from '../../Game/data/assets';
import { playTone } from './audio';
import WorkshopShell from './WorkshopShell';
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

export default function KemalWorkshop({ onComplete, onClose }: Props) {
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

  const aligned = wasted === 0 && step !== 'briefing';

  return (
    <WorkshopShell
      theme="kemal"
      eyebrow="HARMONY TOWN · PARK VE BAHÇELER ŞEFLİĞİ"
      title="İşçi Kemal’in Akıllı Park Atölyesi"
      stepLabel={STEP_LABEL[step]}
      npc={{ texture: TextureKeys.WORKER_KEMAL, label: '👷 İŞÇİ KEMAL' }}
      speech={speech[step]}
      sound={sound}
      onToggleSound={() => setSound(!sound)}
      onClose={onClose}
      chips={[
        { icon: '🚰', label: step === 'done' ? 'Debi 15 L/sn' : 'Debi 25 L/sn', ok: step === 'done' },
        { icon: '🧱', label: aligned ? 'Yol israfı yok' : `${wasted} yolda israf`, ok: aligned },
        { icon: '☀️', label: `Buharlaşma %${selectedHour?.loss ?? 28}`, ok: hour === 'morning' },
        { icon: '🌿', label: step === 'done' ? `+${WATER_SAVED_L} L tasarruf` : 'Tasarruf 0 L', ok: step === 'done' },
      ]}
    >
      {step === 'briefing' && (
        <section className="ws-panel">
          <h2>Sahada gördüklerimiz</h2>
          <ul className="ws-facts">
            <li>💧 Park her gün <b>25 litre</b> su alıyor.</li>
            <li>🧱 Fıskiyelerin yanındaki <b>taş yollar ve kaldırımlar ıslak</b> — su çimlere gitmiyor.</li>
            <li>☀️ Sulama <b>öğle saatinde</b> yapılıyor; güneş suyu buharlaştırıyor.</li>
          </ul>
          <button className="ws-btn primary" onClick={() => { playTone('tap', sound); setStep('align'); }}>
            Fıskiyeleri incele →
          </button>
        </section>
      )}

      {step === 'align' && (
        <section className="ws-panel">
          <h2>Fıskiyeleri yeşil alanlara çevir</h2>
          <p className="ws-hint">Fıskiyeye dokun: saat yönünde döner. Kırmızı = su boşa gidiyor.</p>
          <div className="kemal-sectors">
            {SECTORS.map((sector, i) => (
              <SectorCard key={sector.name} index={i} sector={sector} dir={dirs[i]} onRotate={() => rotate(i)} />
            ))}
          </div>
          <div className="ws-row-end">
            <button
              className="ws-btn primary"
              disabled={wasted > 0}
              onClick={() => { playTone('tap', sound); setStep('hour'); }}
            >
              {wasted > 0 ? `Önce ${wasted} fıskiyeyi düzelt` : 'Sulama saatine geç →'}
            </button>
          </div>
        </section>
      )}

      {step === 'hour' && (
        <section className="ws-panel">
          <h2>Hangi saatte sulamalıyız?</h2>
          <div className="ws-options">
            {HOURS.map((option) => {
              const state = hour === option.id ? (option.id === 'morning' ? 'right' : 'wrong') : '';
              return (
                <button
                  key={option.id}
                  className={`ws-option ${state}`}
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
            <p className="ws-hint" style={{ marginTop: 12 }}>Başka bir saat dene — en az kaybı bulmaya çalış.</p>
          )}
          <div className="ws-row-end">
            <button
              className="ws-btn primary"
              disabled={hour !== 'morning'}
              onClick={() => { playTone('win', sound); setStep('done'); }}
            >
              Sonucu gör →
            </button>
          </div>
        </section>
      )}

      {step === 'done' && (
        <section className="ws-panel ws-win">
          <div className="ws-medal" aria-hidden>🏅</div>
          <div>
            <h2>Yeşil Vaha Koruyucusu rozeti kazandın!</h2>
            <ul className="ws-facts">
              <li>🧱 Yol israfı: <b>0 bölge</b></li>
              <li>☀️ Buharlaşma: <b>%28 → %4</b> (sabah 06:00)</li>
              <li>🌿 Günlük tasarruf: <b>{WATER_SAVED_L} litre</b></li>
            </ul>
            <p className="ws-hint">
              Öğrendiğin: Yeşil alanları susuz bırakmadan da su tasarrufu yapılabilir — doğru yön ve doğru saat yeter.
            </p>
            <button className="ws-btn primary" onClick={finish}>
              📋 Kanıtı deftere işle
            </button>
          </div>
        </section>
      )}
    </WorkshopShell>
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
