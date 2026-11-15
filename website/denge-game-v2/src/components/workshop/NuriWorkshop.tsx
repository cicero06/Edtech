/**
 * Nuri Amca's street-works workshop — web port of the Unity mini-game
 * (GameHUD.Nuri.cs), drawn with the Unity art (soil cut-away, steel pipes,
 * gold safety pins, sediment chamber, cistern). Replaces the Konut card.
 *
 *   1. briefing   — 35 L reaches the homes, pressure is low; Nuri hands over
 *                   the acoustic radar
 *   2. (in town)  — the student walks Çınar Caddesi with the radar until the
 *                   dB peaks over the hidden leak, then opens the dig (E)
 *   3. 3 stages   — each opens with a hypothesis question, then the student
 *                   pulls the gold pins: bypass the limescale blockage, drain
 *                   the sediment into the trap, clamp the crack + fill the tank.
 *                   Unsafe moves trigger safety stops instead of failing.
 *   4. done       — 20 L/dk leak stopped, 50 L tank full
 *
 * Metrics: correct hypotheses, safety alerts, seconds spent with the radar.
 */
import { useEffect, useState, type ReactNode } from 'react';
import type { MinigameResult } from '../../Game/data/minigames';
import type { FieldResult } from '../../Game/data/fieldTasks';
import { TextureKeys } from '../../Game/data/assets';
import { playTone } from './audio';
import WorkshopShell from './WorkshopShell';
import './NuriWorkshop.css';

const art = (name: string) => `${import.meta.env.BASE_URL}assets/workshops/${name}.webp`;

interface Question {
  title: string;
  goal: string;
  prompt: string;
  options: { label: string; detail: string; feedback: string }[];
  correct: number;
}

