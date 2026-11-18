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

  const scenario = activeScenario();
  const f = activeFacts();

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

  /** Every stakeholder axis the current package touches. */
  const covered = new Set<Stakeholder>(selected.flatMap((c) => c.serves));

  /** Dynamic parliamentary opinion per commission member based on current draft. */
  const memberOpinion = useMemo<Record<CouncilMemberId, { short: string; speech: string; vote: VoteLampState }>>(() => {
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
            : `30. Gün Rezerv: %${outcome.reservoirAfter}`,
        speech:
          pickedList.length === 0
            ? `Değerli meclis üyeleri ve genç temsilcimiz, oturumu açıyorum! Kasabamızın baraj doluluğu %${f.reservoirPct} seviyesindedir. ₺1.000.000 bütçemizle hazırlayacağımız müdahale paketini müzakereye sunuyorum.`
            : `Meclis gündemindeki mevcut tasarı ${tl(spent)} bütçe kullanıyor ve 30 gün sonunda baraj rezervimizi %${outcome.reservoirBefore} seviyesinden %${outcome.reservoirAfter} seviyesine taşıyor.`,
        vote: 'yes',
      },
      budget: {
        short: `Harcanan: ${tl(spent)} / Kalan: ${tl(remaining)}`,
        speech:
          spent === 0
            ? `Mali Hizmetler Komisyonu olarak kasaba kasasındaki ${tl(SOLUTION_BUDGET)} kaynağın en yüksek su geri dönüşümü sağlayacak kalemlere harcanmasını bekliyoruz.`
            : remaining >= 150_000
              ? `Bütçenin ${tl(spent)}’lik kısmı kullanıldı, kasada ${tl(remaining)} ihtiyat payı bırakıldı. Mali disiplin açısından dengeli bir tablo.`
              : `${tl(spent)} ile bütçe sınırımızı neredeyse tamamen kullandık (${tl(remaining)} kaldı); ancak su kaybını önleyen altyapı yatırımı uzun vadede kendini amorti edecektir.`,
        vote: spent > 0 ? 'yes' : 'caution',
      },
      water: {
        short: hasRepair
          ? `✓ Şebeke kaçağı ${f.leakL} → ${outcome.leakAfterL} L/dk`
          : `⚠️ Şebeke kaçağı: ${f.leakL} L/dk (%${f.leakPct})`,
        speech: hasRepair
          ? `SUKİ Müdürlüğü olarak ana boru hattı onarımının pakete alınmasını tam destekliyoruz! Dakikada ${f.leakL} L olan şebeke sızıntımız ${outcome.leakAfterL} L/dk’ya düşecek ve barajımız nefes alacak.`
          : `Sayın Başkan, şebekemizde dakikada ${f.leakL} L (%${f.leakPct}) temiz su toprağa karışıyor. Ana boru onarımı olmadan baraj rezervini %${outcome.reservoirAfter} üzerinde tutmamız teknik olarak çok güç!`,
        vote: hasRepair ? 'yes' : 'caution',
      },
      ecology: {
        short:
          hasDrip && (hasRain || hasFountains)
            ? `✓ Tarım (${outcome.farmAfterL} L/dk) & Yeşil Alan`
            : hasDrip
              ? `✓ Damla Sulama (${outcome.farmAfterL} L/dk)`
              : `Tarım yükü: ${f.farmL} L/dk`,
        speech: hasDrip
          ? `Çevre ve Kırsal Hizmetler Komisyonu adına tarımda damla sulamaya geçilmesini kutluyorum! Kanal çekimi ${f.farmL} L/dk’dan ${outcome.farmAfterL} L/dk’ya inerken toprağımız ve üretimimiz korunacak.`
          : hasRain
            ? `Yağmur suyu hasadı depoları yeşil alanlarımız için çok değerli; fakat ${f.farmL} L/dk su çeken tarım kanalları için de önlem alınmasını tavsiye ediyoruz.`
            : `Kuraklıkta buharlaşma %${f.evaporationPct} arttı. Tarım vadisindeki ${f.farmL} L/dk tüketim ve park ekosistemimiz için su verimliliği şart.`,
        vote: hasDrip || hasRain ? 'yes' : 'caution',
      },
      social: {
        short:
          hasRepair || hasSaving
            ? `✓ Konut içme suyu güvende`
            : `Mahalle basıncı düşük (${f.homesL} L/dk)`,
        speech:
          hasRepair && hasSaving
            ? `Sosyal İşler Komisyonu olarak hem boru onarımıyla musluk basıncının yükseltilmesini hem de ev içi tasarruf bilincini çok yerinde buluyoruz; halkımız adına olumlu oy vereceğiz.`
            : hasFountains && !hasRepair && !hasSaving
              ? `Park fıskiyelerinin kapatılması tasarruf sağlar ancak mahalle sakinlerimizin beklediği asıl çözüm evlerdeki su basıncının ve şebekenin iyileştirilmesidir.`
              : `Mahallelerimizde musluklara dakikada ${f.homesL} L su ulaşıyor. Vatandaşlarımızın günlük yaşamını mağdur etmeyecek adil bir paylaşım bekliyoruz.`,
        vote: hasRepair || hasSaving ? 'yes' : 'caution',
      },
    };
  }, [picked, pickedList.length, spent, remaining, outcome, f]);

  // Trigger automated roll-call voting when phase enters 'voting'
  useEffect(() => {
    if (phase !== 'voting') return;

    const timers: number[] = [];
    VOTE_ORDER.forEach((memberId, index) => {
      const t = window.setTimeout(() => {
        playTone('tap', true);
        setActiveSpeaker(memberId);
        setCustomSpeech(null);
        setVotes((prev) => ({
          ...prev,
          [memberId]: memberOpinion[memberId].vote,
        }));
        if (index === VOTE_ORDER.length - 1) {
          playTone('win', true);
          setGavelStrikeCount((c) => c + 1);
          setVotingFinished(true);
        }
      }, (index + 1) * 520);
      timers.push(t);
    });

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [phase, memberOpinion]);

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
      '🔨 Başkan Adil tokmağı vurdu: "Tasarı maddeleri masada şekillendi. Şimdi söz kasaba temsilcimizde; bu paketi hangi gerekçeyle sunduğunuzu meclis tutanaklarına geçirelim."',
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
              <span>🏛️ DENGE BELEDİYE MECLİSİ</span>
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

        {/* ==================== RIGHT: LEGISLATIVE DOSSIER & VOTING PANEL ==================== */}
        <aside className="council-dossier-column">
          {/* Parliamentary Step Progress */}
          <div className="council-phase-steps">
            <span className={`c-step${phase === 'debate' ? ' active' : ' done'}`}>
              1 · Meclis Müzakeresi
            </span>
            <span className={`c-step${phase === 'podium' ? ' active' : phase === 'voting' ? ' done' : ''}`}>
              2 · Kürsü Savunması
            </span>
            <span className={`c-step${phase === 'voting' ? ' active' : ''}`}>
              3 · Meclis Oylaması
            </span>
          </div>

          {/* Budget & 30-Day Reservoir Telemetry Card */}
          <div className="council-telemetry-card">
            <div className="council-telemetry-row">
              <div className="council-budget-block">
                <span>KALAN BELEDİYE BÜTÇESİ</span>
                <strong>{tl(remaining)}</strong>
                <small>Toplam: {tl(SOLUTION_BUDGET)}</small>
              </div>
              <div className="council-reservoir-block">
                <span>30. GÜN BARAJ TAHMİNİ</span>
                <strong className={outcome.deltaPts >= 0 ? 'up' : 'down'}>
                  %{outcome.reservoirBefore} → %{outcome.reservoirAfter}
                </strong>
                <small>Plansız kalsaydı: %{outcome.reservoirNoPlan}</small>
              </div>
            </div>

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
                  📋 <strong>Gündem Maddeleri:</strong> Tasarıya eklemek istediğin müdahaleleri
                  seç. Her maddede ilgili komisyon başkanı görüş bildirecektir:
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
                            {isSelected && savedL > 0 && (
                              <em className="badge badge-water-gain">
                                💧 +{savedL} L/dk kazanç
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
                  🎙️ TASARIYI KÜRSÜDE SAVUN → ({selected.length} Madde · {tl(spent)})
                </button>
              </footer>
            </>
          )}

          {/* ---------------- PHASE 2: PODIUM JUSTIFICATION SPEECH ---------------- */}
          {phase === 'podium' && (
            <div className="council-podium-panel">
              <div className="council-selected-summary">
                <span>Seçilen Tasarı Paketi ({tl(spent)}):</span>
                <div className="council-summary-chips">
                  {selected.map((c) => (
                    <span key={c.id} className="council-mini-chip">
                      {c.icon} {c.title}
                    </span>
                  ))}
                </div>
              </div>

              <p className="rationale-question">
                🎙️ <strong>Meclis Kürsüsü Konuşman:</strong> Sayın Başkan ve Komisyon
                Üyelerine bu paketi neden seçtiğini, neleri koruyup neleri feda ettiğini açıkla:
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
                    ✨ Konuşman meclis tutanağına işlenir ve düşünce profilin analiz edilir ({rationale.length}/280)
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
              <h3 className="council-vote-heading">
                🗳️ Elektronik Meclis Oylama Tablosu
              </h3>
              <ul className="council-vote-list">
                {VOTE_ORDER.map((id) => {
                  const v = votes[id];
                  const meta = COUNCIL_META[id];
                  return (
                    <li key={id} className={`council-vote-row state-${v}`}>
                      <span className="vote-member-icon">{meta.icon}</span>
                      <div className="vote-member-info">
                        <strong>{meta.title}</strong>
                        <small>{meta.role}</small>
                      </div>
                      <span className={`vote-status-badge state-${v}`}>
                        {v === 'idle' && '⏳ Oylanıyor…'}
                        {v === 'yes' && '🟢 KABUL'}
                        {v === 'caution' && '🟡 ŞERHLİ ONAY'}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {votingFinished ? (
                <div className="council-verdict-banner">
                  <strong>
                    🔨 MECLİS KARARI KABUL EDİLDİ ({yesVotesCount} Kabul
                    {cautionVotesCount > 0 ? ` · ${cautionVotesCount} Şerhli Onay` : ' · Oy Birliği'})
                  </strong>
                  <p>
                    Başkan Adil: &quot;Su Krizi Eylem Planı belediye meclisimizce onaylanmış ve
                    yürürlüğe girmiştir!&quot;
                  </p>
                </div>
              ) : (
                <p className="council-voting-wait">
                  ↻ Komisyon başkanları elektronik oylarını kullanıyor…
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
