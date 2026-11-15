/**
 * Nuri Amca's street-works workshop — web port of the Unity mini-game
 * (GameHUD.Nuri.cs). Replaces the plain Konut investigation card.
 *
 *   1. briefing — 35 L reaches the homes, pressure is low
 *   2. radar    — listen at points along Çınar Caddesi; the loudest (dB)
 *                 point is the leak. (Unity had the student walk the map;
 *                 here it becomes a small data-reading task.)
 *   3. stages   — three "pull the pin" plumbing stages, each opened by a
 *                 hypothesis question: bypass the blockage, drain the
 *                 limescale into the trap, clamp the crack and fill the tank
 *   4. done     — 20 L leak stopped, neighbourhood tank full (50 L)
 *
 * Metrics: correct hypotheses, safety alerts triggered, radar listens.
 */
import { useEffect, useState } from 'react';
import type { MinigameResult } from '../../Game/data/minigames';
import { TextureKeys } from '../../Game/data/assets';
import { playTone } from './audio';
import WorkshopShell from './WorkshopShell';
import './NuriWorkshop.css';

// ---------------------------------------------------------------------------
// Radar
// ---------------------------------------------------------------------------
const STREET_POINTS = [
  'Köşe bakkal',
  'Okul önü',
  'Çınar ağacı',
  'Durak',
  'Fırın önü',
  'Mazgal yanı',
  'Apartman 12',
  'Çeşme',
] as const;
const LEAK_INDEX = 5;
const decibels = (i: number) => Math.max(25, 94 - Math.abs(i - LEAK_INDEX) * 13);

// ---------------------------------------------------------------------------
// Plumbing stages
// ---------------------------------------------------------------------------
interface Question {
  title: string;
  prompt: string;
  options: { label: string; detail: string; feedback: string }[];
  /** Index of the safe, scientifically sound answer. */
  correct: number;
}

const QUESTIONS: readonly Question[] = [
  {
    title: '1. Aşama · Tıkalı hattı ayır',
    prompt:
      'Ana boruda taşlaşmış kireç tıkacı var. Barajdan gelen tazyikli suyu (80 L) patlama olmadan şebekeye nasıl aktarırız?',
    options: [
      {
        label: 'A) Tıkalı hattı zorla',
        detail: 'Suyu tıkalı boruya basıp kireci basınçla açmayı dene.',
        feedback: 'Tıkalı hatta su basarsak basınç tehlikeli şekilde yükselebilir! Bakalım ne olacak…',
      },
      {
        label: 'B) Bakım hattına (bypass) yönlendir',
        detail: 'Suyu üstteki bakım dirseğinden geçirip tıkalı hattı ayır.',
        feedback: 'Harika hipotez! Bypass suyu tıkalı bölgenin etrafından güvenle dolaştırır. Şimdi P2 pinini çek.',
      },
      {
        label: 'C) Doğrudan depoya gönder',
        detail: 'Tıkalı boruyu açmadan suyu kapalı depoya vermeyi dene.',
        feedback: 'Depoya giden hat zaten tıkalı. Suyu önce güvenli bir yoldan dolaştırmamız gerek.',
      },
    ],
    correct: 1,
  },
  {
    title: '2. Aşama · Kireç tortusunu ayır',
    prompt:
      'Su bakım hattından akıyor ama dirsekte kireç ve tortu birikti. İçme suyunu kirletmeden tortuyu nasıl uzaklaştırırız?',
    options: [
      {
        label: 'A) Tortuyu depoya akıt',
        detail: 'Tortuyu suyla birlikte mahalle deposuna gönder.',
        feedback: 'Dikkat: tortu depoya giderse içme suyunu kirletir! Şeffaf hazneyi kullanalım.',
      },
      {
        label: 'B) Hazneye al ve tahliye et',
        detail: 'Tortuyu şeffaf hazneye toplayıp şebeke dışına boşalt.',
        feedback: 'Doğru mantık! Hazne girişini (P2) ve tahliye kapağını (P3) aç.',
      },
      {
        label: 'C) Mazgala kontrolsüz boşalt',
        detail: 'Boruyu kırıp tortunun caddeye akmasını bekle.',
        feedback: 'Kontrolsüz boşaltma hem su kaybı hem kirlilik demek. Hazneyi kullanalım.',
      },
    ],
    correct: 1,
  },
  {
    title: '3. Aşama · Çatlağı onar',
    prompt:
      'Tortu temizlendi ama borudaki çatlaktan dakikada 20 litre içme suyu mazgala akıyor. Depoyu doldurmadan önce ne yapmalıyız?',
    options: [
      {
        label: 'A) Basıncı artır',
        detail: 'Tazyiki yükseltip çatlağın kapanmasını um.',
        feedback: 'Basıncı artırırsan çatlak büyüyüp patlayabilir! Önce çatlağı sarmalıyız.',
      },
      {
        label: 'B) Onarım kelepçesi tak',
        detail: 'Çatlağı sızdırmaz kelepçeyle sararak kaçağı durdur.',
        feedback: 'Harika karar! Kelepçe çatlağı sarar, 20 L kaçak sıfırlanır. Kelepçeyi tak.',
      },
      {
        label: 'C) Depoyu boşaltıp bekle',
        detail: 'Sızıntının kendiliğinden kurumasını bekle.',
        feedback: 'Beklemek kaçağı durdurmaz, su akmaya devam eder. Çatlağı onaralım.',
      },
    ],
    correct: 1,
  },
];