const QUESTIONS: readonly Question[] = [
  {
    title: '1. Aşama · Tıkalı hattı ayır',
    goal: 'Suyu tıkalı borudan geçirmeden mahalleye ulaştır.',
    prompt:
      'Ana boruda taşlaşmış kireç tıkacı var. Barajdan gelen tazyikli suyu (80 L) patlama olmadan şebekeye nasıl aktarırız?',
    options: [
      {
        label: 'A) Tıkalı hattı zorla',
        detail: 'Suyu tıkalı boruya basıp kireci basınçla açmayı dene.',
        feedback: 'Tıkalı hatta su basarsak basınç tehlikeli şekilde yükselebilir! Deneyerek görelim…',
      },
      {
        label: 'B) Bakım hattına (bypass) yönlendir',
        detail: 'Suyu üstteki bakım hattından geçirip tıkalı borunun etrafından dolaştır.',
        feedback: 'Harika hipotez! Bypass suyu tıkalı bölgenin etrafından güvenle dolaştırır. Üstteki altın pimi (P2) çek.',
      },
      {
        label: 'C) Doğrudan depoya gönder',
        detail: 'Tıkalı boruyu açmadan suyu kapalı depoya vermeyi dene.',
        feedback: 'Depoya giden yol zaten tıkalı borudan geçiyor. Suyu önce güvenli bir yoldan dolaştırmalıyız.',
      },
    ],
    correct: 1,
  },
  {
    title: '2. Aşama · Kireç tortusunu ayır',
    goal: 'Tortuyu içme suyuna karıştırmadan şebekeden çıkar.',
    prompt:
      'Su bakım hattından akıyor ama borunun içinde kireç ve tortu birikti. İçme suyunu kirletmeden tortuyu nasıl uzaklaştırırız?',
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
    title: '3. Aşama · Çatlağı onar, depoyu doldur',
    goal: '20 L/dk kaçağı durdur ve mahalle deposunu doldur.',
    prompt:
      'Tortu temizlendi ama borudaki çatlaktan dakikada 20 litre içme suyu toprağa akıyor. Depoyu doldurmadan önce ne yapmalıyız?',
    options: [
      {
        label: 'A) Basıncı artır',
        detail: 'Tazyiki yükseltip çatlağın kendiliğinden kapanmasını um.',
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

type NuriField = Extract<FieldResult, { task: 'nuri-radar' }>;

interface Props {
  /** Set once the radar found the leak and the dig is open. */
  field?: NuriField;
  onGoToField: () => void;
  onComplete: (result: MinigameResult) => void;
  onClose: () => void;
}

type Step = 'briefing' | 'stage' | 'done';

export default function NuriWorkshop({ field, onGoToField, onComplete, onClose }: Props) {
  const [step, setStep] = useState<Step>(field ? 'stage' : 'briefing');
  const [sound, setSound] = useState(true);
  const tone = (kind: Parameters<typeof playTone>[0]) => playTone(kind, sound);

  const [stage, setStage] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null]);
  const [alerts, setAlerts] = useState(0);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [flash, setFlash] = useState<'pressure' | 'tank' | 'crack' | null>(null);
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

  useEffect(() => {
    if (!(trapIn && drainOpen) || sediment === 0) return;
    const id = setInterval(() => setSediment((s) => Math.max(0, s - 10)), 180);
    return () => clearInterval(id);
  }, [trapIn, drainOpen, sediment]);

  useEffect(() => {
    if (!tankOpen || tank >= TANK_L) return;
    const id = setInterval(() => setTank((t) => Math.min(TANK_L, t + 5)), 150);
    return () => clearInterval(id);
  }, [tankOpen, tank]);

  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(null), 900);
    return () => clearTimeout(id);
  }, [flash]);

  useEffect(() => {
    if (stageWon) playTone('win', sound);
    // only when a stage flips to won
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageWon]);

  const answer = (option: number) => {
    if (answered) return;
    const next = [...answers];
    next[stage] = option;
    setAnswers(next);
    setMessage(QUESTIONS[stage].options[option].feedback);
    tone(option === QUESTIONS[stage].correct ? 'win' : 'tap');
  };

  const warn = (msg: string, where: 'pressure' | 'tank' | 'crack') => {
    setAlerts((n) => n + 1);
    setAlertMsg(msg);
    setFlash(where);
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
    const score = Math.max(40, Math.min(100, 100 - (3 - hypothesesCorrect) * 10 - alerts * 10));
    onComplete({
      gameId: 'nuri',
      score,
      metrics: {
        waterSaved: LEAK_L,
        hypothesesCorrect,
        safetyAlerts: alerts,
        radarSeconds: field?.seconds ?? 0,
      },
    });
  };

  // ---- speech -------------------------------------------------------------
  let speech: string;
  if (step === 'briefing') {
    speech =
      'Hoş geldin evlat! Barajdan çıkan suyun ancak 35 litresi evlere varıyor, musluklarda basınç düşük. Bir yerde boru patlak ama toprağın altında, gözle görünmüyor. Al şu akustik radarı, Çınar Caddesi’nde yürü — ses en yüksek nerede çıkıyorsa kaçak oradadır!';
  } else if (step === 'stage') {
    if (alertMsg) speech = alertMsg;
    else if (stageWon)
      speech = [
        'Aferin evlat! Tıkalı hat ayrıldı, su bakım hattından güvenle akıyor. Sıradaki aşamaya geçelim.',
        'Tertemiz oldu! Kireç tortusunun tamamı hazneden tahliye edildi, içme suyu kurtuldu.',
        `Aslanımsın! Kaçak durdu, mahalle deposu ${TANK_L} litre doldu.`,
      ][stage];
    else if (message) speech = message;
    else
      speech =
        stage === 0 && field
          ? `Buldun! Radar ${field.seconds} saniyede 94 dB’e ulaştı. Kazıyı açtık, boruyu görüyorsun. Önce düşünelim: ${QUESTIONS[0].prompt}`
          : QUESTIONS[stage].prompt;
  } else {
    speech = `Tesisatı emniyetle ayırdık, tortuyu tahliye ettik ve çatlağı kelepçeledik. ${LEAK_L} litrelik kaçak durdu! Sen artık gerçek bir tesisat ustası çırağısın.`;
  }

  const stepLabel =
    step === 'briefing' ? 'ADIM 1 · SAHA GÖZLEMİ' : step === 'stage' ? `KAZI ALANI · AŞAMA ${stage + 1}/3` : 'GÖREV TAMAMLANDI';

  const leakStopped = clamped || step === 'done';
  const pressureHigh = directTried && !bypassOpen;
  const flow = stage === 0 ? (bypassOpen ? 25 : 0) : stage === 1 ? (sediment === 0 ? 45 : 25) : tankOpen ? 60 : 45;

  return (
    <WorkshopShell
      theme="nuri"
      eyebrow="HARMONY TOWN · ÇINAR CADDESİ ALTYAPI ÇALIŞMASI"
      title="Nuri Amca’nın Tesisat Atölyesi"
      stepLabel={stepLabel}
      npc={{ texture: TextureKeys.NURI_AMCA, label: '👴 NURİ AMCA · TESİSAT USTASI' }}
      speech={speech}
      alert={step === 'stage' && !!alertMsg}
      backdrop="nuri-street.webp"
      sound={sound}
      onToggleSound={() => setSound(!sound)}
      onClose={onClose}
      chips={[
        { icon: '🧭', label: pressureHigh ? 'Basınç 3.2 bar!' : 'Basınç güvenli', ok: !pressureHigh },
        { icon: '🚰', label: `Akış ${step === 'done' ? 60 : flow} L/dk`, ok: step === 'done' || flow >= 45 },
        { icon: '💧', label: leakStopped ? 'Kaçak 0 L' : `Kaçak ${LEAK_L} L/dk`, ok: leakStopped },
        { icon: '🏢', label: `Depo ${step === 'done' ? TANK_L : tank}/${TANK_L} L`, ok: step === 'done' || tank >= TANK_L },
      ]}
    >
      {step === 'briefing' && (
        <section className="ws-panel">
          <h2>Mahallede ölçtüklerimiz</h2>
          <ul className="ws-facts">
            <li>🏠 Evlere ulaşan su: <b>35 litre</b> — olması gerekenden çok az.</li>
            <li>🚿 Musluklarda <b>basınç düşük</b>, su kesik kesik akıyor.</li>
            <li>🎧 Caddenin altından <b>su sesi</b> geliyor ama kaçak görünmüyor.</li>
          </ul>
          <p className="ws-hint">
            Radar ekranın üstünde açılacak. Yürüdükçe ses (dB) yükseliyorsa doğru yöndesin. Kaçağın üstüne gelince <b>E</b> ile kazıyı aç.
          </p>
          <button className="ws-btn primary" onClick={() => { tone('tap'); onGoToField(); }}>
            🎧 Radarı al, caddeye çık →
          </button>
        </section>
      )}

      {step === 'stage' && (
        <div className="nuri-layout">
          <Excavation
            stage={stage}
            flash={flash}
            s1={{ bypassOpen, directTried }}
            s2={{ trapIn, drainOpen, sediment }}
            s3={{ clamped, tankOpen, tank }}
          />

          <aside className="nuri-console">
            <div className="nuri-stepper" aria-label={`Aşama ${stage + 1} / 3`}>
              {QUESTIONS.map((q, i) => (
                <span key={q.title} className={i < stage ? 'done' : i === stage ? 'active' : ''}>
                  {i < stage ? '✓' : i + 1}
                </span>
              ))}
            </div>
            <h2>{QUESTIONS[stage].title}</h2>
            <p className="nuri-goal">🎯 {QUESTIONS[stage].goal}</p>

            {!answered ? (
              <>
                <div className="nuri-q">🔬 Hipotezin ne?</div>
                <div className="nuri-options">
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
                  {answers[stage] !== QUESTIONS[stage].correct && ' — deneyerek görelim.'}
                </div>
                <div className="nuri-actions">
                  {stage === 0 && (
                    <>
                      <PinButton label="P2 · Bypass pimini çek" pulled={bypassOpen} onClick={() => {
                        setBypassOpen(true);
                        ok('Su bakım hattına yönlendirildi, tıkalı hat ayrıldı.');
                      }} />
                      <PinButton label="P3 · Tıkalı hattı aç" pulled={directTried} danger disabled={bypassOpen} onClick={() => {
                        setDirectTried(true);
                        warn('⚠️ Emniyet durdurması! Tıkalı hattı açtın, su kirece çarptı ve basınç 3.2 bar’a fırladı. Hemen P2 ile bakım hattını aç!', 'pressure');
                      }} />
                    </>
                  )}
                  {stage === 1 && (
                    <>
                      <PinButton label="P2 · Hazne girişini aç" pulled={trapIn} onClick={() => {
                        setTrapIn(true);
                        ok(drainOpen ? 'Hazne açıldı, kireç tahliye ediliyor…' : 'Kireç hazneye doluyor. Şimdi tahliye pimini (P3) çek!');
                      }} />
                      <PinButton label="P3 · Tahliye pimini çek" pulled={drainOpen} onClick={() => {
                        setDrainOpen(true);
                        ok(trapIn ? 'Tahliye açıldı, kireç dışarı akıyor…' : 'Tahliye kanalı hazır. Şimdi hazne girişini (P2) aç!');
                      }} />
                      <button className="ws-btn nuri-risky" disabled={sediment === 0} onClick={() =>
                        warn('⚠️ Dur! Tortu depoya giderse mahallenin içme suyu kirlenir. Tortuyu şeffaf hazneye almalıyız.', 'tank')
                      }>
                        Tortuyu depoya gönder
                      </button>
                    </>
                  )}
                  {stage === 2 && (
                    <>
                      <PinButton label="🩹 Onarım kelepçesini tak" pulled={clamped} onClick={() => {
                        setClamped(true);
                        ok(`Kelepçe takıldı, ${LEAK_L} L kaçak durdu! Şimdi P5 ile depoyu doldur.`);
                      }} />
                      <PinButton label="P5 · Depo pimini çek" pulled={tankOpen} onClick={() => {
                        if (!clamped) {
                          warn('⚠️ Kaçak sürüyor! Çatlak onarılmadan depoya su verirsek su toprağa akar. Önce kelepçeyi tak.', 'crack');
                          return;
                        }
                        setTankOpen(true);
                        ok('Depo doluyor: temiz su mahalleye akıyor!');
                      }} />
                    </>
                  )}
                </div>
                <button className="ws-btn primary nuri-next" disabled={!stageWon} onClick={nextStage}>
                  {stage < 2 ? `${stage + 2}. aşamaya geç →` : 'Sonucu gör →'}
                </button>
              </>
            )}
          </aside>
        </div>
      )}

      {step === 'done' && (
        <section className="ws-panel ws-win">
          <img className="nuri-win-art" src={art('nuri-pipe-repaired')} alt="" />
          <div>
            <h2>Usta Tesisatçı Çırağı rozeti kazandın!</h2>
            <ul className="ws-facts">
              <li>🎧 Kaçağı radarla <b>{field?.seconds ?? 0} saniyede</b> buldun.</li>
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

function PinButton({
  label,
  pulled,
  danger,
  disabled,
  onClick,
}: {
  label: string;
  pulled: boolean;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`nuri-pin-btn ${pulled ? (danger ? 'pulled danger' : 'pulled') : ''}`}
      disabled={pulled || disabled}
      onClick={onClick}
    >
      <img src={art('nuri-pin')} alt="" aria-hidden />
      <span>{pulled ? (danger ? '⚠ ' : '✓ ') : ''}{label}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Excavation — Unity art composited in one SVG over the soil cut-away
// ---------------------------------------------------------------------------
const W = 1000;
const H = 560;

/** A horizontal pipe image centred on (cx, cy) with the given width. */
function Pipe({ name, x, cy, w, ratio, bodyAt = 0.5, className }: {
  name: string; x: number; cy: number; w: number; ratio: number; bodyAt?: number; className?: string;
}) {
  const h = w / ratio;
  return <image href={art(name)} x={x} y={cy - h * bodyAt} width={w} height={h} className={className} />;
}

/** Steel connector run under the art. */
const steel = (d: string, key: string) => (
  <g key={key}>
    <path d={d} className="nuri-steel-out" />
    <path d={d} className="nuri-steel" />
  </g>
);
const water = (d: string, on: boolean, key: string, kind = '') =>
  on ? <path key={key} d={d} className={`nuri-flow ${kind}`} /> : null;

/** Gold safety pin across a pipe; slides out when pulled. */
function GoldPin({ x, y, pulled, vertical, label }: { x: number; y: number; pulled: boolean; vertical?: boolean; label: string }) {
  const w = 120;
  const h = w / 2.6;
  return (
    <g className={`nuri-goldpin ${pulled ? 'pulled' : 'ready'}`} transform={`translate(${x} ${y})${vertical ? ' rotate(90)' : ''}`}>
      <g className="nuri-goldpin-slide">
        <image href={art('nuri-pin')} x={-w * 0.3} y={-h / 2} width={w} height={h} />
      </g>
      <text x={0} y={vertical ? -34 : -26} transform={vertical ? 'rotate(-90)' : undefined} className="nuri-tag">{label}</text>
    </g>
  );
}

function Excavation({
  stage,
  flash,
  s1,
  s2,
  s3,
}: {
  stage: number;
  flash: 'pressure' | 'tank' | 'crack' | null;
  s1: { bypassOpen: boolean; directTried: boolean };
  s2: { trapIn: boolean; drainOpen: boolean; sediment: number };
  s3: { clamped: boolean; tankOpen: boolean; tank: number };
}) {
  let content: ReactNode;
  if (stage === 0) {
    content = (
      <>
        {steel('M120 430 H330', 'a')}
        {steel('M220 430 V290 H330', 'b')}
        {steel('M650 290 H770 V430', 'c')}
        {steel('M650 430 H860', 'd')}
        {water('M120 430 H220', true, 'wa')}
        {water('M220 430 V290 H330', s1.bypassOpen, 'wb')}
        {water('M650 290 H770 V430 H860', s1.bypassOpen, 'wc')}
        {water('M220 430 H330', s1.directTried && !s1.bypassOpen, 'wd', 'danger')}
        <Pipe name="nuri-pipe-clean" x={330} cy={290} w={320} ratio={640 / 216} className={s1.bypassOpen ? 'lit' : 'dim'} />
        <Pipe name="nuri-pipe-clog" x={330} cy={430} w={320} ratio={640 / 253} className={flash === 'pressure' ? 'shake' : ''} />
        <GoldPin x={220} y={360} pulled={s1.bypassOpen} label="P2" />
        <GoldPin x={275} y={430} pulled={s1.directTried} vertical label="P3" />
        <text x={490} y={500} className="nuri-tag dark">kireç tıkacı</text>
        <text x={490} y={232} className="nuri-tag">bakım hattı (bypass)</text>
        {s1.directTried && !s1.bypassOpen && <Gauge x={490} y={372} text="3.2 bar!" danger />}
      </>
    );
  } else if (stage === 1) {
    const clean = s2.sediment === 0;
    content = (
      <>
        {steel('M120 260 H300', 'a')}
        {steel('M620 260 H860', 'b')}
        {steel('M460 290 V340', 'c')}
        {steel('M512 470 H680 V520', 'd')}
        {water('M120 260 H300', true, 'wa')}
        {water('M620 260 H860', clean, 'wb')}
        {water('M460 290 V340', s2.trapIn && !clean, 'wc', 'murky')}
        {water('M512 470 H680 V520', s2.trapIn && s2.drainOpen && !clean, 'wd', 'murky')}
        <Pipe name={clean ? 'nuri-pipe-clean' : 'nuri-pipe-sediment'} x={300} cy={260} w={320} ratio={clean ? 640 / 216 : 640 / 315} />
        <image href={art('nuri-sediment-chamber')} x={408} y={336} width={104} height={104 * (420 / 258)} className={s2.trapIn ? '' : 'dim'} />
        <rect x={666} y={520} width={28} height={9} rx={2} className="nuri-grate" />
        <GoldPin x={460} y={316} pulled={s2.trapIn} label="P2" />
        <GoldPin x={600} y={470} pulled={s2.drainOpen} vertical label="P3" />
        <text x={460} y={206} className="nuri-tag">kireç %{s2.sediment}</text>
        <text x={570} y={548} className="nuri-tag dark">şeffaf hazne → tahliye</text>
      </>
    );
  } else {
    content = (
      <>
        {steel('M120 300 H250', 'a')}
        {steel('M690 300 H860', 'b')}
        {water('M120 300 H250', true, 'wa')}
        {water('M690 300 H860', s3.tankOpen, 'wb')}
        <Pipe name="nuri-pipe-clean" x={250} cy={300} w={200} ratio={640 / 216} />
        {s3.clamped ? (
          <Pipe name="nuri-pipe-repaired" x={450} cy={300} w={240} ratio={640 / 280} />
        ) : (
          <Pipe name="nuri-pipe-cracked" x={450} cy={300} w={240} ratio={640 / 376} bodyAt={0.3} className={flash === 'crack' ? 'shake' : ''} />
        )}
        <GoldPin x={780} y={300} pulled={s3.tankOpen} vertical label="P5" />
        <text x={570} y={250} className={`nuri-tag ${s3.clamped ? 'ok' : 'danger'}`}>
          {s3.clamped ? 'kelepçe · sızdırmaz ✓' : 'çatlak · 20 L/dk kaçak'}
        </text>
      </>
    );
  }

  const fill = stage === 2 ? s3.tank / TANK_L : 0;
  const lineY = stage === 0 ? 430 : stage === 1 ? 260 : 300;
  return (
    <div className="nuri-dig">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Kazı alanı: yeraltı boru hattı">
        <image href={art('nuri-soil')} x={0} y={0} width={W} height={H} preserveAspectRatio="xMidYMid slice" />
        <rect x={0} y={0} width={W} height={H} className="nuri-shade" />
        <g className="nuri-source">
          <rect x={14} y={lineY - 34} width={106} height={68} rx={10} />
          <text x={67} y={lineY - 6}>Baraj</text>
          <text x={67} y={lineY + 16} className="sub">80 L</text>
        </g>
        {content}
        <g className={flash === 'tank' ? 'shake' : ''}>
          <image href={art('nuri-cistern')} x={858} y={lineY - 80} width={132} height={132 * (360 / 283)} />
        </g>
        {stage === 2 && (
          <g className="nuri-level">
            <rect x={866} y={400} width={116} height={14} rx={7} />
            <rect x={866} y={400} width={116 * fill} height={14} rx={7} className="fill" />
            <text x={924} y={438}>Depo {s3.tank}/{TANK_L} L</text>
          </g>
        )}
      </svg>
    </div>
  );
}

function Gauge({ x, y, text, danger }: { x: number; y: number; text: string; danger?: boolean }) {
  return (
    <g className={`nuri-gauge ${danger ? 'danger' : ''}`}>
      <rect x={x - 62} y={y - 20} width={124} height={34} rx={17} />
      <text x={x} y={y + 3}>{text}</text>
    </g>
  );
}
