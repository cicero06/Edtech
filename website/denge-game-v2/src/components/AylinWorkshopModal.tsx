import { useEffect, useMemo, useState } from 'react';
import './AylinWorkshop.css';
import { activeFacts } from '../Game/scenario';
import type { ScenarioFacts } from '../Game/scenario/model';

export interface AylinWorkshopDecisionResult {
  decisionId: 'patch' | 'replace' | 'sensor';
  decisionTitle: string;
  cost: number;
  waterSaved: number;
}

interface AylinWorkshopModalProps {
  onComplete: (result: AylinWorkshopDecisionResult) => void;
  onClose: () => void;
  hasParkData?: boolean;
  hasMahalleData?: boolean;
}

// ---------------------------------------------------------------------------
// PIPE LOGIC (Manus Prototype Engine Adapted for TypeScript & React)
// ---------------------------------------------------------------------------
type Direction = 'N' | 'E' | 'S' | 'W';
type PipeKind = 'source' | 'target' | 'straight' | 'corner' | 'tee' | 'cross' | null;

interface Cell {
  kind: PipeKind;
  rot: number;
  open?: Direction[];
  seed: number;
}

const DIRS: Direction[] = ['N', 'E', 'S', 'W'];
const baseConns: Record<string, Direction[]> = {
  straight: ['E', 'W'],
  corner: ['N', 'E'],
  tee: ['N', 'E', 'W'],
  cross: ['N', 'E', 'S', 'W'],
};

const rotate = (arr: Direction[], n: number): Direction[] =>
  arr.map((d) => DIRS[(DIRS.indexOf(d) + n) % 4]);

const opposite: Record<Direction, Direction> = { N: 'S', E: 'W', S: 'N', W: 'E' };
const delta: Record<Direction, [number, number]> = {
  N: [-1, 0],
  E: [0, 1],
  S: [1, 0],
  W: [0, -1],
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const key = (r: number, c: number) => `${r}-${c}`;

function connections(cell: Cell): Direction[] {
  if (cell.kind === 'source' || cell.kind === 'target') return cell.open || [];
  if (!cell.kind) return [];
  return rotate(baseConns[cell.kind] || [], cell.rot);
}

function requiredSides(route: [number, number][], index: number): Direction[] {
  const [r, c] = route[index];
  const out: Direction[] = [];
  if (index > 0) {
    const [pr, pc] = route[index - 1];
    if (pr < r) out.push('N');
    if (pr > r) out.push('S');
    if (pc < c) out.push('W');
    if (pc > c) out.push('E');
  }
  if (index < route.length - 1) {
    const [nr, nc] = route[index + 1];
    if (nr < r) out.push('N');
    if (nr > r) out.push('S');
    if (nc < c) out.push('W');
    if (nc > c) out.push('E');
  }
  return out;
}

function typeAndRotation(req: Direction[]): [PipeKind, number] {
  if (req.length === 4) return ['cross', 0];
  if (
    req.length === 2 &&
    ((req.includes('N') && req.includes('S')) || (req.includes('E') && req.includes('W')))
  ) {
    return ['straight', req.includes('N') ? 1 : 0];
  }
  return ['corner', baseConns.corner.findIndex((x) => x === req[0]) >= 0 ? 0 : 1];
}

function rotationFor(kind: PipeKind, req: Direction[]): number {
  if (!kind) return 0;
  for (let r = 0; r < 4; r++) {
    const conns = connections({ kind, rot: r, seed: 0 });
    if (JSON.stringify(conns.slice().sort()) === JSON.stringify(req.slice().sort())) return r;
  }
  return 0;
}

function buildBoard(route: [number, number][], level: number): Cell[][] {
  const rows = 5;
  const cols = 7;
  const board: Cell[][] = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({
      kind: null,
      rot: 0,
      seed: (r * 9 + c * 5 + level) % 4,
    })),
  );

  route.forEach((coord, i) => {
    const [r, c] = coord;
    const req = requiredSides(route, i);
    if (i === 0) {
      board[r][c] = { kind: 'source', open: req, rot: 0, seed: 0 };
    } else if (i === route.length - 1) {
      board[r][c] = { kind: 'target', open: req, rot: 0, seed: 0 };
    } else {
      const [kind] = typeAndRotation(req);
      const rot = (rotationFor(kind, req) + (((r + c + level) % 3) + 1)) % 4;
      board[r][c] = { kind, rot, seed: 0 };
    }
  });

  const decoys: [number, number][] = [
    [0, 1],
    [0, 3],
    [0, 5],
    [1, 0],
    [1, 4],
    [2, 0],
    [2, 4],
    [3, 1],
    [3, 5],
    [4, 2],
    [4, 6],
  ];

  decoys.forEach(([r, c], i) => {
    if (!board[r][c].kind) {
      const kinds: PipeKind[] = ['straight', 'corner', 'tee'];
      board[r][c] = {
        kind: kinds[(i + level) % kinds.length],
        rot: (i * 2 + level) % 4,
        seed: i,
      };
    }
  });

  return board;
}

const STAGES = [
  {
    name: 'NORMAL AKIŞ',
    subtitle: 'Barajdan arıtma havuzuna temiz bir yol kur.',
    route: [
      [2, 0],
      [2, 1],
      [1, 1],
      [1, 2],
      [1, 3],
      [2, 3],
      [2, 4],
      [2, 5],
      [2, 6],
    ] as [number, number][],
    time: 85,
    level: 70,
    clue: 'İlk görev: suyun kaynaktan kasabaya kesintisiz ulaşması için boruları birleştir.',
  },
  {
    name: 'KURAKLIK BASKISI',
    subtitle: 'Yağış %{rain} azalırken akışı kesintisiz tut.',
    route: [
      [2, 0],
      [2, 1],
      [2, 2],
      [1, 2],
      [1, 3],
      [1, 4],
      [2, 4],
      [3, 4],
      [3, 5],
      [3, 6],
      [2, 6],
    ] as [number, number][],
    time: 75,
    level: 55,
    clue: 'Yağış normallere göre %{rain} düşük. Fazla yanlış dönüş yapmadan doğru hattı bağla.',
  },
  {
    name: 'SICAKLIK DALGASI',
    subtitle: 'Buharlaşma %{evap} artıyor. Son hattı zamanında tamamla.',
    route: [
      [2, 0],
      [2, 1],
      [3, 1],
      [3, 2],
      [3, 3],
      [2, 3],
      [2, 4],
      [1, 4],
      [1, 5],
      [2, 5],
      [2, 6],
    ] as [number, number][],
    time: 65,
    level: 42,
    clue: 'Sıcaklık ve buharlaşma yükseliyor. Rezerv kritik eşiğin (%{critical}) altına inmeden sistemi kurtar.',
  },
];

