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

const MayorCouncilDiorama = lazy(() => import('./workshop/council/MayorCouncilDiorama'));

type SolutionPanelProps = {
  mode?: SolutionPanelMode;
  onSubmit: (selected: SolutionCard[], totalCost: number, rationale: string) => void;
};

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

export default function SolutionPanel({ mode = 'initial', onSubmit }: SolutionPanelProps) {
  const isRetry = mode === 'retry';
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [askingWhy, setAskingWhy] = useState(false);
  const [rationale, setRationale] = useState('');
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const speechSupported = getSpeechRecognitionCtor() !== null;

  const scenario = activeScenario();
  const f = activeFacts();

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

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

  const toggle = (card: SolutionCard) => {
    setPicked((previous) => {
      const next = new Set(previous);
      if (next.has(card.id)) {
        next.delete(card.id);
      } else if (card.cost <= remaining) {
        next.add(card.id);
      }
      return next;
    });
  };

  const toggleById = (id: SolutionId) => {
    const card = SOLUTION_CARDS.find((c) => c.id === id);
    if (card) toggle(card);
  };

  const councilBadges = useMemo<CouncilFloatingBadge[]>(() => {
    const hasRepair = picked.has('repair-pipes');
    const hasDrip = picked.has('drip-irrigation');
    const hasRain = picked.has('rain-harvest');
    const hasFountains = picked.has('fountains-off');
    const hasSaving = picked.has('saving-campaign');

    return [
      {
        id: 'mayor',
        name: '🏛️ Başkan Adil',
        statusText:
          pickedList.length === 0
            ? `Hoş geldin! Bütçemiz ${tl(SOLUTION_BUDGET)}`
            : `Kalan: ${tl(remaining)} · 30. Gün: %${outcome.reservoirAfter}`,
        tone: 'mayor',
      },
      {
        id: 'aylin',
        name: '💧 Mühendis Aylin',
        statusText:
          hasRepair || hasRain
            ? `✓ Rezerv %${outcome.reservoirBefore} → %${outcome.reservoirAfter}`
            : `Baraj %${f.reservoirPct} · Kaçak %${f.leakPct}`,
        tone: hasRepair || hasRain ? 'active' : 'waiting',
        linkedSolutionId: 'rain-harvest',
      },
      {
        id: 'nuri',
        name: '🏠 Nuri Amca',
        statusText: hasRepair
          ? `✓ Kaçak ${f.leakL} → ${outcome.leakAfterL} L/dk`
          : hasSaving
            ? `✓ Evlerde ${outcome.homesSavingL} L/dk tasarruf`
            : `Sokak kaçağı: ${f.leakL} L/dk`,
        tone: hasRepair || hasSaving ? 'active' : 'waiting',
        linkedSolutionId: 'repair-pipes',
      },
      {
        id: 'riza',
        name: '🌾 Çiftçi Rıza',
        statusText: hasDrip
          ? `✓ Damla sulama: ${f.farmL} → ${outcome.farmAfterL} L/dk`
          : `Tarla kanalı: ${f.farmL} L/dk`,
        tone: hasDrip ? 'active' : 'waiting',
        linkedSolutionId: 'drip-irrigation',
      },
      {
        id: 'kemal',
        name: '🌳 İşçi Kemal',
        statusText:
          hasFountains || hasRain
            ? `✓ Park şebeke yükü: ${outcome.parkAfterL} L/dk`
            : `Park tüketimi: ${f.parkL} L/dk`,
        tone: hasFountains || hasRain ? 'active' : 'waiting',
        linkedSolutionId: 'fountains-off',
      },
    ];
  }, [picked, pickedList.length, remaining, outcome, f]);

  return (
    <div className="investigation-overlay" role="dialog" aria-label="Belediye toplantısı - 3B Meclis Salonu">
      <div className="investigation-card solution-card-panel council-3d-modal">
        <header className="investigation-header">
          <h2>{isRetry ? '🔄 3B BELEDİYE MECLİSİ · ALTERNATİF PLAN' : '🏛️ 3B BELEDİYE MECLİS SALONU'}</h2>
          <p>
            {isRetry
              ? 'Lina: "Meclis üyelerimiz tekrar masada. Aynı bütçe ve koşullarda bu kez hangi kararları seçerdin?"'
              : `Başkan Adil ve 4 bölge temsilcimiz meclis salonunda seni bekliyor! Masadaki 3B kasaba maketinden veya aşağıdaki listeden çözüm paketini kur.`}
          </p>
        </header>

        {/* 3D Three.js Council Chamber Diorama */}
        <div className="council-3d-wrapper">
          <Suspense
            fallback={
              <div className="council-3d-loading">
                🏛️ 3B Belediye Meclis Salonu ve Başkanlık Makamı hazırlanıyor…
              </div>
            }
          >
            <MayorCouncilDiorama
              state={{
                pickedIds: pickedList,
                remainingBudget: remaining,
                reservoirBefore: outcome.reservoirBefore,
                reservoirAfter: outcome.reservoirAfter,
              }}
              badges={councilBadges}
              onToggleSolution={toggleById}
            />
          </Suspense>
        </div>

        <div className="council-metrics-strip">
          <div className="solution-budget">
            <span>Kalan Belediye Bütçesi</span>
            <strong>{tl(remaining)}</strong>
          </div>
          <div className="council-projection-pill">
            <span>📊 30. Gün Baraj Tahmini:</span>
            <strong>
              %{outcome.reservoirBefore} → %{outcome.reservoirAfter}
            </strong>
            <em>(Plansız: %{outcome.reservoirNoPlan})</em>
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
                    <em className="badge badge-evidence">🔎 {RESOLVES_LABELS[card.resolves]}</em>
                    <em className="badge badge-horizon">⏳ {HORIZON_LABELS[card.horizon]}</em>
                    {isSelected && savedL > 0 && (
                      <em className="badge badge-water-gain">💧 +{savedL} L/dk kazanç</em>
                    )}
                  </span>
                </span>
                <span className="solution-check">{isSelected ? '✓' : '+'}</span>
              </button>
            );
          })}
        </div>

        {askingWhy ? (
          <div className="rationale-step">
            <p className="rationale-question">
              🗣️ Başkan Adil soruyor:{' '}
              <strong>Bu çözümleri neden seçtin? Kasabada neleri korumak, neleri feda etmek istedin?</strong>
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
                placeholder="Kendi cümlelerinle anlat (Örn: Parkın fıskiyelerini kapattım çünkü insanların içme suyu ve Nuri Amca'nın sokağındaki kaçak daha acildi…)"
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
              />
              <div className="rationale-meta-row">
                <span className="rationale-ai-hint">
                  ✨ Cümlen puanlanmaz; düşünce tarzın ve hangi kanıtları önemsediğin analiz edilir ({rationale.length}/280)
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
                onClick={() => setAskingWhy(false)}
              >
                ← Pakete dön
              </button>
              <button
                type="button"
                className="startup-button investigation-cta"
                disabled={!rationale.trim()}
                onClick={() => onSubmit(selected, spent, rationale.trim())}
              >
                PLANI MECLİSE SUN → ({tl(spent)})
              </button>
            </div>
          </div>
        ) : (
          <footer className="investigation-footer">
            <button
              type="button"
              className="startup-button investigation-cta"
              disabled={selected.length === 0}
              onClick={() => setAskingWhy(true)}
            >
              PLANI HAZIRLADIM → ({tl(spent)})
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}