const LEAK_L = 20;
const TANK_L = 50;

interface Props {
  onComplete: (result: MinigameResult) => void;
  onClose: () => void;
}

type Step = 'briefing' | 'radar' | 'stage' | 'done';

export default function NuriWorkshop({ onComplete, onClose }: Props) {
  const [step, setStep] = useState<Step>('briefing');
  const [sound, setSound] = useState(true);
  const tone = (kind: Parameters<typeof playTone>[0]) => playTone(kind, sound);

  // radar
  const [heard, setHeard] = useState<Record<number, number>>({});
  const [listens, setListens] = useState(0);
  const leakFound = heard[LEAK_INDEX] !== undefined;

  // stages
  const [stage, setStage] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null]);
  const [alerts, setAlerts] = useState(0);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  // stage 1
  const [bypassOpen, setBypassOpen] = useState(false);
  const [directTried, setDirectTried] = useState(false);
  // stage 2
  const [trapIn, setTrapIn] = useState(false);
  const [drainOpen, setDrainOpen] = useState(false);
  const [sediment, setSediment] = useState(100);
  // stage 3
  const [clamped, setClamped] = useState(false);
  const [tankOpen, setTankOpen] = useState(false);
  const [tank, setTank] = useState(0);

  const answered = answers[stage] !== null;
  const stageWon = [bypassOpen, sediment === 0, tank >= TANK_L][stage];

  // stage 2: limescale drains once both the trap inlet and the drain are open
  useEffect(() => {
    if (!(trapIn && drainOpen) || sediment === 0) return;
    const id = setInterval(() => setSediment((s) => Math.max(0, s - 10)), 160);
    return () => clearInterval(id);
  }, [trapIn, drainOpen, sediment]);

  // stage 3: clean water fills the tank
  useEffect(() => {
    if (!tankOpen || tank >= TANK_L) return;
    const id = setInterval(() => setTank((t) => Math.min(TANK_L, t + 5)), 140);
    return () => clearInterval(id);
  }, [tankOpen, tank]);

  useEffect(() => {
    if (stageWon) playTone('win', sound);
    // only when a stage flips to won
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageWon]);

  const listen = (i: number) => {
    setListens((n) => n + 1);
    setHeard((h) => ({ ...h, [i]: decibels(i) }));
    tone(i === LEAK_INDEX ? 'alert' : 'tap');
  };

  const answer = (option: number) => {
    if (answered) return;
    const next = [...answers];
    next[stage] = option;
    setAnswers(next);
    setMessage(QUESTIONS[stage].options[option].feedback);
    tone(option === QUESTIONS[stage].correct ? 'win' : 'tap');
  };

  const warn = (msg: string) => {
    setAlerts((n) => n + 1);
    setAlertMsg(msg);
    tone('alert');
  };
  const ok = (msg: string) => {
    setAlertMsg(null);
    setMessage(msg);
    tone('tap');
  };

  const nextStage = () => {
    setAlertMsg(null);
    setMessage(null);
    if (stage < 2) setStage(stage + 1);
    else setStep('done');
    tone('tap');
  };

  const finish = () => {
    const hypothesesCorrect = answers.filter((a, i) => a === QUESTIONS[i].correct).length;
    const extraListens = Math.max(0, listens - 4);
    const score = Math.max(
      40,
      Math.min(100, 100 - (3 - hypothesesCorrect) * 10 - alerts * 10 - extraListens * 3),
    );
    onComplete({
      gameId: 'nuri',
      score,
      metrics: {
        waterSaved: LEAK_L,
        hypothesesCorrect,
        safetyAlerts: alerts,
        radarListens: listens,
      },
    });
  };

  // ---- speech -------------------------------------------------------------
  let speech: string;
  if (step === 'briefing') {
    speech =
      'Hoş geldin evlat! Barajdan çıkan suyun ancak 35 litresi evlere varıyor, musluklarda basınç düşük. Çınar Caddesi’nin altından bir ses geliyor — gel, kaçağı birlikte bulalım!';
  } else if (step === 'radar') {
    speech = leakFound
      ? `İşte burası! ${STREET_POINTS[LEAK_INDEX]} 94 dB ile en gürültülü nokta — su borudan fışkırıyor. Kazıyı açalım!`
      : 'Akustik dinleyiciyi caddedeki noktalara daya. Ses ne kadar yüksekse (dB), kaçağa o kadar yakınız. En yüksek sesi bul!';
  } else if (step === 'stage') {
    if (alertMsg) speech = alertMsg;
    else if (stageWon)
      speech = [
        'Aferin evlat! Tıkalı hat ayrıldı, su bakım hattından güvenle akıyor. Sıradaki aşamaya geçelim.',
        'Tertemiz oldu! Kireç tortusunun tamamı hazneden tahliye edildi, içme suyu kurtuldu.',
        `Aslanımsın! Kaçak durdu, mahalle deposu ${TANK_L} litre doldu.`,
      ][stage];
    else speech = message ?? QUESTIONS[stage].prompt;
  } else {
    speech = `Tesisatı emniyetle ayırdık, tortuyu tahliye ettik ve çatlağı kelepçeledik. ${LEAK_L} litrelik kaçak durdu! Sen artık gerçek bir tesisat ustası çırağısın.`;
  }

  const stepLabel =
    step === 'briefing'
      ? 'ADIM 1 · SAHA GÖZLEMİ'
      : step === 'radar'
        ? 'ADIM 2 · AKUSTİK RADAR'
        : step === 'stage'
          ? `ADIM 3 · TESİSAT ${stage + 1}/3`
          : 'GÖREV TAMAMLANDI';

  const leakStopped = clamped || step === 'done';
  const pressureHigh = directTried && !bypassOpen;

  return (
    <WorkshopShell
      theme="nuri"
      eyebrow="HARMONY TOWN · ÇINAR CADDESİ ALTYAPI ÇALIŞMASI"
      title="Nuri Amca’nın Tesisat Atölyesi"
      stepLabel={stepLabel}
      npc={{ texture: TextureKeys.NURI_AMCA, label: '👴 NURİ AMCA · TESİSAT USTASI' }}
      speech={speech}
      alert={step === 'stage' && !!alertMsg}
      sound={sound}
      onToggleSound={() => setSound(!sound)}
      onClose={onClose}
      chips={[
        { icon: '🎧', label: leakFound ? 'Kaçak bulundu' : 'Kaçak aranıyor', ok: leakFound },
        { icon: '🧭', label: pressureHigh ? 'Basınç 3.2 bar!' : 'Basınç güvenli', ok: !pressureHigh },
        { icon: '💧', label: leakStopped ? 'Kaçak 0 L' : `Kaçak ${LEAK_L} L/dk`, ok: leakStopped },
        { icon: '🏢', label: `Depo ${step === 'done' ? TANK_L : tank}/${TANK_L} L`, ok: step === 'done' || tank >= TANK_L },
      ]}
    >
      {step === 'briefing' && (
        <section className="ws-panel">
          <h2>Mahallede ölçtüklerimiz</h2>
          <ul className="ws-facts">
            <li>🏠 Evlere ulaşan su: <b>35 litre</b> (olması gereken çok daha fazla).</li>
            <li>🚿 Musluklarda <b>basınç düşük</b>, su kesik kesik akıyor.</li>
            <li>🎧 Çınar Caddesi’nde yerin altından <b>su sesi</b> geliyor.</li>
          </ul>
          <button className="ws-btn primary" onClick={() => { tone('tap'); setStep('radar'); }}>
            Akustik radarı al →
          </button>
        </section>
      )}

      {step === 'radar' && (
        <section className="ws-panel">
          <h2>Çınar Caddesi’ni dinle</h2>
          <p className="ws-hint">Bir noktaya dokun, dinleyici sesi desibel (dB) olarak ölçsün. En yüksek ses kaçağın yeri.</p>
          <div className="nuri-street" role="list">
            {STREET_POINTS.map((name, i) => {
              const db = heard[i];
              const level = db === undefined ? 0 : (db - 20) / 75;
              return (
                <button
                  key={name}
                  role="listitem"
                  className={`nuri-point ${db !== undefined ? 'heard' : ''} ${db === 94 ? 'leak' : ''}`}
                  onClick={() => listen(i)}
                  aria-label={`${name} noktasını dinle${db !== undefined ? `, ${db} desibel` : ''}`}
                >
                  <span className="nuri-meter" aria-hidden>
                    <span style={{ height: `${Math.round(level * 100)}%` }} />
                  </span>
                  <b>{db !== undefined ? `${db} dB` : '🎧'}</b>
                  <small>{name}</small>
                </button>
              );
            })}
          </div>
          <div className="ws-row-end">
            <button className="ws-btn primary" disabled={!leakFound} onClick={() => { tone('win'); setStep('stage'); }}>
              {leakFound ? 'Kazıyı aç, boruya ulaş →' : 'Önce kaçağın yerini bul'}
            </button>
          </div>
        </section>
      )}

      {step === 'stage' && (
        <section className="ws-panel">
          <div className="nuri-stepper" aria-hidden>
            {QUESTIONS.map((q, i) => (
              <span key={q.title} className={i < stage ? 'done' : i === stage ? 'active' : ''}>
                {i + 1}
              </span>
            ))}
          </div>
          <h2>{QUESTIONS[stage].title}</h2>

          {!answered ? (
            <>
              <p className="nuri-prompt">🔬 Hipotezin ne? {QUESTIONS[stage].prompt}</p>
              <div className="ws-options">
                {QUESTIONS[stage].options.map((option, i) => (
                  <button key={option.label} className="ws-option" onClick={() => answer(i)}>
                    <span>{option.label}</span>
                    <small>{option.detail}</small>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className={`nuri-answer ${answers[stage] === QUESTIONS[stage].correct ? 'right' : 'wrong'}`}>
                Hipotezin: <b>{QUESTIONS[stage].options[answers[stage]!].label}</b>
                {answers[stage] !== QUESTIONS[stage].correct && ' — şimdi deneyerek görelim.'}
              </div>
              <Schematic
                stage={stage}
                s1={{ bypassOpen, directTried }}
                s2={{ trapIn, drainOpen, sediment }}
                s3={{ clamped, tankOpen, tank }}
              />
              <div className="nuri-controls">
                {stage === 0 && (
                  <>
                    <button className="ws-btn" disabled={bypassOpen} onClick={() => {
                      setDirectTried(true);
                      warn('⚠️ Emniyet durdurması! Tıkalı hattı açtın, su kirece çarptı ve basınç 3.2 bar’a fırladı. Hemen P2 ile bakım hattını aç!');
                    }}>
                      P3 · Tıkalı hattı aç
                    </button>
                    <button className="ws-btn primary" disabled={bypassOpen} onClick={() => {
                      setBypassOpen(true);
                      ok('Su bakım hattına yönlendirildi, tıkalı hat ayrıldı.');
                    }}>
                      P2 · Bypass pinini çek
                    </button>
                  </>
                )}
                {stage === 1 && (
                  <>
                    <button className="ws-btn" disabled={sediment === 0} onClick={() =>
                      warn('⚠️ Dur! Tortu depoya giderse mahallenin içme suyu kirlenir. Tortuyu şeffaf hazneye almalıyız.')
                    }>
                      Tortuyu depoya gönder
                    </button>
                    <button className="ws-btn primary" disabled={trapIn} onClick={() => {
                      setTrapIn(true);
                      ok(drainOpen ? 'Hazne açıldı, kireç tahliye ediliyor…' : 'Kireç hazneye doluyor. Şimdi tahliye kapağını (P3) aç!');
                    }}>
                      P2 · Hazne girişini aç
                    </button>
                    <button className="ws-btn primary" disabled={drainOpen} onClick={() => {
                      setDrainOpen(true);
                      ok(trapIn ? 'Tahliye açıldı, kireç dışarı akıyor…' : 'Tahliye kanalı hazır. Şimdi hazne girişini (P2) aç!');
                    }}>
                      P3 · Tahliyeyi aç
                    </button>
                  </>
                )}
                {stage === 2 && (
                  <>
                    <button className="ws-btn primary" disabled={clamped} onClick={() => {
                      setClamped(true);
                      ok(`Kelepçe takıldı, ${LEAK_L} L kaçak durdu! Şimdi P5 ile depoyu doldur.`);
                    }}>
                      🩹 Onarım kelepçesini tak
                    </button>
                    <button className="ws-btn primary" disabled={tankOpen} onClick={() => {
                      if (!clamped) {
                        warn('⚠️ Kaçak sürüyor! Çatlak onarılmadan depoya su verirsek su mazgala akar. Önce kelepçeyi tak.');
                        return;
                      }
                      setTankOpen(true);
                      ok('Depo doluyor: temiz su mahalleye akıyor!');
                    }}>
                      P5 · Depoyu aç
                    </button>
                  </>
                )}
              </div>
              <div className="ws-row-end">
                <button className="ws-btn primary" disabled={!stageWon} onClick={nextStage}>
                  {stage < 2 ? `${stage + 2}. aşamaya geç →` : 'Sonucu gör →'}
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {step === 'done' && (
        <section className="ws-panel ws-win">
          <div className="ws-medal" aria-hidden>🔧</div>
          <div>
            <h2>Usta Tesisatçı Çırağı rozeti kazandın!</h2>
            <ul className="ws-facts">
              <li>🎧 Kaçağı <b>{listens}</b> ölçümde buldun.</li>
              <li>💧 Kaçak: <b>{LEAK_L} L/dk → 0</b></li>
              <li>🏢 Mahalle deposu: <b>{TANK_L} litre</b> temiz su</li>
            </ul>
            <p className="ws-hint">
              Öğrendiğin: Önce ölç, sonra hipotez kur, sonra güvenle dene. Görünmeyen bir kaçak bile kasabanın suyunu sessizce tüketir.
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

// ---------------------------------------------------------------------------
// Pipe schematic — one SVG per stage, water drawn on top of the steel pipes
// ---------------------------------------------------------------------------
function Schematic({
  stage,
  s1,
  s2,
  s3,
}: {
  stage: number;
  s1: { bypassOpen: boolean; directTried: boolean };
  s2: { trapIn: boolean; drainOpen: boolean; sediment: number };
  s3: { clamped: boolean; tankOpen: boolean; tank: number };
}) {
  const pipe = (d: string, key: string) => <path key={key} d={d} className="nuri-pipe" />;
  const water = (d: string, on: boolean, key: string, cls = '') =>
    on ? <path key={key} d={d} className={`nuri-water ${cls}`} /> : null;

  return (
    <svg className="nuri-svg" viewBox="0 0 640 240" role="img" aria-label="Boru şeması">
      <rect x="0" y="0" width="640" height="240" rx="10" className="nuri-ground" />
      <Box x={10} y={95} w={90} h={50} label="Kaynak" sub="80 L" />
      <Box x={530} y={stage === 2 ? 60 : 85} w={100} h={stage === 2 ? 120 : 70} label="Mahalle" sub="deposu" />

      {stage === 0 && (
        <g>
          {pipe('M100 120 H200', 'a')}
          {pipe('M200 120 V50 H440 V120', 'b')}
          {pipe('M200 120 H440', 'c')}
          {pipe('M440 120 H530', 'd')}
          {water('M100 120 H200', true, 'wa')}
          {water('M200 120 V50 H440 V120', s1.bypassOpen, 'wb')}
          {water('M200 120 H310', s1.directTried && !s1.bypassOpen, 'wc', 'danger')}
          {water('M440 120 H530', s1.bypassOpen, 'wd')}
          <circle cx="330" cy="120" r="16" className="nuri-clog" />
          <text x="330" y="152" className="nuri-label">kireç tıkacı</text>
          <Pin x={320} y={50} label="P2" active={s1.bypassOpen} />
          <Pin x={260} y={120} label="P3" active={s1.directTried} danger />
          {s1.directTried && !s1.bypassOpen && (
            <text x="260" y="95" className="nuri-label danger">3.2 bar!</text>
          )}
          <text x="320" y="30" className="nuri-label">bakım hattı (bypass)</text>
        </g>
      )}

      {stage === 1 && (
        <g>
          {pipe('M100 120 H530', 'a')}
          {pipe('M300 120 V150', 'b')}
          {pipe('M340 185 H430 V215', 'c')}
          {water('M100 120 H530', true, 'wa', s2.sediment > 0 ? 'murky' : '')}
          {water('M300 120 V150', s2.trapIn, 'wb', 'murky')}
          {water('M340 185 H430 V215', s2.trapIn && s2.drainOpen && s2.sediment > 0, 'wc', 'murky')}
          <rect x="260" y="150" width="80" height="60" rx="6" className="nuri-trap" />
          <rect
            x="262"
            y={208 - (s2.trapIn ? 56 * (s2.sediment / 100) : 0)}
            width="76"
            height={s2.trapIn ? 56 * (s2.sediment / 100) : 0}
            className="nuri-sediment"
          />
          <text x="300" y="228" className="nuri-label">şeffaf hazne · kireç %{s2.sediment}</text>
          <rect x="415" y="215" width="30" height="8" className="nuri-grate" />
          <Pin x={300} y={140} label="P2" active={s2.trapIn} />
          <Pin x={385} y={185} label="P3" active={s2.drainOpen} />
          {s2.sediment > 0 && <circle cx="300" cy="120" r="10" className="nuri-clog small" />}
        </g>
      )}

      {stage === 2 && (
        <g>
          {pipe('M100 120 H530', 'a')}
          {water('M100 120 H470', true, 'wa')}
          {water('M470 120 H530', s3.tankOpen, 'wb')}
          {!s3.clamped ? (
            <g className="nuri-drips">
              <circle cx="280" cy="140" r="4" />
              <circle cx="286" cy="160" r="4" />
              <circle cx="276" cy="180" r="4" />
              <text x="280" y="210" className="nuri-label danger">çatlak · 20 L/dk kaçak</text>
            </g>
          ) : (
            <g>
              <rect x="266" y="104" width="28" height="32" rx="4" className="nuri-clamp" />
              <text x="280" y="160" className="nuri-label ok">kelepçe · sızdırmaz</text>
            </g>
          )}
          <Pin x={470} y={120} label="P5" active={s3.tankOpen} />
          <rect
            x="532"
            y={178 - 116 * (s3.tank / TANK_L)}
            width="96"
            height={116 * (s3.tank / TANK_L)}
            className="nuri-tankwater"
          />
          <text x="580" y="200" className="nuri-label">{s3.tank}/{TANK_L} L</text>
        </g>
      )}
    </svg>
  );
}

function Box({ x, y, w, h, label, sub }: { x: number; y: number; w: number; h: number; label: string; sub: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="8" className="nuri-box" />
      <text x={x + w / 2} y={y + 22} className="nuri-box-label">{label}</text>
      <text x={x + w / 2} y={y + 40} className="nuri-label">{sub}</text>
    </g>
  );
}

function Pin({ x, y, label, active, danger }: { x: number; y: number; label: string; active: boolean; danger?: boolean }) {
  return (
    <g className={`nuri-pin ${active ? (danger ? 'danger' : 'on') : ''}`}>
      <circle cx={x} cy={y} r="15" />
      <text x={x} y={y + 4}>{label}</text>
    </g>
  );
}