/**
 * The three pipeline rounds with this student's numbers: the rounds start at
 * last year's, spring's and today's reservoir level, and quote the variant's
 * rain deficit, evaporation rise and alarm threshold (scenario engine).
 */
function stagesFor(f: ScenarioFacts) {
  const levels = [f.history.lastYear, f.history.spring, f.history.today];
  const fillText = (text: string) =>
    text
      .replaceAll('{rain}', String(f.rainDeficitPct))
      .replaceAll('{evap}', String(f.evaporationPct))
      .replaceAll('{critical}', String(f.criticalPct));
  return STAGES.map((stage, i) => ({
    ...stage,
    level: levels[i],
    subtitle: fillText(stage.subtitle),
    clue: fillText(stage.clue),
  }));
}

function PipeSVG({ cell, powered }: { cell: Cell; powered: boolean }) {
  const con = connections(cell);
  const xy: Record<Direction, [number, number]> = {
    N: [50, 10],
    E: [90, 50],
    S: [50, 90],
    W: [10, 50],
  };
  return (
    <svg className={`aylin-pipe ${powered ? 'power' : ''}`} viewBox="0 0 100 100">
      {con.map((d) => (
        <line key={d} x1="50" y1="50" x2={xy[d][0]} y2={xy[d][1]} />
      ))}
      <circle cx="50" cy="50" r="11" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// AUDIO SYNTHESIZER
// ---------------------------------------------------------------------------
function playTone(kind: 'tap' | 'win' | 'alert' = 'tap', soundEnabled = true) {
  if (!soundEnabled || typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    if (kind === 'win') {
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.2);
      gain.gain.value = 0.04;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (kind === 'alert') {
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.setValueAtTime(220, ctx.currentTime + 0.1);
      gain.gain.value = 0.05;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else {
      osc.frequency.value = 260;
      gain.gain.value = 0.02;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    }
  } catch {
    // Ignore audio context autoplay restriction
  }
}

// ---------------------------------------------------------------------------
// MAIN AYLIN WORKSHOP MODAL COMPONENT
// ---------------------------------------------------------------------------
export default function AylinWorkshopModal({
  onComplete,
  onClose,
  hasParkData = true,
  hasMahalleData = true,
}: AylinWorkshopModalProps) {
  // Activity steps: 'briefing' | 'evidence' | 'pipe_puzzle' | 'decision' | 'completed' | 'weather'
  const [step, setStep] = useState<
    'briefing' | 'evidence' | 'pipe_puzzle' | 'decision' | 'completed' | 'weather'
  >('briefing');

  const [sound, setSound] = useState(true);
  // This student's dam numbers (scenario engine) and the rounds built from them.
  const [af] = useState(activeFacts);
  const stages = useMemo(() => stagesFor(af), [af]);
  /** Litres a repair choice gives back = leak − what still escapes after it. */
  const savedAfter = (remainPct: number) => af.leakL - Math.round((remainPct * af.outflowL) / 100);

  // --- Module A: Kanıt Analizi State ---
  const [selectedHypothesis, setSelectedHypothesis] = useState<number | null>(null);
  const [hypothesisAnswered, setHypothesisAnswered] = useState(false);

  // --- Module B: Boru Hattı Bulmacası State ---
  const [stageIndex, setStageIndex] = useState(0);
  const stage = stages[stageIndex];
  const [board, setBoard] = useState<Cell[][]>(() => buildBoard(STAGES[0].route, 0));
  const [timeLeft, setTimeLeft] = useState(STAGES[0].time);
  const [waterLevel, setWaterLevel] = useState(() => stagesFor(af)[0].level);
  const [puzzleStatus, setPuzzleStatus] = useState<'playing' | 'won' | 'lost' | 'finished'>('playing');

  // BFS Connectivity
  const connected = useMemo(() => {
    const seen = new Set<string>(['2-0']);
    const queue: [number, number][] = [[2, 0]];
    const set = new Set<string>(['2-0']);

    while (queue.length > 0) {
      const [r, c] = queue.shift()!;
      const cell = board[r]?.[c];
      if (!cell) continue;

      for (const d of connections(cell)) {
        const [dr, dc] = delta[d];
        const nr = r + dr;
        const nc = c + dc;
        const ncell = board[nr]?.[nc];

        if (ncell && connections(ncell).includes(opposite[d]) && !set.has(key(nr, nc))) {
          set.add(key(nr, nc));
          seen.add(key(nr, nc));
          queue.push([nr, nc]);
        }
      }
    }
    return set;
  }, [board]);

  const targetKey = key(
    stage.route[stage.route.length - 1][0],
    stage.route[stage.route.length - 1][1],
  );

  // Pipe Puzzle Timer & Evaporation ticker
  useEffect(() => {
    if (step !== 'pipe_puzzle' || puzzleStatus !== 'playing') return;

    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setPuzzleStatus('lost');
          playTone('alert', sound);
          return 0;
        }
        return t - 1;
      });

      setWaterLevel((w) => clamp(w - (stageIndex === 2 ? 0.28 : 0.16), 0, 100));
    }, 1000);

    return () => clearInterval(interval);
  }, [step, puzzleStatus, stageIndex, sound]);

  // Win condition check
  useEffect(() => {
    if (step === 'pipe_puzzle' && puzzleStatus === 'playing' && connected.has(targetKey)) {
      const timer = setTimeout(() => {
        setPuzzleStatus('won');
        playTone('win', sound);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [step, puzzleStatus, connected, targetKey, sound]);

  const rotateTile = (r: number, c: number) => {
    const cell = board[r][c];
    if (!cell.kind || cell.kind === 'source' || cell.kind === 'target' || puzzleStatus !== 'playing')
      return;
    playTone('tap', sound);
    setBoard((old) =>
      old.map((row, rr) =>
        row.map((x, cc) => (rr === r && cc === c ? { ...x, rot: (x.rot + 1) % 4 } : x)),
      ),
    );
    setWaterLevel((w) => clamp(w - 0.35, 0, 100));
  };

  const restartPuzzle = () => {
    setBoard(buildBoard(stage.route, stageIndex));
    setTimeLeft(stage.time);
    setWaterLevel(stage.level);
    setPuzzleStatus('playing');
  };

  const nextStage = () => {
    const next = stageIndex + 1;
    if (next >= stages.length) {
      setPuzzleStatus('finished');
      return;
    }
    setStageIndex(next);
    setBoard(buildBoard(stages[next].route, next));
    setTimeLeft(stages[next].time);
    setWaterLevel(stages[next].level);
    setPuzzleStatus('playing');
  };

  // --- Module C: Mühendislik Kararı State ---
  const [selectedDecision, setSelectedDecision] = useState<'patch' | 'replace' | 'sensor'>('replace');

  // --- Weather Alert Mini-Game State ---
  const weatherRounds = [
    {
      title: 'Yaz kuraklığı yaklaşıyor',
      month: 'HAZİRAN / 09:20',
      rain: '−42%',
      temp: '+6°C',
      evap: '+18%',
      icon: '☀️',
      clue: 'Yağış düşüyor, sıcaklık ve buharlaşma hızla yükseliyor.',
      answer: 'conserve',
      options: [
        ['conserve', 'Tasarruf alarmını aç ve rezervi koru.', 'Doğru! Kuraklık sinyalleri birlikte yükseliyor.'],
        ['release', 'Sulama vanalarını tamamen aç.', 'Bu karar kritik dönemde su kaybını artırır.'],
        ['ignore', 'Veriyi yok say, normal akışı sürdür.', 'Birden fazla alarm aynı anda yanıyor.'],
      ],
    },
    {
      title: 'Ani sağanak ihtimali',
      month: 'TEMMUZ / 14:10',
      rain: '+68%',
      temp: '+2°C',
      evap: '−12%',
      icon: '⛈️',
      clue: 'Yağış ihtimali yükseldi, kısa sürede yoğun akış gelebilir.',
      answer: 'store',
      options: [
        ['store', 'Taşkın yolunu aç, gelen suyu depoya yönlendir.', 'Doğru! Ani yağışı depolamak rezervi toparlar.'],
        ['drain', 'Tüm suyu şehir dışına boşalt.', 'Bu, tatlı suyu gereksiz yere kaybettirir.'],
        ['heat', 'Buharlaşma alarmını yükselt.', 'Bu turda ana sinyal yağış ve taşkın riski.'],
      ],
    },
    {
      title: 'Serinleme ve toparlanma',
      month: 'EYLÜL / 08:45',
      rain: '+24%',
      temp: '−4°C',
      evap: '−28%',
      icon: '🌦️',
      clue: 'Yağış geri dönüyor; buharlaşma belirgin şekilde yavaşlıyor.',
      answer: 'recharge',
      options: [
        ['recharge', 'Rezervi yeniden doldur ve normal akışı kademeli aç.', 'Harika! Toparlanma için dengeli karar.'],
        ['ration', 'Tüm girişleri kapalı tut.', 'Suyu korumak önemli ama gelen suyu da değerlendirmeliyiz.'],
        ['pump', 'Yoğun pompalamayla hemen tüket.', 'Sistem toparlanırken aşırı tüketim risklidir.'],
      ],
    },
  ];
  const [weatherRound, setWeatherRound] = useState(0);
  const [weatherAnswer, setWeatherAnswer] = useState<string | null>(null);
  const [weatherScore, setWeatherScore] = useState(0);
  const [weatherDone, setWeatherDone] = useState(false);

  const chooseWeather = (id: string) => {
    if (weatherAnswer) return;
    setWeatherAnswer(id);
    const curr = weatherRounds[weatherRound];
    if (id === curr.answer) {
      setWeatherScore((s) => s + 1);
      playTone('win', sound);
      setTimeout(() => {
        if (weatherRound === weatherRounds.length - 1) setWeatherDone(true);
        else {
          setWeatherRound((r) => r + 1);
          setWeatherAnswer(null);
        }
      }, 700);
    } else {
      playTone('alert', sound);
    }
  };

  const handleFinalSubmit = () => {
    const decisionMeta = {
      patch: { decisionTitle: 'Çatlağı Onar (Geçici Yama)', cost: 150000, waterSaved: savedAfter(af.aylinRemainPct.patch) },
      replace: { decisionTitle: 'Eski Boruyu Değiştir (Kalıcı Yenileme)', cost: 400000, waterSaved: savedAfter(af.aylinRemainPct.replace) },
      sensor: { decisionTitle: 'İzleme Sensörü Kur (Erken Uyarı)', cost: 100000, waterSaved: savedAfter(af.aylinRemainPct.sensor) },
    }[selectedDecision];

    onComplete({
      decisionId: selectedDecision,
      ...decisionMeta,
    });
  };

  return (
    <div className="aylin-overlay" role="dialog" aria-modal="true">
      <div className="aylin-crt">
        {/* TOP BAR */}
        <header className="aylin-topbar">
          <div>
            <div className="aylin-eyebrow">HARMONY TOWN · BARAJ VE HİDROLOJİ İSTASYONU</div>
            <h1 className="text-2xl font-bold sm:text-3xl text-cyan-200" style={{ margin: '4px 0' }}>
              Mühendis Aylin’in <span style={{ color: '#5ae5f3' }}>Mühendislik Atölyesi</span>
            </h1>
            <p className="aylin-mono" style={{ fontSize: '11px', color: '#89adb4', margin: 0 }}>
              Kayıp Suyun Peşinde · Saha Kanıtları, Boru Ağı Kurtarma ve Altyapı Kararı
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className="aylin-badge">
              {step === 'briefing' && 'ADIM 1: SAHA VERİLERİ'}
              {step === 'evidence' && 'ADIM 2: KANIT ANALİZİ'}
              {step === 'pipe_puzzle' && `ADIM 3: BORU AĞI (${stageIndex + 1}/3)`}
              {step === 'decision' && 'ADIM 4: MÜHENDİSLİK KARARI'}
              {step === 'completed' && 'GÖREV TAMAMLANDI'}
              {step === 'weather' && 'HAVA ALARM MERKEZİ'}
            </span>
            <button
              className="aylin-btn secondary"
              onClick={() => setSound(!sound)}
              title="Ses Efektleri"
            >
              {sound ? '🔊 Ses Açık' : '🔇 Sessiz'}
            </button>
            <button className="aylin-btn danger" onClick={onClose} title="Kapat">
              ✕
            </button>
          </div>
        </header>

        {/* PANORAMIC OBSERVATION DECK */}
        <section className="aylin-room">
          <div className="aylin-reservoir-view"></div>
          <div className="aylin-spill"></div>
          <div
            className="aylin-mono"
            style={{
              position: 'absolute',
              right: '16px',
              top: '12px',
              fontSize: '10px',
              color: 'rgba(217, 248, 250, 0.7)',
            }}
          >
            CANLI BARAJ REZERVİ · %{af.reservoirPct} · KRİTİK EŞİK %{af.criticalPct}
          </div>
          <div className="aylin-avatar">
            <div className="aylin-hair"></div>
            <div className="aylin-face"></div>
            <div className="aylin-body"></div>
            <div className="aylin-clip"></div>
          </div>
          <div className="aylin-bubble">
            <div className="aylin-eyebrow" style={{ color: '#f7c65a', marginBottom: '4px' }}>
              SU MÜHENDİSİ AYLIN
            </div>
            {step === 'briefing' &&
              `“Hoş geldin! Barajdan dakikada çıkan ${af.outflowL} L suyun tamamı mahallelere ulaşmıyor. Ölçümlerde dakikada ${af.leakL} L’lik garip bir kayıp var. Kasabada topladığımız verileri inceleyip gizemi çözelim.”`}
            {step === 'evidence' &&
              `“Topladığımız verileri masaya yatırdık. Barajdan dakikada çıkan ${af.outflowL} L’nin yalnızca ${af.deliveredL} L’si ulaşıyor. Islak zemin ve basınç düşüşü kanıtlarını incele ve hipotezini belirle!”`}
            {step === 'pipe_puzzle' &&
              '“Harika bir çıkarım! Boru hattında kaçak var. Parçaları döndürerek barajdan kasabaya kesintisiz bir akış yolu kur. Suyu hedefe ulaştırmalıyız!”'}
            {step === 'decision' &&
              '“Akışı kurtardın! Ama bu hat oldukça eski. Şimdi gerçek bir mühendis gibi karar vermeliyiz: Geçici bir yama mı, kalıcı bir yenileme mi, yoksa akıllı sensör mü?”'}
            {step === 'completed' &&
              '“Tebrikler! Bugün gerçek bir su mühendisi gibi çalıştın. Kanıtları analiz ettin, hattı bağladın ve kasabanın geleceği için dengeli bir karar verdin!”'}
            {step === 'weather' &&
              '“Boru hattı emniyette. Şimdi barajın hava radarına bağlanıp meteorolojik sinyalleri oku ve doğru baraj müdahalelerini seç!”'}
          </div>
        </section>

        {/* =========================================================================
            STAGE 1: BRIEFING & FIELD DATA COLLECTION
        ========================================================================== */}
        {step === 'briefing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="aylin-panel" style={{ padding: '20px' }}>
              <div className="aylin-eyebrow" style={{ color: '#5ae5f3', marginBottom: '8px' }}>
                KAYIP SUYUN PEŞİNDE · 3 BÖLGEDEN TOPLANAN SAHA VERİLERİ
              </div>
              <p style={{ fontSize: '13px', color: '#c7e4eb', marginBottom: '16px' }}>
                Kasabanın su şebekesinde meydana gelen kayıp debiyi tespit etmek için üç kilit noktayı ölçtük:
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '14px',
                }}
              >
                {/* Baraj */}
                <div
                  className="aylin-panel"
                  style={{ padding: '16px', borderLeft: '4px solid #5ae5f3' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '20px' }}>💧 BARAJ ÇIKIŞI</span>
                    <span className="aylin-badge">KAYNAK</span>
                  </div>
                  <strong style={{ fontSize: '24px', color: '#5ae5f3', display: 'block', margin: '8px 0' }}>
                    {af.outflowL} Litre / dk
                  </strong>
                  <p style={{ fontSize: '12px', color: '#9fc0c9', margin: 0 }}>
                    Baraj ana vanasından şebekeye pompalanan brüt su miktarı.
                  </p>
                </div>

                {/* Park */}
                <div
                  className="aylin-panel"
                  style={{
                    padding: '16px',
                    borderLeft: `4px solid ${hasParkData ? '#70e0a5' : '#f7c65a'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '20px' }}>🌳 PARK ÖLÇÜMÜ</span>
                    <span className="aylin-badge">
                      {hasParkData ? '✓ İNCELENDİ' : 'SAHA GÖZLEMİ'}
                    </span>
                  </div>
                  <strong style={{ fontSize: '24px', color: '#70e0a5', display: 'block', margin: '8px 0' }}>
                    {af.parkL} Litre / dk
                  </strong>
                  <p style={{ fontSize: '12px', color: '#9fc0c9', margin: 0 }}>
                    <strong>Kritik Gözlem:</strong> Boru hattı yakınında beklenmedik şekilde ıslak zemin ve çamurlaşma görüldü!
                  </p>
                </div>

                {/* Mahalle */}
                <div
                  className="aylin-panel"
                  style={{
                    padding: '16px',
                    borderLeft: `4px solid ${hasMahalleData ? '#70e0a5' : '#f7c65a'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '20px' }}>🏠 MAHALLE ÖLÇÜMÜ</span>
                    <span className="aylin-badge">
                      {hasMahalleData ? '✓ İNCELENDİ' : 'SAHA GÖZLEMİ'}
                    </span>
                  </div>
                  <strong style={{ fontSize: '24px', color: '#f7c65a', display: 'block', margin: '8px 0' }}>
                    {af.homesL} Litre / dk
                  </strong>
                  <p style={{ fontSize: '12px', color: '#9fc0c9', margin: 0 }}>
                    <strong>Kritik Gözlem:</strong> Evlerin musluklarında anormal su basıncı düşüşü rapor edildi.
                  </p>
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div className="aylin-mono" style={{ fontSize: '12px', color: '#89adb4' }}>
                Toplam Alınan Su: {af.parkL} L + {af.homesL} L = {af.deliveredL} L (Kayıp: {af.leakL} L)
              </div>
              <button
                className="aylin-btn"
                style={{ fontSize: '14px', padding: '12px 24px' }}
                onClick={() => setStep('evidence')}
              >
                Kanıt Analizine Başla →
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STAGE 2: MODULE A — KANIT ANALİZİ
        ========================================================================== */}
        {step === 'evidence' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="aylin-panel" style={{ padding: '20px' }}>
              <div className="aylin-eyebrow" style={{ color: '#f7c65a', marginBottom: '8px' }}>
                MÜHENDİSLİK ANALİZ MASASI · VERİ VE MATEMATİKSEL ÇIKARIM
              </div>
              <h2 style={{ fontSize: '20px', margin: '0 0 12px 0', color: '#fff' }}>
                Barajdan dakikada çıkan {af.outflowL} L suyun yalnızca {af.deliveredL} L’si ulaşıyor. Aradaki {af.leakL} L’ye ne olmuş olabilir?
              </h2>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '12px',
                  marginBottom: '20px',
                }}
              >
                <div className="aylin-stat">
                  <span className="aylin-mono" style={{ fontSize: '11px', color: '#89adb4' }}>
                    BARAJDAN ÇIKIŞ
                  </span>
                  <strong>{af.outflowL} Litre</strong>
                </div>
                <div className="aylin-stat">
                  <span className="aylin-mono" style={{ fontSize: '11px', color: '#89adb4' }}>
                    ULAŞAN TOPLAM SU
                  </span>
                  <strong style={{ color: '#70e0a5' }}>{af.deliveredL} Litre ({af.parkL} + {af.homesL})</strong>
                </div>
                <div className="aylin-stat" style={{ borderColor: 'rgba(255, 105, 118, 0.4)' }}>
                  <span className="aylin-mono" style={{ fontSize: '11px', color: '#ff6976' }}>
                    KAYIP / EKSİK SU
                  </span>
                  <strong style={{ color: '#ff6976' }}>{af.leakL} Litre (%{af.leakPct} Kayıp!)</strong>
                </div>
              </div>

              <div className="aylin-task" style={{ marginBottom: '20px' }}>
                <div className="aylin-eyebrow" style={{ color: '#f7c65a' }}>
                  DESTEKLEYİCİ SAHA KANITLARI
                </div>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', fontSize: '13px', lineHeight: 1.6 }}>
                  <li>✓ Park hattı borusu yakınında açıklanamayan <strong>ıslak zemin ve su birikintisi</strong>.</li>
                  <li>✓ Mahalle konutlarında şebeke basıncının <strong>anormal derecede düşmesi</strong>.</li>
                  <li>✓ Baraj su çıkış vanalarının <strong>tam kapasite ve sağlam</strong> çalışması.</li>
                </ul>
              </div>

              <div className="aylin-eyebrow" style={{ color: '#5ae5f3', marginBottom: '10px' }}>
                HİPOTEZİNİ SEÇ: BU KANITLARA GÖRE EN MANTIKLI MÜHENDİSLİK TEŞHİSİ NEDİR?
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  {
                    id: 0,
                    label: 'A) Baraj yeterince su üretmiyor.',
                    correct: false,
                    feedback: `İlginç bir tahmin ama barajdan dakikada ${af.outflowL} L çıktığını bizzat ölçtük. Üretim değil, dağıtım hattında bir sorun var.`,
                  },
                  {
                    id: 1,
                    label: 'B) Boru hattında yeraltı kaçağı veya çatlak olabilir.',
                    correct: true,
                    feedback: `Harika bir çıkarım! Topladığın kanıtlar (ıslak zemin, dakikada ${af.leakL} L kayıp ve basınç düşüşü) tam olarak boru hattındaki bir kaçağı kanıtlıyor.`,
                  },
                  {
                    id: 2,
                    label: 'C) Yağmur yağmadığı için su borunun içinde kaybolmuştur.',
                    correct: false,
                    feedback: `Yağışlar az ama borular yerin altındadır; buharlaşma boru içindeki dakikada ${af.leakL} L suyu yok edemez. Islak zemin ne anlatıyor?`,
                  },
                ].map((hyp) => {
                  const isPicked = selectedHypothesis === hyp.id;
                  const isCorrect = hyp.correct;
                  let styleClass = 'aylin-forecast-option';
                  if (hypothesisAnswered) {
                    if (isPicked) styleClass += isCorrect ? ' correct' : ' wrong';
                    else if (isCorrect) styleClass += ' correct';
                  }

                  return (
                    <button
                      key={hyp.id}
                      className={styleClass}
                      onClick={() => {
                        setSelectedHypothesis(hyp.id);
                        setHypothesisAnswered(true);
                        playTone(hyp.correct ? 'win' : 'alert', sound);
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '14px' }}>{hyp.label}</strong>
                        {hypothesisAnswered && isPicked && (
                          <span className="aylin-mono" style={{ fontSize: '12px' }}>
                            {isCorrect ? '✓ DOĞRU' : '✗ TEKRAR DÜŞÜN'}
                          </span>
                        )}
                      </div>
                      {hypothesisAnswered && isPicked && (
                        <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#c7e4eb', lineHeight: 1.5 }}>
                          {hyp.feedback}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button className="aylin-btn secondary" onClick={() => setStep('briefing')}>
                ← Verilere Geri Dön
              </button>
              <button
                className="aylin-btn"
                style={{ fontSize: '14px', padding: '12px 24px' }}
                disabled={!hypothesisAnswered || selectedHypothesis !== 1}
                onClick={() => setStep('pipe_puzzle')}
              >
                Boru Hattını Kurtar Mini-Oyununa Geç →
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STAGE 3: MODULE B — BORU HATTINI KURTAR (MANUS PUZZLE ADAPTED)
        ========================================================================== */}
        {step === 'pipe_puzzle' && (
          <div>
            {/* Top Bar for Puzzle */}
            <div
              className="aylin-panel"
              style={{
                padding: '12px 18px',
                marginBottom: '16px',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div>
                  <div className="aylin-eyebrow">HEDEF</div>
                  <strong>{stage.subtitle}</strong>
                </div>
                <div style={{ width: '1px', height: '30px', background: '#315664' }}></div>
                <div>
                  <div className="aylin-eyebrow">SÜRE</div>
                  <strong style={{ color: timeLeft < 18 ? '#ff6976' : '#5ae5f3', fontSize: '18px' }}>
                    {timeLeft}s
                  </strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={`aylin-badge ${connected.has(targetKey) ? 'text-emerald-200' : ''}`}>
                  {connected.has(targetKey) ? '✓ AKIŞ HEDEFİNE ULAŞTI' : '⚠ BORU AĞI KESİK'}
                </span>
                <span className="aylin-mono" style={{ fontSize: '11px', color: '#89adb4' }}>
                  Bölüm {stageIndex + 1}/3
                </span>
              </div>
            </div>

            {/* Layout: Grid + Sidebar */}
            <div className="aylin-layout">
              {/* Board Panel */}
              <section className="aylin-panel" style={{ padding: '16px 20px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '14px',
                  }}
                >
                  <div>
                    <div className="aylin-eyebrow">DÖNDÜRÜLEBİLİR BORU AĞI</div>
                    <h3 style={{ margin: '2px 0 0 0', fontSize: '16px' }}>Akış Yolunu Tamamla</h3>
                  </div>
                  <span className="aylin-mono" style={{ fontSize: '11px', color: '#89adb4' }}>
                    Baraj [Sol] → Arıtma / Mahalle [Sağ]
                  </span>
                </div>

                <div className="aylin-board">
                  {board.map((row, r) =>
                    row.map((cell, c) => {
                      const active = connected.has(key(r, c));
                      const isEnds = cell.kind === 'source' || cell.kind === 'target';
                      let tileClass = 'aylin-tile';
                      if (!cell.kind) tileClass += ' empty';
                      if (cell.kind === 'source') tileClass += ' source';
                      if (cell.kind === 'target') tileClass += ' target';
                      if (active) tileClass += ' powered';

                      return (
                        <button
                          key={key(r, c)}
                          disabled={!cell.kind || isEnds}
                          onClick={() => rotateTile(r, c)}
                          className={tileClass}
                          title={`${r + 1}. satır ${c + 1}. parça`}
                        >
                          {cell.kind ? (
                            <PipeSVG cell={cell} powered={active} />
                          ) : (
                            <span style={{ fontSize: '9px', color: '#315563' }}>+</span>
                          )}
                        </button>
                      );
                    }),
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '16px',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#89adb4' }}>
                    <span>🟡 Baraj Girişi</span>
                    <span>🟢 Akış Bağlandı</span>
                    <span>🔴 Kritik Eşik</span>
                  </div>
                  <button className="aylin-btn secondary" onClick={restartPuzzle}>
                    ↻ Hattı Sıfırla
                  </button>
                </div>
              </section>

              {/* Sidebar */}
              <aside style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <section className="aylin-panel" style={{ padding: '16px' }}>
                  <div className="aylin-eyebrow">BARAJ REZERVİ DURUMU</div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      marginTop: '8px',
                    }}
                  >
                    <strong
                      style={{
                        fontSize: '36px',
                        color: waterLevel <= af.criticalPct ? '#ff6976' : '#5ae5f3',
                      }}
                    >
                      %{Math.round(waterLevel)}
                    </strong>
                    <span className="aylin-mono" style={{ fontSize: '11px', color: '#89adb4' }}>
                      Kritik Eşik: %{af.criticalPct}
                    </span>
                  </div>
                  <div className={`aylin-bar ${waterLevel <= af.criticalPct ? 'critical' : ''}`} style={{ marginTop: '10px' }}>
                    <i style={{ width: `${waterLevel}%` }}></i>
                  </div>
                  <div
                    className="aylin-mono"
                    style={{
                      fontSize: '10px',
                      color: '#89adb4',
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: '8px',
                    }}
                  >
                    <span>Hatalı dönüş = su sızıntısı</span>
                    <span>Geçen yıl: %{af.history.lastYear}</span>
                  </div>
                </section>

                <section className="aylin-task">
                  <div className="aylin-eyebrow" style={{ color: '#f7c65a' }}>
                    MÜHENDİSLİK İPUCU
                  </div>
                  <p style={{ margin: '6px 0 0 0', fontSize: '13px', lineHeight: 1.5 }}>
                    {stage.clue}
                  </p>
                  <p className="aylin-mono" style={{ fontSize: '11px', color: '#89adb4', marginTop: '6px' }}>
                    Parçaya her tıkladığında 90° döner. Suyun kesintisiz yolu bulması şart.
                  </p>
                </section>

                <section className="aylin-panel" style={{ padding: '16px' }}>
                  <div className="aylin-eyebrow">İKLİM SİNYALİ VERİLERİ</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                    <div className="aylin-stat">
                      <span className="aylin-mono" style={{ fontSize: '10px', color: '#89adb4' }}>
                        YAĞIŞ
                      </span>
                      <strong style={{ fontSize: '16px', color: '#f7c65a' }}>
                        {stageIndex === 0 ? 'Normal' : `−%${af.rainDeficitPct} Düşüş`}
                      </strong>
                    </div>
                    <div className="aylin-stat">
                      <span className="aylin-mono" style={{ fontSize: '10px', color: '#89adb4' }}>
                        BUHARLAŞMA
                      </span>
                      <strong style={{ fontSize: '16px', color: '#ff6976' }}>
                        {stageIndex < 2 ? 'Normal' : `+%${af.evaporationPct} Artış`}
                      </strong>
                    </div>
                  </div>
                </section>
              </aside>
            </div>

            {/* In-game Puzzle Modals */}
            {puzzleStatus === 'won' && (
              <div className="aylin-modal">
                <div className="aylin-modal-card">
                  <div className="aylin-eyebrow" style={{ color: '#70e0a5' }}>
                    AKIŞ RESTORE EDİLDİ · TEBRİKLER!
                  </div>
                  <h2 style={{ fontSize: '26px', color: '#aaf3c9', margin: '8px 0' }}>
                    Harika iş, mühendis!
                  </h2>
                  <p style={{ fontSize: '14px', color: '#d9f8fa', lineHeight: 1.6 }}>
                    Su boru hattından geçerek kasabanın arıtma deposuna ve mahalleye başarıyla ulaştı. 
                    Sistemin bir parçasındaki kopukluğun tüm kasabayı susuz bırakabileceğini uygulamalı olarak gördün.
                  </p>
                  <div style={{ display: 'flex', gap: '8px', margin: '18px 0' }}>
                    <span className="aylin-badge">+ KESİNTİSİZ AKIŞ KURULDU</span>
                    <span className="aylin-badge">+ {af.leakL} LİTRE SU KURTARILDI</span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      className="aylin-btn"
                      onClick={() => {
                        if (stageIndex >= stages.length - 1) {
                          setStep('decision');
                        } else {
                          nextStage();
                        }
                      }}
                    >
                      {stageIndex >= stages.length - 1
                        ? 'Mühendislik Kararına Geç →'
                        : 'Sonraki Seviyeye Geç →'}
                    </button>
                    <button className="aylin-btn secondary" onClick={restartPuzzle}>
                      Tekrar Dene
                    </button>
                  </div>
                </div>
              </div>
            )}

            {puzzleStatus === 'lost' && (
              <div className="aylin-modal">
                <div className="aylin-modal-card loss">
                  <div className="aylin-eyebrow" style={{ color: '#ff6976' }}>
                    AKIŞ KESİNTİSİ · REZERV ALARMI
                  </div>
                  <h2 style={{ fontSize: '24px', color: '#ff8591', margin: '8px 0' }}>
                    Rezerv kritik eşiğin altına indi!
                  </h2>
                  <p style={{ fontSize: '13px', color: '#d9f8fa', lineHeight: 1.5 }}>
                    Süre doldu veya hatalı boru bağlantıları yüzünden su seviyesi kritik %{af.criticalPct} sınırına geriledi.
                    Aylin: “Pes etmek yok! Kısa yolu değil, sürekli ve dengeli akışı ara.”
                  </p>
                  <button className="aylin-btn danger" style={{ marginTop: '16px' }} onClick={restartPuzzle}>
                    ↻ Yeniden Başlat
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            STAGE 4: MODULE C — MÜHENDİSLİK KARARI
        ========================================================================== */}
        {step === 'decision' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="aylin-panel" style={{ padding: '20px' }}>
              <div className="aylin-eyebrow" style={{ color: '#5ae5f3', marginBottom: '8px' }}>
                MÜHENDİSLİK KARAR SİMÜLATÖRÜ · UZUN VADELİ PLANLAMA
              </div>
              <h2 style={{ fontSize: '20px', color: '#fff', margin: '0 0 10px 0' }}>
                Boru hattındaki sızıntıyı geçici olarak durdurduk. Ancak bu altyapı 40 yıllık. Hangi kalıcı çözümü seçmeliyiz?
              </h2>
              <p style={{ fontSize: '13px', color: '#89adb4', margin: '0 0 18px 0' }}>
                Belediyenin sınırlı bütçesi (₺1.000.000), dayanıklılık ve su tasarrufu arasında denge kurmalısın.
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '14px',
                }}
              >
                {/* Option A */}
                <div
                  className={`aylin-panel ${selectedDecision === 'patch' ? 'selected' : ''}`}
                  style={{
                    padding: '18px',
                    border: selectedDecision === 'patch' ? '2px solid #f7c65a' : '1px solid #315563',
                    background: selectedDecision === 'patch' ? 'rgba(247, 198, 90, 0.12)' : undefined,
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelectedDecision('patch')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#f7c65a' }}>
                      Seçenek A: Çatlağı Onar (Geçici Yama)
                    </h3>
                    <input
                      type="radio"
                      checked={selectedDecision === 'patch'}
                      onChange={() => setSelectedDecision('patch')}
                    />
                  </div>
                  <p style={{ fontSize: '12px', color: '#c7e4eb', margin: '10px 0' }}>
                    Mevcut patlağı kelepçe ve yama ile hızla kapatır. Düşük maliyetlidir ancak boru eski olduğu için tekrar patlama riski yüksektir.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                    <div>💰 Maliyet: <strong>₺150.000</strong></div>
                    <div>💧 Kalan Kayıp: <strong>%{af.aylinRemainPct.patch}</strong></div>
                    <div>🛡️ Dayanıklılık: <strong>1-2 Yıl</strong></div>
                    <div>⚠️ Risk: <strong>Yüksek</strong></div>
                  </div>
                </div>

                {/* Option B */}
                <div
                  className={`aylin-panel ${selectedDecision === 'replace' ? 'selected' : ''}`}
                  style={{
                    padding: '18px',
                    border: selectedDecision === 'replace' ? '2px solid #70e0a5' : '1px solid #315563',
                    background: selectedDecision === 'replace' ? 'rgba(112, 224, 165, 0.12)' : undefined,
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelectedDecision('replace')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#70e0a5' }}>
                      Seçenek B: Eski Boruyu Değiştir (Kalıcı Çözüm)
                    </h3>
                    <input
                      type="radio"
                      checked={selectedDecision === 'replace'}
                      onChange={() => setSelectedDecision('replace')}
                    />
                  </div>
                  <p style={{ fontSize: '12px', color: '#c7e4eb', margin: '10px 0' }}>
                    Hattı modern polietilen borularla tamamen yeniler. İlk maliyeti yüksektir ancak kaçakları sıfırlar ve 15 yıl sorunsuz çalışır.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                    <div>💰 Maliyet: <strong>₺400.000</strong></div>
                    <div>💧 Kalan Kayıp: <strong>%{af.aylinRemainPct.replace} (Sıfır)</strong></div>
                    <div>🛡️ Dayanıklılık: <strong>15+ Yıl</strong></div>
                    <div>🌱 Çevre Etkisi: <strong>Mükemmel</strong></div>
                  </div>
                </div>

                {/* Option C */}
                <div
                  className={`aylin-panel ${selectedDecision === 'sensor' ? 'selected' : ''}`}
                  style={{
                    padding: '18px',
                    border: selectedDecision === 'sensor' ? '2px solid #5ae5f3' : '1px solid #315563',
                    background: selectedDecision === 'sensor' ? 'rgba(90, 229, 243, 0.12)' : undefined,
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelectedDecision('sensor')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#5ae5f3' }}>
                      Seçenek C: İzleme Sensörü Kur (Erken Uyarı)
                    </h3>
                    <input
                      type="radio"
                      checked={selectedDecision === 'sensor'}
                      onChange={() => setSelectedDecision('sensor')}
                    />
                  </div>
                  <p style={{ fontSize: '12px', color: '#c7e4eb', margin: '10px 0' }}>
                    Basınç ve akış sensörleri yerleştirir. Yeni kaçakları anında haber verir ANCAK mevcut fiziksel sızıntıyı tek başına tamir etmez.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                    <div>💰 Maliyet: <strong>₺100.000</strong></div>
                    <div>💧 Kalan Kayıp: <strong>%{af.aylinRemainPct.sensor}</strong></div>
                    <div>🛡️ Dayanıklılık: <strong>Orta</strong></div>
                    <div>📡 Özellik: <strong>Erken Uyarı</strong></div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button className="aylin-btn secondary" onClick={() => setStep('pipe_puzzle')}>
                ← Boru Hattına Geri Dön
              </button>
              <button
                className="aylin-btn"
                style={{ fontSize: '14px', padding: '12px 24px' }}
                onClick={() => setStep('completed')}
              >
                Kararı Kesinleştir ve Uygula →
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STAGE 5: GÖREV TAMAMLANDI & GENÇ SU MÜHENDİSİ ROZETİ
        ========================================================================== */}
        {step === 'completed' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="aylin-panel" style={{ padding: '28px', textAlign: 'center' }}>
              <span style={{ fontSize: '48px', display: 'block', marginBottom: '8px' }}>🏆</span>
              <div className="aylin-eyebrow" style={{ color: '#70e0a5', marginBottom: '8px' }}>
                YENİ BAŞARI KİLİDİ AÇILDI
              </div>
              <h2 style={{ fontSize: '28px', color: '#aaf3c9', margin: '0 0 12px 0' }}>
                Genç Su Mühendisi
              </h2>
              <p
                style={{
                  maxWidth: '680px',
                  margin: '0 auto 20px auto',
                  fontSize: '14px',
                  lineHeight: 1.6,
                  color: '#d9f8fa',
                }}
              >
                Aylin: “Bugün gerçek bir mühendis gibi çalıştın! Önce veri topladın, sonra kanıtları karşılaştırdın,
                bir çözüm tasarladın ve sonuçlarını gördün. Unutma, iyi mühendislik yalnızca bir sorunu anlık çözmek değil,
                seçtiğimiz çözümün gelecekteki etkilerini de hesaba katmaktır.”
              </p>

              <div
                style={{
                  display: 'inline-flex',
                  flexDirection: 'column',
                  gap: '8px',
                  textAlign: 'left',
                  background: 'rgba(5, 19, 27, 0.7)',
                  border: '1px solid rgba(86, 224, 239, 0.3)',
                  padding: '16px 20px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ color: '#5ae5f3', fontWeight: 'bold' }}>
                  📋 Kasaba Kayıtlarına Eklenen Mühendislik Özeti:
                </div>
                <div style={{ fontSize: '13px', color: '#c7e4eb' }}>
                  • <strong>Bulgu:</strong> Baraj çıkışı ({af.outflowL} L/dk) ile tüketim ({af.deliveredL} L/dk) arasındaki {af.leakL} L/dk kaçak yeraltı sızıntısıydı.
                </div>
                <div style={{ fontSize: '13px', color: '#c7e4eb' }}>
                  • <strong>Müdahale:</strong> Boru ağı rotalandı ve akış kesintisiz sağlandı.
                </div>
                <div style={{ fontSize: '13px', color: '#c7e4eb' }}>
                  • <strong>Seçilen Strateji:</strong>{' '}
                  {selectedDecision === 'patch' && 'Geçici Yama (Düşük maliyetli kısa vadeli onarım)'}
                  {selectedDecision === 'replace' && 'Boru Yenileme (Kalıcı, kaçaksız uzun vadeli yatırım)'}
                  {selectedDecision === 'sensor' && 'İzleme Sensörü (Elektronik erken uyarı sistemi)'}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <button
                  className="aylin-btn"
                  style={{ fontSize: '14px', padding: '12px 28px' }}
                  onClick={handleFinalSubmit}
                >
                  ✓ Kanıtı Deftere Kaydet ve Kasabaya Dön
                </button>
                <button
                  className="aylin-btn secondary"
                  style={{ fontSize: '14px', padding: '12px 20px' }}
                  onClick={() => setStep('weather')}
                >
                  🌦️ Hava Alarm Merkezini Keşfet (Bonus Oyun)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STAGE 6: WEATHER ALERT CENTER (MANUS PROTOTYPE BONUS GAME)
        ========================================================================== */}
        {step === 'weather' && (
          <div>
            <div
              className="aylin-panel"
              style={{
                padding: '12px 18px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div className="aylin-eyebrow">HAVA ALARM MERKEZİ · İKLİM VERİ OKURYAZARLIĞI</div>
                <strong>3 Hava Deseni İçin Doğru Baraj Müdahalesini Seç</strong>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span className="aylin-badge">TUR {weatherRound + 1}/3</span>
                <span className="aylin-badge">SKOR {weatherScore}/3</span>
                <button className="aylin-btn secondary" onClick={() => setStep('completed')}>
                  ← Geri Dön
                </button>
              </div>
            </div>

            <div className="aylin-weather-grid">
              {/* Climate Data Panel */}
              <section className="aylin-panel" style={{ padding: '18px' }}>
                <div className="aylin-eyebrow">GELEN RADAR VE HAVA VERİSİ</div>
                <h2 style={{ fontSize: '20px', margin: '6px 0 2px 0' }}>
                  {weatherRounds[weatherRound].title}
                </h2>
                <div className="aylin-mono" style={{ fontSize: '11px', color: '#5ae5f3' }}>
                  {weatherRounds[weatherRound].month}
                </div>

                <div
                  style={{
                    height: '110px',
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1px solid rgba(86, 224, 239, 0.25)',
                    borderRadius: '8px',
                    background: 'linear-gradient(180deg, #153c58, #071923)',
                    marginTop: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: '44px', filter: 'drop-shadow(0 0 10px rgba(90, 229, 243, 0.4))' }}>
                    {weatherRounds[weatherRound].icon}
                  </span>
                  <div
                    className="aylin-mono"
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '12px',
                      fontSize: '10px',
                      color: '#89adb4',
                    }}
                  >
                    RADAR CANLI TARAMA AKTİF
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '10px',
                    marginTop: '14px',
                  }}
                >
                  <div className="aylin-stat">
                    <span className="aylin-mono" style={{ fontSize: '10px', color: '#89adb4' }}>
                      YAĞIŞ
                    </span>
                    <strong style={{ fontSize: '18px', color: '#f7c65a' }}>
                      {weatherRounds[weatherRound].rain}
                    </strong>
                  </div>
                  <div className="aylin-stat">
                    <span className="aylin-mono" style={{ fontSize: '10px', color: '#89adb4' }}>
                      SICAKLIK
                    </span>
                    <strong style={{ fontSize: '18px', color: '#ff6976' }}>
                      {weatherRounds[weatherRound].temp}
                    </strong>
                  </div>
                  <div className="aylin-stat">
                    <span className="aylin-mono" style={{ fontSize: '10px', color: '#89adb4' }}>
                      BUHARLAŞMA
                    </span>
                    <strong style={{ fontSize: '18px', color: '#5ae5f3' }}>
                      {weatherRounds[weatherRound].evap}
                    </strong>
                  </div>
                </div>

                <div className="aylin-task" style={{ marginTop: '14px' }}>
                  <div className="aylin-eyebrow" style={{ color: '#f7c65a' }}>
                    AYLİN’İN İKLİM GÖZLEMİ
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
                    {weatherRounds[weatherRound].clue}
                  </p>
                </div>
              </section>

              {/* Action Decision Panel */}
              <section className="aylin-panel" style={{ padding: '18px' }}>
                <div className="aylin-eyebrow">BARAJ KONTROL KONSOLU</div>
                <h3 style={{ fontSize: '18px', margin: '6px 0 4px 0' }}>
                  Bu iklim sinyaline karşı hangi karar doğrudur?
                </h3>
                <p style={{ fontSize: '12px', color: '#89adb4', margin: '0 0 16px 0' }}>
                  Tek bir parametreye değil; yağış, sıcaklık ve buharlaşmanın birleşik desenine bak.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {weatherRounds[weatherRound].options.map(([id, label, reason]) => {
                    const isPicked = weatherAnswer === id;
                    const isCorrect = id === weatherRounds[weatherRound].answer;
                    let cls = 'aylin-forecast-option';
                    if (weatherAnswer) {
                      if (isPicked) cls += isCorrect ? ' correct' : ' wrong';
                      else if (isCorrect) cls += ' correct';
                    }

                    return (
                      <button
                        key={id}
                        className={cls}
                        onClick={() => chooseWeather(id)}
                        disabled={!!weatherAnswer}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '13px' }}>{label}</strong>
                          {weatherAnswer && isPicked && (
                            <span className="aylin-mono" style={{ fontSize: '11px' }}>
                              {isCorrect ? '✓' : '✗'}
                            </span>
                          )}
                        </div>
                        {weatherAnswer && isPicked && (
                          <div style={{ fontSize: '11px', color: '#c7e4eb', marginTop: '6px', lineHeight: 1.4 }}>
                            {reason}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>

            {weatherDone && (
              <div className="aylin-modal">
                <div className="aylin-modal-card">
                  <div className="aylin-eyebrow" style={{ color: '#70e0a5' }}>
                    İKLİM SİNYALLERİ SINIFLANDIRILDI
                  </div>
                  <h2 style={{ fontSize: '26px', color: '#aaf3c9', margin: '8px 0' }}>
                    Hava radarı başarıyla analiz edildi!
                  </h2>
                  <p style={{ fontSize: '14px', color: '#d9f8fa', lineHeight: 1.6 }}>
                    3 hava alarmını da doğru sınıflandırdın. Baraj yönetimi sadece borulardan ibaret değildir;
                    yağış, sıcaklık ve mevsimsel buharlaşma birlikte okunmalıdır.
                  </p>
                  <div style={{ display: 'flex', gap: '8px', margin: '16px 0' }}>
                    <span className="aylin-badge">SKOR: {weatherScore}/3</span>
                    <span className="aylin-badge">YENİ ROZET: HAVA ANALİSTİ</span>
                  </div>
                  <button className="aylin-btn" onClick={handleFinalSubmit}>
                    ✓ Kasabaya Dön
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
