import { useEffect, useRef, useState } from 'react';

import {
  HORIZON_LABELS,
  RESOLVES_LABELS,
  SOLUTION_BUDGET,
  SOLUTION_CARDS,
  STAKEHOLDER_LABELS,
  type SolutionCard,
  type Stakeholder,
} from '../Game/data/story';

import type { SolutionPanelMode } from '../Game/events/gameEvents';

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

  return (
    <div className="investigation-overlay" role="dialog" aria-label="Belediye toplantısı - çözüm paketi">
      <div className="investigation-card solution-card-panel">
        <header className="investigation-header">
          <h2>{isRetry ? '🔄 ALTERNATİF PLAN' : '🏛️ BELEDİYE TOPLANTISI'}</h2>
          <p>
            {isRetry
              ? 'Lina: "Aynı gün, aynı bütçe, aynı koşullar — sadece kararın farklı. Neyi değiştirirdin?"'
              : 'Başkan: "Defterindeki kanıtlarla bir çözüm paketi hazırla. Bütçemiz sınırlı — hepsini seçemezsin, iyi düşün!"'}
          </p>
        </header>

        <div className="solution-budget">
          <span>Kalan bütçe</span>
          <strong>{tl(remaining)}</strong>
        </div>

        {/* Balance meter: which town needs the package currently covers */}
        <div className="balance-meter" aria-label="Planın karşıladığı ihtiyaçlar">
          <span className="balance-meter-title">Planın karşıladığı:</span>
          {STAKEHOLDERS.map((axis) => (
            <span key={axis} className={`balance-chip${covered.has(axis) ? ' lit' : ''}`}>
              {STAKEHOLDER_LABELS[axis]}
            </span>
          ))}
        </div>

        <div className="solution-list">
          {SOLUTION_CARDS.map((card) => {
            const isSelected = picked.has(card.id);
            const affordable = isSelected || card.cost <= remaining;
            return (
              <button
                key={card.id}
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
              🗣️ Başkan soruyor: <strong>Bu çözümleri neden seçtin? Kasabada neleri korumak, neleri feda etmek istedin?</strong>
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
                PLANI BELEDİYEYE SUN → ({tl(spent)})
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
