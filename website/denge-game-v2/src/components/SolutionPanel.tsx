import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';

import {
  HORIZON_LABELS,
  RESOLVES_LABELS,
  SOLUTION_BUDGET,
  SOLUTION_CARDS,
  STAKEHOLDER_LABELS,
  type SolutionCard,
  type Stakeholder,
} from '../Game/data/story';
import { activeFacts, activeScenario } from '../Game/scenario';
import { analyzeGameTheory } from '../Game/scenario/gameTheory';
import { simulate, type SolutionId } from '../Game/scenario/model';
import type { SolutionPanelMode } from '../Game/events/gameEvents';
import type { CouncilFloatingBadge } from './workshop/council/MayorCouncilDiorama';
import type {
  CouncilCameraMode,
  CouncilMemberId,
  VoteLampState,
} from './workshop/council/MayorCouncilScene';
import { playTone } from './workshop/audio';

const MayorCouncilDiorama = lazy(() => import('./workshop/council/MayorCouncilDiorama'));

type SolutionPanelProps = {
  mode?: SolutionPanelMode;
  onSubmit: (selected: SolutionCard[], totalCost: number, rationale: string) => void;
};

type CouncilPhase = 'debate' | 'podium' | 'voting';

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternativeLike;
  isFinal: boolean;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const tl = (n: number) => `₺${n.toLocaleString('tr-TR')}`;

const STAKEHOLDERS: readonly Stakeholder[] = ['ev', 'tarim', 'park', 'su'];

const RATIONALE_CHOICES = [
  'En çok suyu kaybeden boru kaçağını çözüp evleri korumak istedim',
  'Hem tarlaları hem de evlerin içme suyunu dengeli korumak istedim',
  'Parkın süs sularından vazgeçip uzun vadede kalıcı çözümleri seçtim',
];

const COUNCIL_META: Record<
  CouncilMemberId,
  { title: string; role: string; icon: string }
> = {
  mayor: {
    title: 'Başkan Adil',
    role: 'Belediye & Meclis Başkanı',
    icon: '🏛️',
  },
  budget: {
    title: 'Selim Bey',
    role: 'Bütçe ve Mali Hizmetler Komisyonu',
    icon: '💼',
  },
  water: {
    title: 'Hakan Bey',
    role: 'SUKİ (Su ve Kanalizasyon) Müdürü',
    icon: '🚰',
  },
  ecology: {
    title: 'Zeynep Hanım',
    role: 'Çevre, İklim ve Kırsal Komisyonu',
    icon: '🌿',
  },
  social: {
    title: 'Leyla Hanım',
    role: 'Sosyal İşler ve Halkla İlişkiler',
    icon: '⚖️',
  },
};

const VOTE_ORDER: readonly CouncilMemberId[] = [
  'budget',
  'water',
  'ecology',
  'social',
  'mayor',
];

