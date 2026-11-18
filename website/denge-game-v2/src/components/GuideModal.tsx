import { useEffect, useState } from 'react';

import {
  MAX_QUESTIONS_PER_STAGE,
  askLinaGuide,
  type GuideChatTurn,
} from '../Game/ai/pedagogicalEngine';
import { QUEST_STAGE_LABELS, type QuestStage } from '../Game/data/session';
import type { ScenarioFacts } from '../Game/scenario/model';

type GuideModalProps = {
  facts: ScenarioFacts;
  quest: QuestStage;
  completedCards: string[];
  plan: { solutionIds: string[]; totalCost: number } | null;
  history: GuideChatTurn[];
  onAddTurn: (turn: GuideChatTurn) => void;
  onClose: () => void;
};

const QUICK_QUESTIONS = [
  'Barajda şu an ne kadar su kaldı ve kritik eşik ne?',
  'Nuri Amca’nın sokağındaki boru kaçağı ne kadar su kaybettiriyor?',
  'Çiftçi Rıza tarlalarda dakikada kaç litre su kullanıyor?',
  'Sınırlı bütçeyle karar verirken neye dikkat etmeliyim?',
];

export default function GuideModal({
  facts,
  quest,
  completedCards,
  plan,
  history,
  onAddTurn,
  onClose,
}: GuideModalProps) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const askedThisStage = history.filter((h) => h.stage === quest).length;
  const remaining = Math.max(0, MAX_QUESTIONS_PER_STAGE - askedThisStage);
  const latestTurn = history.length > 0 ? history[history.length - 1] : null;

  const submitQuestion = async (rawQ: string) => {
    const trimmed = rawQ.trim();
    if (!trimmed || loading || remaining <= 0) return;
    setLoading(true);
    setQuestion('');
    try {
      const res = await askLinaGuide({
        question: trimmed,
        facts,
        quest,
        completedCards,
        plan,
        history,
      });
      onAddTurn({
        q: trimmed,
        a: res.reply,
        socraticQuestion: res.socratic_question,
        suggestedDistrict: res.suggested_district,
        at: Date.now(),
        stage: quest,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="investigation-overlay guide-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Lina Akıllı Rehber"
    >
      <div
        className="investigation-card guide-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="guide-modal-header">
          <div className="guide-title-row">
            <span className="guide-badge">🧭 DİNAMİK KASABA RAG REHBERİ</span>
            <span className="guide-quota-pill">
              Bu aşamada kalan soru: <strong>{remaining}/{MAX_QUESTIONS_PER_STAGE}</strong>
            </span>
          </div>
          <h2>Lina ile Kasabayı Düşün</h2>
          <p>
            Kasabandaki gerçek verilerle (Baraj <strong>%{facts.reservoirPct}</strong> ·
            Şebeke Çıkışı <strong>{facts.outflowL} L/dk</strong> · Kaçak{' '}
            <strong>{facts.leakL} L/dk</strong>) merak ettiğin her şeyi sorabilirsin!
          </p>
        </header>

        {/* Live RAG Context Strip */}
        <div className="guide-context-strip" aria-label="Canlı kasaba verileri">
          <span>📍 Aşama: {QUEST_STAGE_LABELS[quest]}</span>
          <span>💧 Rezerv: %{facts.reservoirPct}</span>
          <span>🔧 Kaçak: %{facts.leakPct} ({facts.leakL} L/dk)</span>
          <span>🌾 Tarım: {facts.farmL} L/dk</span>
        </div>

        {/* Conversation Area */}
        <div className="guide-chat-body">
          {latestTurn ? (
            <div className="guide-turn-box">
              <div className="guide-user-bubble">
                <span>Sen sordun:</span>
                <p>“{latestTurn.q}”</p>
              </div>
              <div className="guide-lina-bubble">
                <div className="guide-lina-header">
                  <strong>✨ Lina’nın Yanıtı</strong>
                  <span className="guide-district-tag">📍 {latestTurn.suggestedDistrict}</span>
                </div>
                <p className="guide-lina-reply">{latestTurn.a}</p>
                <div className="guide-socratic-box">
                  <span>🤔 Şimdi birlikte düşünelim:</span>
                  <p>{latestTurn.socraticQuestion}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="guide-empty-state">
              <p>
                Merhaba! Ben sana doğrudan hangi butona basacağını söylemem; ama
                kasabandaki su verilerini ve komşularımızın durumunu birlikte
                inceleyip en doğru kararı bulmana yardım ederim.
              </p>
            </div>
          )}

          {loading && (
            <div className="guide-loading">
              ↻ Lina kasaba su defterini kontrol ediyor…
            </div>
          )}
        </div>

        {/* Quick Questions & Free Input */}
        {remaining > 0 ? (
          <div className="guide-input-section">
            <div className="guide-quick-chips">
              {QUICK_QUESTIONS.map((qText) => (
                <button
                  key={qText}
                  type="button"
                  className="rationale-chip"
                  disabled={loading}
                  onClick={() => void submitQuestion(qText)}
                >
                  {qText}
                </button>
              ))}
            </div>
            <form
              className="guide-form"
              onSubmit={(e) => {
                e.preventDefault();
                void submitQuestion(question);
              }}
            >
              <input
                type="text"
                className="rationale-input guide-text-input"
                maxLength={180}
                placeholder="Lina'ya kasabayla ilgili bir soru yaz…"
                value={question}
                disabled={loading}
                onChange={(e) => setQuestion(e.target.value)}
              />
              <button
                type="submit"
                className="startup-button investigation-cta guide-send-btn"
                disabled={loading || !question.trim()}
              >
                Sor →
              </button>
            </form>
          </div>
        ) : (
          <div className="guide-limit-notice">
            🎯 Bu görev aşamasındaki 3 soru hakkını kullandın! Şimdi kasabada
            hareket edip bir sonraki adıma geçince yeni sorular sorabilirsin.
          </div>
        )}

        <footer className="guide-modal-footer">
          <button
            type="button"
            className="startup-button startup-button-glass"
            onClick={onClose}
          >
            Kasabaya Dön
          </button>
        </footer>
      </div>
    </div>
  );
}
