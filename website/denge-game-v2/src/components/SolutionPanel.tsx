import { useState } from 'react';

import { SOLUTION_BUDGET, SOLUTION_CARDS, type SolutionCard } from '../Game/data/story';

type SolutionPanelProps = {
  onSubmit: (selected: SolutionCard[], totalCost: number) => void;
};

const tl = (n: number) => `₺${n.toLocaleString('tr-TR')}`;

export default function SolutionPanel({ onSubmit }: SolutionPanelProps) {
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const spent = SOLUTION_CARDS.filter((c) => picked.has(c.id)).reduce((sum, c) => sum + c.cost, 0);
  const remaining = SOLUTION_BUDGET - spent;

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

  const selected = SOLUTION_CARDS.filter((c) => picked.has(c.id));

  return (
    <div className="investigation-overlay" role="dialog" aria-label="Belediye toplantısı - çözüm paketi">
      <div className="investigation-card solution-card-panel">
        <header className="investigation-header">
          <h2>🏛️ BELEDİYE TOPLANTISI</h2>
          <p>Başkan: &quot;Defterindeki kanıtlarla bir çözüm paketi hazırla. Bütçemiz sınırlı — hepsini seçemezsin, iyi düşün!&quot;</p>
        </header>

        <div className="solution-budget">
          <span>Kalan bütçe</span>
          <strong>{tl(remaining)}</strong>
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
                </span>
                <span className="solution-check">{isPicked ? '✓' : '+'}</span>
              </button>
            );
          })}
        </div>

        <footer className="investigation-footer">
          <button
            className="startup-button investigation-cta"
            disabled={selected.length === 0}
            onClick={() => onSubmit(selected, spent)}
          >
            PLANI BELEDİYEYE SUN → ({tl(spent)})
          </button>
        </footer>
      </div>
    </div>
  );
}