export default function SolutionPanel({ mode = 'initial', onSubmit }: SolutionPanelProps) {
  const isRetry = mode === 'retry';
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<CouncilPhase>('debate');
  const [rationale, setRationale] = useState('');
  const [listening, setListening] = useState(false);

  const [activeSpeaker, setActiveSpeaker] = useState<CouncilMemberId>('mayor');
  const [cameraMode, setCameraMode] = useState<CouncilCameraMode>('overview');
  const [gavelStrikeCount, setGavelStrikeCount] = useState(1);
  const [customSpeech, setCustomSpeech] = useState<string | null>(null);

  const [votes, setVotes] = useState<Record<CouncilMemberId, VoteLampState>>({
    mayor: 'idle',
    budget: 'idle',
    water: 'idle',
    ecology: 'idle',
    social: 'idle',
  });
  const [votingFinished, setVotingFinished] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const speechSupported = getSpeechRecognitionCtor() !== null;

  // Memoize scenario and facts so references stay stable across renders!
  const scenario = useMemo(() => activeScenario(), []);
  const f = useMemo(() => activeFacts(), []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const spent = SOLUTION_CARDS.filter((c) => picked.has(c.id)).reduce((sum, c) => sum + c.cost, 0);
  const remaining = SOLUTION_BUDGET - spent;
  const selected = SOLUTION_CARDS.filter((c) => picked.has(c.id));
  const pickedList = useMemo(() => [...picked], [picked]);
  const outcome = useMemo(
    () => simulate(scenario.params, pickedList),
    [scenario.params, pickedList],
  );
  const gt = useMemo(
    () => analyzeGameTheory(scenario.params, pickedList),
    [scenario.params, pickedList],
  );

  /** Every stakeholder axis the current package touches. */
  const covered = new Set<Stakeholder>(selected.flatMap((c) => c.serves));

  /** Dynamic parliamentary opinion per commission member driven by Game Theory payoffs. */
  const memberOpinion = useMemo<
    Record<CouncilMemberId, { short: string; speech: string; vote: VoteLampState; payoff: number }>
  >(() => {
    const hasRepair = picked.has('repair-pipes');
    const hasDrip = picked.has('drip-irrigation');
    const hasRain = picked.has('rain-harvest');
    const hasFountains = picked.has('fountains-off');
    const hasSaving = picked.has('saving-campaign');

    return {
      mayor: {
        short:
          pickedList.length === 0
            ? 'Tasarı maddelerini bekliyor'
            : `Nash Uzlaşma: %${gt.nashScore} · Rezerv: %${outcome.reservoirAfter}`,
        speech:
          pickedList.length === 0
            ? `Değerli meclis üyeleri ve genç temsilcimiz, oturumu açıyorum! Kasabamızın baraj doluluğu %${f.reservoirPct} seviyesindedir. ₺1.000.000 bütçemizle tüm komisyonların ortak uzlaşısını (Nash dengesini) sağlayacak paketi müzakereye sunuyorum.`
            : `${gt.equilibriumLabel}. Mevcut tasarı ${tl(spent)} bütçe kullanıyor ve 30 gün sonunda baraj rezervimizi %${outcome.reservoirBefore} seviyesinden %${outcome.reservoirAfter} seviyesine taşıyor.`,
        vote: gt.nashScore >= 65 ? 'yes' : 'caution',
        payoff: gt.nashScore,
      },
      budget: {
        short: `Mali Fayda: %${gt.payoffs.fiscal} · Kalan: ${tl(remaining)}`,
        speech:
          spent === 0
            ? `Mali Hizmetler Komisyonu olarak kasaba kasasındaki ${tl(SOLUTION_BUDGET)} kaynağın en yüksek su/maliyet çarpanına sahip kalemlere tahsis edilmesini bekliyoruz.`
            : remaining >= 150_000
              ? `Bütçenin ${tl(spent)}’lik kısmı kullanıldı, kasada ${tl(remaining)} ihtiyat payı bırakıldı (Mali fayda skoru: %${gt.payoffs.fiscal}). Komisyonumuz mali dengeyi onaylıyor.`
              : `${tl(spent)} ile bütçe tavanımıza dayandık (${tl(remaining)} kaldı). İhtiyat akçesinden feragat edildi ancak altyapı geri dönüşümü nedeniyle onay veriyoruz.`,
        vote: gt.payoffs.fiscal >= 55 ? 'yes' : 'caution',
        payoff: gt.payoffs.fiscal,
      },
      water: {
        short: hasRepair
          ? `✓ Su Faydası: %${gt.payoffs.water} (Kaçak ${outcome.leakAfterL} L/dk)`
          : `⚠️ Su Faydası: %${gt.payoffs.water} (Kaçak ${f.leakL} L/dk)`,
        speech: hasRepair
          ? `SUKİ Müdürlüğü olarak ana boru hattı onarımının pakete alınmasını tam destekliyoruz! Dakikada ${f.leakL} L olan şebeke sızıntımız ${outcome.leakAfterL} L/dk’ya düşecek (Altyapı faydası: %${gt.payoffs.water}).`
          : `Sayın Başkan, şebekemizde dakikada ${f.leakL} L (%${f.leakPct}) temiz su toprağa karışıyor. Ana boru onarımından feragat edilmesi su güvenliği faydamızı %${gt.payoffs.water} seviyesinde bıraktı; şerh düşüyoruz!`,
        vote: gt.payoffs.water >= 58 ? 'yes' : 'caution',
        payoff: gt.payoffs.water,
      },
      ecology: {
        short: hasDrip
          ? `✓ Tarım/Eko Fayda: %${gt.payoffs.ecology} (${outcome.farmAfterL} L/dk)`
          : `⚠️ Tarım/Eko Fayda: %${gt.payoffs.ecology} (${f.farmL} L/dk)`,
        speech: hasDrip
          ? `Çevre ve Kırsal Hizmetler Komisyonu adına tarımda damla sulamaya geçilmesini kutluyorum! Kanal çekimi ${f.farmL} L/dk’dan ${outcome.farmAfterL} L/dk’ya inerken üretimimiz korunacak (Fayda: %${gt.payoffs.ecology}).`
          : hasRain
            ? `Yağmur suyu depoları yeşil alanlarımızı korur ancak ${f.farmL} L/dk su çeken tarım vadisi damla sulamadan feragat etmek zorunda kaldı (Fayda: %${gt.payoffs.ecology}).`
            : `Kuraklıkta buharlaşma %${f.evaporationPct} arttı. Tarım ve yeşil alan yatırımlarından feragat edilmesi kırsal üretim faydamızı %${gt.payoffs.ecology} seviyesine düşürdü.`,
        vote: gt.payoffs.ecology >= 55 ? 'yes' : 'caution',
        payoff: gt.payoffs.ecology,
      },
      social: {
        short:
          hasRepair || hasSaving
            ? `✓ Sosyal Fayda: %${gt.payoffs.social} (İçme suyu güvende)`
            : `⚠️ Sosyal Fayda: %${gt.payoffs.social} (Basınç düşük)`,
        speech:
          hasRepair && hasSaving
            ? `Sosyal İşler Komisyonu olarak hem boru onarımıyla musluk basıncının yükseltilmesini hem de ev içi tasarruf bilincini çok yerinde buluyoruz (Sosyal fayda: %${gt.payoffs.social}).`
            : hasFountains && !hasRepair && !hasSaving
              ? `Park fıskiyelerinin kapatılması tasarruf sağlar ancak mahalle sakinlerimizin beklediği ev içi basınç iyileştirmesinden feragat edildi (Sosyal fayda: %${gt.payoffs.social}).`
              : `Mahallelerimizde musluklara dakikada ${f.homesL} L su ulaşıyor. Konut refahı faydamız şu an %${gt.payoffs.social} düzeyindedir.`,
        vote: gt.payoffs.social >= 55 ? 'yes' : 'caution',
        payoff: gt.payoffs.social,
      },
    };
  }, [picked, pickedList.length, spent, remaining, outcome, f, gt]);

  // Keep latest memberOpinion in a ref so the voting timer effect never resets mid-flight!
  const memberOpinionRef = useRef(memberOpinion);
  useEffect(() => {
    memberOpinionRef.current = memberOpinion;
  }, [memberOpinion]);

  // Trigger automated roll-call voting when phase enters 'voting'
  useEffect(() => {
    if (phase !== 'voting') return;

    const timers: number[] = [];
    VOTE_ORDER.forEach((memberId, index) => {
      const t = window.setTimeout(() => {
        const currentOpinions = memberOpinionRef.current;
        playTone('tap', true);
        setActiveSpeaker(memberId);
        setCustomSpeech(null);
        setVotes((prev) => ({
          ...prev,
          [memberId]: currentOpinions[memberId].vote,
        }));
        if (index === VOTE_ORDER.length - 1) {
          playTone('win', true);
          setGavelStrikeCount((c) => c + 1);
          setVotingFinished(true);
        }
      }, (index + 1) * 380);
      timers.push(t);
    });

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [phase]);

  const finishVotingImmediately = () => {
    const currentOpinions = memberOpinionRef.current;
    setVotes({
      budget: currentOpinions.budget.vote,
      water: currentOpinions.water.vote,
      ecology: currentOpinions.ecology.vote,
      social: currentOpinions.social.vote,
      mayor: currentOpinions.mayor.vote,
    });
    setActiveSpeaker('mayor');
    setGavelStrikeCount((c) => c + 1);
    setVotingFinished(true);
    playTone('win', true);
  };

  const toggleVoiceDictation = () => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    try {
      const rec = new Ctor();
      rec.lang = 'tr-TR';
      rec.interimResults = false;
      rec.continuous = false;
      rec.onresult = (ev: SpeechRecognitionEventLike) => {
        const parts: string[] = [];
        for (let i = 0; i < ev.results.length; i += 1) {
          const item = ev.results[i];
          if (item && item[0]?.transcript) {
            parts.push(item[0].transcript.trim());
          }
        }
        const spoken = parts.join(' ').trim();
        if (spoken) {
          setRationale((prev) => {
            const base = prev.trim();
            return base ? `${base} ${spoken}`.slice(0, 280) : spoken.slice(0, 280);
          });
        }
      };
      rec.onerror = () => setListening(false);
      rec.onend = () => setListening(false);
      recognitionRef.current = rec;
      setListening(true);
      rec.start();
    } catch {
      setListening(false);
    }
  };

  /** Map each solution card to the commission head who reacts to it immediately. */
  const commissionForCard = (id: SolutionId): CouncilMemberId => {
    switch (id) {
      case 'repair-pipes':
        return 'water';
      case 'drip-irrigation':
        return 'ecology';
      case 'rain-harvest':
        return 'ecology';
      case 'fountains-off':
        return 'budget';
      case 'saving-campaign':
        return 'social';
      default:
        return 'mayor';
    }
  };

  const toggle = (card: SolutionCard) => {
    if (phase !== 'debate') return;
    playTone('tap', true);
    const willAdd = !picked.has(card.id) && card.cost <= remaining;
    const willRemove = picked.has(card.id);
    if (!willAdd && !willRemove) return;

    setPicked((previous) => {
      const next = new Set(previous);
      if (next.has(card.id)) {
        next.delete(card.id);
      } else if (card.cost <= remaining) {
        next.add(card.id);
      }
      return next;
    });

    const speaker = commissionForCard(card.id as SolutionId);
    setActiveSpeaker(speaker);
    setCameraMode('speaker');
    setCustomSpeech(null);
  };

  const toggleById = (id: SolutionId) => {
    const card = SOLUTION_CARDS.find((c) => c.id === id);
    if (card) toggle(card);
  };

  const selectMemberFloor = (id: CouncilMemberId) => {
    playTone('tap', true);
    setActiveSpeaker(id);
    setCameraMode(id === 'mayor' ? 'overview' : 'speaker');
    setCustomSpeech(null);
  };

  const enterPodiumPhase = () => {
    playTone('alert', true);
    setGavelStrikeCount((c) => c + 1);
    setPhase('podium');
    setActiveSpeaker('mayor');
    setCameraMode('podium');
    setCustomSpeech(
      `🔨 Başkan Adil tokmağı vurdu: "Tasarı maddeleri masada şekillendi (Nash Uzlaşma Skoru: %${gt.nashScore}). Şimdi söz kasaba temsilcimizde; yaptığınız ödünleşmeleri ve gerekçenizi meclis tutanaklarına geçirelim."`,
    );
  };

  const enterVotingPhase = () => {
    playTone('alert', true);
    setGavelStrikeCount((c) => c + 1);
    setVotingFinished(false);
    setVotes({
      mayor: 'idle',
      budget: 'idle',
      water: 'idle',
      ecology: 'idle',
      social: 'idle',
    });
    setPhase('voting');
    setCameraMode('voting');
  };

  const councilBadges = useMemo<CouncilFloatingBadge[]>(() => {
    return (['mayor', 'budget', 'water', 'ecology', 'social'] as const).map((id) => ({
      id,
      title: COUNCIL_META[id].title,
      role: COUNCIL_META[id].role,
      statusText: memberOpinion[id].short,
      isSpeaking: activeSpeaker === id,
      vote: votes[id],
    }));
  }, [memberOpinion, activeSpeaker, votes]);

  const currentSpeakerMeta = COUNCIL_META[activeSpeaker];
  const currentSpeechText = customSpeech ?? memberOpinion[activeSpeaker].speech;

  const yesVotesCount = Object.values(votes).filter((v) => v === 'yes').length;
  const cautionVotesCount = Object.values(votes).filter((v) => v === 'caution').length;

  return (
    <div
      className="investigation-overlay council-fullscreen-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Belediye Meclis Oturumu"
    >
      <div className="council-chamber-shell">
        {/* ==================== LEFT: FULL-STAGE 3D COUNCIL CHAMBER ==================== */}
        <div className="council-stage-column">
          <div className="council-stage-topbar">
            <div className="council-session-badge">
              <span>🏛️ DENGE BELEDİYE MECLİSİ · OYUN TEORİSİ & UZLAŞMA MASASI</span>
              <strong>
                {isRetry ? 'OLAĞANÜSTÜ REVİZYON OTURUMU' : 'SU KRİZİ EYLEM PLANI OTURUMU'}
              </strong>
            </div>
            <div className="council-QuickSpeakers" aria-label="Meclis Komisyon Üyeleri">
              {(['mayor', 'budget', 'water', 'ecology', 'social'] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  className={`council-speaker-chip${activeSpeaker === id ? ' active' : ''}`}
                  onClick={() => selectMemberFloor(id)}
                >
                  <span>{COUNCIL_META[id].icon}</span>
                  <small>{COUNCIL_META[id].title}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="council-3d-viewport">
            <Suspense
              fallback={
                <div className="council-3d-loading">
                  🏛️ 3B Belediye Meclis Salonu ve Komisyon Masaları hazırlanıyor…
                </div>
              }
            >
              <MayorCouncilDiorama
                state={{
                  pickedIds: pickedList,
                  remainingBudget: remaining,
                  reservoirBefore: outcome.reservoirBefore,
                  reservoirAfter: outcome.reservoirAfter,
                  activeSpeaker,
                  cameraMode,
                  votes,
                  gavelStrikeCount,
                }}
                badges={councilBadges}
                onToggleSolution={toggleById}
                onSelectMember={selectMemberFloor}
              />
            </Suspense>
          </div>

          {/* Live Parliamentary Floor Speech Box at Bottom of 3D Stage */}
          <div className="council-floor-speech" role="status" aria-live="polite">
            <div className="council-speaker-avatar">{currentSpeakerMeta.icon}</div>
            <div className="council-speech-content">
              <div className="council-speech-header">
                <strong>🎤 {currentSpeakerMeta.title}</strong>
                <span>{currentSpeakerMeta.role}</span>
              </div>
              <p>{currentSpeechText}</p>
            </div>
          </div>
        </div>

        {/* ==================== RIGHT: LEGISLATIVE DOSSIER & GAME THEORY PANEL ==================== */}
        <aside className="council-dossier-column">
          {/* Parliamentary Step Progress */}
          <div className="council-phase-steps">
            <span className={`c-step${phase === 'debate' ? ' active' : ' done'}`}>
              1 · Müzakere & Denge
            </span>
            <span className={`c-step${phase === 'podium' ? ' active' : phase === 'voting' ? ' done' : ''}`}>
              2 · Kürsü Savunması
            </span>
            <span className={`c-step${phase === 'voting' ? ' active' : ''}`}>
              3 · Meclis Oylaması
            </span>
          </div>

          {/* Budget, Reservoir & Nash Equilibrium Telemetry Card */}
          <div className="council-telemetry-card">
            <div className="council-telemetry-row">
              <div className="council-budget-block">
                <span>KALAN BELEDİYE BÜTÇESİ</span>
                <strong>{tl(remaining)}</strong>
                <small>Toplam: {tl(SOLUTION_BUDGET)}</small>
              </div>
              <div className="council-reservoir-block">
                <span>30. GÜN BARAJ & NASH DENGE</span>
                <strong className={outcome.deltaPts >= 0 ? 'up' : 'down'}>
                  %{outcome.reservoirBefore} → %{outcome.reservoirAfter} · Nash %{gt.nashScore}
                </strong>
                <small>{gt.equilibriumLabel}</small>
              </div>
            </div>

            {/* 4-Commission Game Theory Payoff Bars */}
            <div className="gt-payoff-grid" aria-label="Komisyon fayda dengesi">
              {[
                { label: '🚰 Su/Altyapı', val: gt.payoffs.water },
                { label: '⚖️ Sosyal/Hane', val: gt.payoffs.social },
                { label: '🌿 Tarım/Eko', val: gt.payoffs.ecology },
                { label: '💼 Mali Verim', val: gt.payoffs.fiscal },
              ].map((item) => (
                <div key={item.label} className="gt-payoff-cell">
                  <div className="gt-payoff-top">
                    <span>{item.label}</span>
                    <strong>%{item.val}</strong>
                  </div>
                  <div className="gt-payoff-track">
                    <div
                      className={`gt-payoff-fill${item.val >= 60 ? ' good' : item.val >= 45 ? ' mid' : ' low'}`}
                      style={{ width: `${item.val}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {pickedList.length > 0 && gt.sacrifices.length > 0 && (
              <div className="gt-sacrifice-note">
                <strong>🔄 Feragat / Fırsat Maliyeti:</strong> Vazgeçilen en yüksek alternatif:{' '}
                <em>{gt.sacrifices[0].title}</em> ({gt.sacrifices[0].forgoneWaterL} L/dk potansiyel su ·{' '}
                {gt.sacrifices[0].affectedStakeholder}).
              </div>
            )}

            <div className="balance-meter" aria-label="Planın karşıladığı ihtiyaçlar">
              <span className="balance-meter-title">Kapsanan:</span>
              {STAKEHOLDERS.map((axis) => (
                <span key={axis} className={`balance-chip${covered.has(axis) ? ' lit' : ''}`}>
                  {STAKEHOLDER_LABELS[axis]}
                </span>
              ))}
            </div>
          </div>

          {/* ---------------- PHASE 1: DEBATE & PACKAGE SELECTION ---------------- */}
          {phase === 'debate' && (
            <>
              <div className="council-dossier-scroll">
                <p className="council-dossier-instruction">
                  📋 <strong>Gündem Maddeleri:</strong> Bütçe sınırlı olduğu için her seçim bir{' '}
                  <strong>ödünleşme (feragat)</strong> gerektirir. Tüm komisyonları uzlaştıran{' '}
                  <strong>Nash Dengesini</strong> yakalamaya çalış:
                </p>
                <div className="solution-list">
                  {SOLUTION_CARDS.map((card) => {
                    const isSelected = picked.has(card.id);
                    const affordable = isSelected || card.cost <= remaining;
                    const savedL = Math.round(outcome.savedL[card.id as SolutionId] ?? 0);
                    return (
                      <button
                        key={card.id}
                        type="button"
                        className={`solution-item${isSelected ? ' picked' : ''}`}
                        onClick={() => toggle(card)}
                        disabled={!affordable}
                      >
                        <span className="solution-icon">{card.icon}</span>
                        <span className="solution-info">
                          <span className="solution-title">
                            {card.title}
                            <em>{tl(card.cost)}</em>
                          </span>
                          <span className="solution-text">{card.text}</span>
                          <span className="solution-why">{card.whyCost}</span>
                          <span className="solution-badges">
                            <em className="badge badge-evidence">
                              🔎 {RESOLVES_LABELS[card.resolves]}
                            </em>
                            <em className="badge badge-horizon">
                              ⏳ {HORIZON_LABELS[card.horizon]}
                            </em>
                            {savedL > 0 && (
                              <em className="badge badge-water-gain">
                                💧 +{savedL} L/dk etki
                              </em>
                            )}
                          </span>
                        </span>
                        <span className="solution-check">{isSelected ? '✓' : '+'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <footer className="council-dossier-footer">
                <button
                  type="button"
                  className="startup-button investigation-cta council-full-btn"
                  disabled={selected.length === 0}
                  onClick={enterPodiumPhase}
                >
                  🎙️ TASARIYI KÜRSÜDE SAVUN → ({selected.length} Madde · Nash %{gt.nashScore})
                </button>
              </footer>
            </>
          )}

          {/* ---------------- PHASE 2: PODIUM JUSTIFICATION SPEECH ---------------- */}
          {phase === 'podium' && (
            <div className="council-podium-panel">
              <div className="council-selected-summary">
                <span>
                  Seçilen Tasarı ({tl(spent)} · Nash Uzlaşma: %{gt.nashScore}):
                </span>
                <div className="council-summary-chips">
                  {selected.map((c) => (
                    <span key={c.id} className="council-mini-chip">
                      {c.icon} {c.title}
                    </span>
                  ))}
                </div>
                {gt.paretoImprovementHint && (
                  <small className="gt-hint-line">💡 {gt.paretoImprovementHint}</small>
                )}
              </div>

              <p className="rationale-question">
                🎙️ <strong>Meclis Kürsüsü Konuşman:</strong> Hangi paydaşın ihtiyacını
                önceliklendirdiğini ve hangi alandan neden feragat ettiğini açıkla:
              </p>

              <div className="rationale-choices">
                {RATIONALE_CHOICES.map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    className={`rationale-chip${rationale === choice ? ' picked' : ''}`}
                    onClick={() => setRationale(choice)}
                  >
                    {choice}
                  </button>
                ))}
              </div>

              <div className="rationale-open-box">
                <textarea
                  className="rationale-input rationale-textarea"
                  rows={3}
                  maxLength={280}
                  placeholder="Meclis üyelerine kendi cümlelerinle hitap et (Örn: Sayın meclis üyeleri, önce boru kaçağını onardık çünkü dakikada 45 L temiz su boşa akıyordu…)"
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                />
                <div className="rationale-meta-row">
                  <span className="rationale-ai-hint">
                    ✨ Konuşman meclis tutanağına işlenir ve ödünleşme/sistem düşüncesi profilin analiz edilir ({rationale.length}/280)
                  </span>
                  {speechSupported && (
                    <button
                      type="button"
                      className={`rationale-mic-btn${listening ? ' listening' : ''}`}
                      onClick={toggleVoiceDictation}
                    >
                      {listening ? '⏹ Dinleniyor…' : '🎤 Sesle Anlat'}
                    </button>
                  )}
                </div>
              </div>

              <div className="rationale-actions">
                <button
                  type="button"
                  className="startup-button startup-button-glass"
                  onClick={() => {
                    setPhase('debate');
                    setCameraMode('overview');
                    setCustomSpeech(null);
                  }}
                >
                  ← Maddelere Dön
                </button>
                <button
                  type="button"
                  className="startup-button investigation-cta"
                  disabled={!rationale.trim()}
                  onClick={enterVotingPhase}
                >
                  🗳️ MECLİS OYLAMASINA SUN →
                </button>
              </div>
            </div>
          )}

          {/* ---------------- PHASE 3: LIVE PARLIAMENTARY ROLL-CALL VOTE ---------------- */}
          {phase === 'voting' && (
            <div className="council-voting-panel">
              <div className="council-vote-toprow">
                <h3 className="council-vote-heading">
                  🗳️ Elektronik Meclis Oylama Tablosu
                </h3>
                {!votingFinished && (
                  <button
                    type="button"
                    className="social-tpl-btn"
                    onClick={finishVotingImmediately}
                  >
                    ⚡ Tüm Oyları Hemen Aç
                  </button>
                )}
              </div>

              <ul className="council-vote-list">
                {VOTE_ORDER.map((id) => {
                  const v = votes[id];
                  const meta = COUNCIL_META[id];
                  const op = memberOpinion[id];
                  return (
                    <li key={id} className={`council-vote-row state-${v}`}>
                      <span className="vote-member-icon">{meta.icon}</span>
                      <div className="vote-member-info">
                        <strong>
                          {meta.title} <small>(Fayda: %{op.payoff})</small>
                        </strong>
                        <small>{meta.role}</small>
                      </div>
                      <span className={`vote-status-badge state-${v}`}>
                        {v === 'idle' && '⏳ Oylanıyor…'}
                        {v === 'yes' && '🟢 KABUL'}
                        {v === 'caution' && '🟡 FERAGAT ŞERHİ'}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {votingFinished ? (
                <div className="council-verdict-banner">
                  <strong>
                    🔨 MECLİS KARARI KABUL EDİLDİ ({yesVotesCount} Kabul
                    {cautionVotesCount > 0
                      ? ` · ${cautionVotesCount} Feragat Şerhli Onay`
                      : ' · Tam Nash Uzlaşısı'})
                  </strong>
                  <p>
                    {gt.summaryText} Başkan Adil kararı mühürledi!
                  </p>
                </div>
              ) : (
                <p className="council-voting-wait">
                  ↻ Komisyon başkanları fayda-maliyet dengesine göre oylarını kullanıyor…
                </p>
              )}

              <div className="rationale-actions">
                <button
                  type="button"
                  className="startup-button startup-button-glass"
                  onClick={() => {
                    setPhase('debate');
                    setCameraMode('overview');
                  }}
                >
                  ← Tasarıyı Değiştir
                </button>
                <button
                  type="button"
                  className="startup-button investigation-cta"
                  disabled={!votingFinished}
                  onClick={() => onSubmit(selected, spent, rationale.trim())}
                >
                  📜 KARARI MÜHÜRLE VE HALKA DUYUR →
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
