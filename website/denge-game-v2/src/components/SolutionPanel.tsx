import { useState } from 'react';

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

const tl = (n: number) => `₺${n.toLocaleString('tr-TR')}`;

const STAKEHOLDERS: readonly Stakeholder[] = ['ev', 'tarim', 'park', 'su'];

const RATIONALE_CHOICES = [
  'En çok suyu kaybeden nedeni çözmek istedim',
  'Herkesin ihtiyacını dengeli karşılamak istedim',
  'Uzun vadede en kalıcı çözümleri seçtim',
];

export default function SolutionPanel({ mode = 'initial', onSubmit }: SolutionPanelProps) {
  const isRetry = mode === 'retry';
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [askingWhy, setAskingWhy] = useState(false);
  const [rationale, setRationale] = useState('');

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
            const isPicked = picked.has(card.id);
            const affordable = isPicked || card.cost <= remaining;
            return (
              <button
                key={card.id}
                className={`solution-item${isPicked ? ' picked' : ''}`}
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
                <span className="solution-check">{isPicked ? '✓' : '+'}</span>
              </button>
            );
          })}
        </div>

        {askingWhy ? (
          <div className="rationale-step">
            <p className="rationale-question">🗣️ Başkan soruyor: <strong>Neden bu paketi seçtin?</strong></p>
            <div className="rationale-choices">
              {RATIONALE_CHOICES.map((choice) => (
                <button
                  key={choice}
                  className={`rationale-chip${rationale === choice ? ' picked' : ''}`}
                  onClick={() => setRationale(choice)}
                >
                  {choice}
                </button>
              ))}
            </div>
            <input
              className="rationale-input"
              type="text"
              maxLength={120}
              placeholder="Ya da kendi cümleni yaz…"
              value={RATIONALE_CHOICES.includes(rationale) ? '' : rationale}
              onChange={(e) => setRationale(e.target.value)}
            />
            <div className="rationale-actions">
              <button className="startup-button startup-button-glass" onClick={() => setAskingWhy(false)}>
                ← Pakete dön
              </button>
              <button
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
