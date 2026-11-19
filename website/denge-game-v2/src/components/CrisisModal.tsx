import { useState } from 'react';
import type { CrisisDef, CrisisOption } from '../Game/data/learningProfile';
import { STANCE_LABELS } from '../Game/data/learningProfile';
import { playTone } from './workshop/audio';

interface CrisisModalProps {
  crisis: CrisisDef;
  onResolve: (option: CrisisOption, seconds: number) => void;
}

export default function CrisisModal({ crisis, onResolve }: CrisisModalProps) {
  const [startedAt] = useState(() => Date.now());
  const [selectedOption, setSelectedOption] = useState<CrisisOption | null>(null);

  const handlePick = (option: CrisisOption) => {
    playTone('tap', true);
    setSelectedOption(option);
  };

  const handleConfirm = () => {
    if (!selectedOption) return;
    playTone('win', true);
    const seconds = Math.round((Date.now() - startedAt) / 1000);
    onResolve(selectedOption, seconds);
  };

  return (
    <div
      className="investigation-overlay crisis-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={crisis.title}
    >
      <div className="data-report-card crisis-card">
        <header className="data-report-header crisis-header">
          <div>
            <span className="data-report-eyebrow" style={{ color: '#f59e0b' }}>
              ⚠️ 15. GÜN ARA DÖNEM · OYUN TEORİSİ KARŞI-HAMLESİ
            </span>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{crisis.icon}</span> {crisis.title}
            </h2>
          </div>
          <span className="data-report-status-chip" style={{ background: '#78350f', color: '#fde68a' }}>
            ⚡ Acil Meclis Müdahalesi
          </span>
        </header>

        <div className="crisis-body" style={{ padding: '16px 20px', overflowY: 'auto' }}>
          {/* Situation & Root Cause */}
          <div className="crisis-situation-box">
            <p className="crisis-cause-tag">
              <strong>Neden Çıktı?</strong> {crisis.cause}
            </p>
            <p className="crisis-desc-text">{crisis.situation}</p>
          </div>

          {/* Game Theory Box */}
          <div className="crisis-theory-box">
            <div className="crisis-theory-header">
              <span>♟️</span>
              <strong>Oyun Teorisi & Ortak Malların Trajedisi Çerçevesi</strong>
            </div>
            <p>{crisis.theory}</p>
          </div>

          {/* Decision Options */}
          <h3 className="crisis-options-title">
            ⚖️ Kasaba Temsilcisi Olarak Kararın Ne Olacak? (Bir müdahale seç):
          </h3>
          <div className="crisis-options-grid">
            {crisis.options.map((opt) => {
              const isSelected = selectedOption?.id === opt.id;
              return (
                <div
                  key={opt.id}
                  className={`crisis-option-card${isSelected ? ' selected' : ''}`}
                  onClick={() => handlePick(opt)}
                >
                  <div className="crisis-opt-top">
                    <span className="crisis-opt-icon">{opt.icon}</span>
                    <div>
                      <h4 className="crisis-opt-title">{opt.title}</h4>
                      <span className="crisis-opt-stance">{STANCE_LABELS[opt.stance]}</span>
                    </div>
                  </div>
                  <p className="crisis-opt-text">{opt.text}</p>
                  <div className="crisis-opt-cost">
                    <strong>Ödünleşme / Maliyet:</strong> {opt.cost}
                  </div>
                  <div className="crisis-opt-effects">
                    {Object.entries(opt.effects).map(([k, val]) => (
                      <span key={k} className={`crisis-effect-tag ${val && val > 0 ? 'pos' : 'neg'}`}>
                        {k === 'water' ? '💧 Su' : k === 'economy' ? '💼 Ekonomi' : k === 'society' ? '👥 Toplum' : '🌿 Çevre'}{' '}
                        {val && val > 0 ? `+${val}` : val}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedOption && (
            <div className="crisis-reflection-box">
              <strong>🧭 Lina’nın Notu:</strong>
              <p>“{selectedOption.reflection}”</p>
            </div>
          )}
        </div>

        <footer className="data-report-footer">
          <button
            type="button"
            className="startup-button investigation-cta"
            disabled={!selectedOption}
            onClick={handleConfirm}
          >
            ✓ MÜDAHALEYİ MECLİS KARARI OLARAK ONAYLA →
          </button>
        </footer>
      </div>
    </div>
  );
}
