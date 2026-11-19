/**
 * Veri Yorumlama ve Grafik Rapor Hazırlama Masası (DataReportModal).
 *
 * Oyunun iki kritik analiz noktasında açılır:
 *  1. `mode="evidence"` (Bölüm 1 Sonu - Lina ile Kanıt Sentezi):
 *     Öğrenci kasabanın Su Dağılım & Kayıp Grafiğini ve 4 Dönemlik Baraj Trend
 *     Grafiğini okur, 2 veri yorumlama sorusunu yanıtlar ve kanıtları doğrular.
 *  2. `mode="debrief"` (Bölüm 2 Sonu - 30. Gün Belediye Değerlendirme Raporu):
 *     Öğrenci Plan Öncesi / Plansız / 30. Gün Karşılaştırmalı Baraj Grafiğini ve
 *     Sektörel Debi Değişim Grafiğini yorumlar, net kazanımı hesaplar ve saha
 *     bulgularını "✅ İşe Yaradı" / "⚠️ Sorun Sürüyor (Feragat)" olarak sınıflandırır.
 */
import { useMemo, useState } from 'react';
import { EVIDENCE_IDS } from '../Game/data/story';
import type { NotebookEntry } from '../Game/data/session';
import { rumorsFor, type EvidenceCheckRecord, type RumorClaim } from '../Game/data/learningProfile';
import { activeFacts, activeScenario } from '../Game/scenario';
import { simulate } from '../Game/scenario/model';
import { playTone } from './workshop/audio';

export interface DataQuizMetric {
  mode: 'evidence' | 'debrief';
  wrongAttempts: number;
  completedAt: number;
  /** How many of the 2 questions were answered right on the first try. */
  firstTryCorrect: number;
  /** Misconception ids behind each wrong pick (deduplicated). */
  misconceptions: string[];
  /** Evidence mode only: rumour-filtering trace. */
  evidenceCheck?: EvidenceCheckRecord;
}

/** One quiz question; `misconceptions[i]` names the reading error behind option i. */
interface QuizQuestion {
  prompt: string;
  options: string[];
  correct: number;
  explanation: string;
  misconceptions: (string | null)[];
}

type DataReportModalProps =
  | {
      mode: 'evidence';
      notebook: NotebookEntry[];
      pickedIds: Set<string>;
      onToggleEvidence: (cardId: string) => void;
      onSubmitEvidence: (metric: DataQuizMetric) => void;
    }
  | {
      mode: 'debrief';
      notebook: NotebookEntry[];
      planIds: string[];
      workedIds: Set<string>;
      problemIds: Set<string>;
      onToggleFinding: (kind: 'worked' | 'problem', cardId: string) => void;
      onSubmitDebrief: (metric: DataQuizMetric) => void;
    };

const EMPTY_PLAN: readonly string[] = [];

export default function DataReportModal(props: DataReportModalProps) {
  const scenario = useMemo(() => activeScenario(), []);
  const f = useMemo(() => activeFacts(), []);
  const planIds = props.mode === 'debrief' ? props.planIds : EMPTY_PLAN;
  const o = useMemo(
    () => simulate(scenario.params, planIds),
    [scenario.params, planIds],
  );

  const [q1Answered, setQ1Answered] = useState<number | null>(null);
  const [q2Answered, setQ2Answered] = useState<number | null>(null);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  /** First pick per question: true = right on first try. */
  const [firstTry, setFirstTry] = useState<{ q1: boolean | null; q2: boolean | null }>({
    q1: null,
    q2: null,
  });
  const [misconceptions, setMisconceptions] = useState<string[]>([]);

  // ---- Rumour distractors (evidence mode only) ----------------------------
  const rumors = useMemo(() => rumorsFor(scenario.seed), [scenario.seed]);
  const [rumorChecked, setRumorChecked] = useState<Set<string>>(new Set());
  const [rumorEver, setRumorEver] = useState<Set<string>>(new Set());
  const [rumorFeedback, setRumorFeedback] = useState<RumorClaim | null>(null);

  const toggleRumor = (rumor: RumorClaim) => {
    setRumorChecked((prev) => {
      const next = new Set(prev);
      if (next.has(rumor.id)) {
        next.delete(rumor.id);
        setRumorFeedback(null);
      } else {
        next.add(rumor.id);
        setRumorEver((ever) => new Set(ever).add(rumor.id));
        setRumorFeedback(rumor);
        playTone('alert', true);
      }
      return next;
    });
  };

  // Build dynamic scenario-specific graph interpretation questions
  const totalDrop = f.history.lastYear - f.reservoirPct;
  const netGainVsNoPlan = o.reservoirAfter - o.reservoirNoPlan;

  const q1 = useMemo<QuizQuestion>(() => {
    if (props.mode === 'evidence') {
      const wrongLow = Math.max(6, f.leakPct - 11);
      const wrongHigh = Math.min(68, f.leakPct + 14);
      return {
        prompt: `1. Su Dağılım Grafiğine bak: Barajdan kasabaya çıkan ${f.outflowL} L/dk suyun yüzde kaçı evlere ulaşmadan yeraltı boru kaçağında kayboluyor?`,
        options: [
          `%${wrongLow} (${Math.round((f.outflowL * wrongLow) / 100)} L/dk) — Küçük sızıntı`,
          `%${f.leakPct} (${f.leakL} L/dk) — Şebeke boru kaçağı`,
          `%${wrongHigh} (${Math.round((f.outflowL * wrongHigh) / 100)} L/dk) — Park tüketimi`,
        ],
        correct: 1,
        explanation: `Doğru okuma! Grafiğe göre ${f.outflowL} L/dk şebeke çıkışının ${f.leakL} L/dk’sı (yani tam %${f.leakPct}’i) eski borulardan toprağa sızıyor.`,
        misconceptions: ['bar-scale', null, 'category-swap'],
      };
    }

    const wrongA = Math.max(1, netGainVsNoPlan - 4);
    const wrongB = netGainVsNoPlan + 6;
    return {
      prompt: `1. 30. Gün Karşılaştırma Grafiğine bak: Uyguladığın plan, "Plansız Kalsaydı (%${o.reservoirNoPlan})" senaryosuna kıyasla baraj rezervine net kaç puan kazandırdı?`,
      options: [
        `+${wrongA} puan fark oluşturdu`,
        `+${netGainVsNoPlan} puan (%${o.reservoirNoPlan} yerine %${o.reservoirAfter} seviyesinde tuttu)`,
        `+${wrongB} puan fark oluşturdu`,
      ],
      correct: 1,
      explanation: `Kesinlikle! Hiçbir önlem alınmasaydı rezerv %${o.reservoirNoPlan}’e çakılacaktı; senin planınla %${o.reservoirAfter} seviyesinde kalarak net +${netGainVsNoPlan} puan koruma sağladı.`,
      misconceptions: ['difference-calc', null, 'difference-calc'],
    };
  }, [props.mode, f, o, netGainVsNoPlan]);

  const q2 = useMemo<QuizQuestion>(() => {
    if (props.mode === 'evidence') {
      return {
        prompt: `2. Baraj Rezerv Trend Grafiğine göre geçen yıldan (%${f.history.lastYear}) bugüne (%${f.reservoirPct}) toplam düşüş kaç puandır ve düşüş hızı nasıl değişmiştir?`,
        options: [
          `Toplam ${totalDrop} puan düştü; son dönemde (-${f.drops[2]} puan ile) düşüş hızlandı`,
          `Toplam ${Math.max(8, totalDrop - 9)} puan düştü; düşüş giderek yavaşlıyor`,
          `Rezerv sabit kaldı, yalnızca tarım kanalı azaldı`,
        ],
        correct: 0,
        explanation: `Harika veri yorumu! Dönemlik düşüşler sırasıyla -${f.drops[0]}, -${f.drops[1]} ve -${f.drops[2]} puan (toplam ${totalDrop} puan). Eğri dikleşiyor, yani müdahale şart!`,
        misconceptions: [null, 'trend-direction', 'static-reading'],
      };
    }

    const leakSaved = f.leakL - o.leakAfterL;
    const farmSaved = f.farmL - o.farmAfterL;
    const biggestSector =
      leakSaved >= farmSaved
        ? `Şebeke kaçağı (${f.leakL} → ${o.leakAfterL} L/dk)`
        : `Tarım kanalı (${f.farmL} → ${o.farmAfterL} L/dk)`;

    return {
      prompt: `2. Sektörel Debi Grafiğine (Önce → Sonra) baktığında dakikada en yüksek su tasarrufu hangi kalemde gerçekleşti?`,
      options: [
        biggestSector,
        `Hiçbir kalemde debi değişmedi, tüm değerler sabit kaldı`,
        `Yalnızca buharlaşma durdu`,
      ],
      correct: 0,
      explanation: `Veriyi çok doğru okudun! Grafikte en büyük debi düşüşü ${biggestSector} kaleminde gerçekleşerek barajı destekledi.`,
      misconceptions: [null, 'static-reading', 'category-swap'],
    };
  }, [props.mode, f, o, totalDrop]);

  const answerQ1 = (idx: number) => {
    setQ1Answered(idx);
    const isCorrect = idx === q1.correct;
    setFirstTry((ft) => ({ ...ft, q1: ft.q1 ?? isCorrect }));
    if (isCorrect) {
      playTone('win', true);
    } else {
      playTone('alert', true);
      setWrongAttempts((w) => w + 1);
      const misc = q1.misconceptions[idx];
      if (misc) setMisconceptions((m) => [...m, misc]);
    }
  };

  const answerQ2 = (idx: number) => {
    setQ2Answered(idx);
    const isCorrect = idx === q2.correct;
    setFirstTry((ft) => ({ ...ft, q2: ft.q2 ?? isCorrect }));
    if (isCorrect) {
      playTone('win', true);
    } else {
      playTone('alert', true);
      setWrongAttempts((w) => w + 1);
      const misc = q2.misconceptions[idx];
      if (misc) setMisconceptions((m) => [...m, misc]);
    }
  };

  const questionsSolved = q1Answered === q1.correct && q2Answered === q2.correct;

  const evidenceReady =
    props.mode === 'evidence' &&
    questionsSolved &&
    props.pickedIds.size > 0 &&
    rumorChecked.size === 0;
  const debriefReady =
    props.mode === 'debrief' &&
    questionsSolved &&
    props.workedIds.size > 0 &&
    props.problemIds.size > 0;

  return (
    <div
      className="investigation-overlay data-report-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Veri Yorumlama ve Grafik Rapor Hazırlama Masası"
    >
      <div className="data-report-card">
        <header className="data-report-header">
          <div>
            <span className="data-report-eyebrow">
              {props.mode === 'evidence'
                ? '📊 BÖLÜM 1 · VERİ BİLİMİ VE KANIT ANALİZ MASASI'
                : '📈 BÖLÜM 2 · 30. GÜN KARŞILAŞTIRMALI ETKİ & GRAFİK RAPORU'}
            </span>
            <h2>
              {props.mode === 'evidence'
                ? 'Kasaba Su Bilançosunu Yorumla ve Raporla'
                : '30 Günlük Uygulama Verilerini Analiz Et'}
            </h2>
          </div>
          <span className="data-report-status-chip">
            {questionsSolved ? '✓ Grafik Analizi Tamamlandı' : '🔎 Grafikleri İncele'}
          </span>
        </header>

        {/* ---------------- CHARTS & VISUAL DATA DASHBOARD ---------------- */}
        <div className="data-charts-grid">
          {props.mode === 'evidence' ? (
            <>
              {/* Chart 1: Town Water Flow Breakdown */}
              <div className="data-chart-box">
                <h3>💧 Kasaba Su Akış Dağılımı (L/dk)</h3>
                <p className="data-chart-sub">
                  Baraj Çıkışı: <strong>{f.outflowL} L/dk</strong> + Tarım Kanalı:{' '}
                  <strong>{f.farmL} L/dk</strong>
                </p>
                <div className="data-bars-vertical">
                  {[
                    { label: 'Evlere Ulaşan', val: f.homesL, max: f.outflowL, color: '#0284c7' },
                    { label: 'Boru Kaçağı (Kayıp)', val: f.leakL, max: f.outflowL, color: '#ef4444' },
                    { label: 'Merkez Park', val: f.parkL, max: f.outflowL, color: '#10b981' },
                    { label: 'Tarım Kanalı', val: f.farmL, max: f.outflowL, color: '#f59e0b' },
                  ].map((b) => (
                    <div key={b.label} className="data-hbar-row">
                      <div className="data-hbar-label">
                        <span>{b.label}</span>
                        <strong>{b.val} L/dk</strong>
                      </div>
                      <div className="data-hbar-track">
                        <div
                          className="data-hbar-fill"
                          style={{
                            width: `${Math.min(100, Math.round((b.val / b.max) * 100))}%`,
                            background: b.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart 2: Reservoir 4-Season Trend */}
              <div className="data-chart-box">
                <h3>📉 Baraj Rezervi 4 Dönemlik Eğilim (%)</h3>
                <p className="data-chart-sub">
                  Kritik Alarm Eşiği: <strong style={{ color: '#ef4444' }}>%{f.criticalPct}</strong>
                </p>
                <div className="data-column-chart">
                  {[
                    { label: 'Geçen Yıl', val: f.history.lastYear, color: '#38bdf8' },
                    { label: 'Kış', val: f.history.winter, color: '#0284c7' },
                    { label: 'Bahar', val: f.history.spring, color: '#f59e0b' },
                    { label: 'Bugün', val: f.history.today, color: '#ef4444' },
                  ].map((col) => (
                    <div key={col.label} className="data-col-item">
                      <span className="data-col-val">%{col.val}</span>
                      <div className="data-col-track">
                        <div
                          className="data-col-fill"
                          style={{ height: `${col.val}%`, background: col.color }}
                        />
                      </div>
                      <span className="data-col-label">{col.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Debrief Chart 1: 30-Day Reservoir Comparison */}
              <div className="data-chart-box">
                <h3>📊 30. Gün Baraj Rezervi Karşılaştırması (%)</h3>
                <p className="data-chart-sub">
                  Planın net katkısı: <strong>+{netGainVsNoPlan} puan</strong> (Plansız senaryoya göre)
                </p>
                <div className="data-column-chart">
                  {[
                    { label: 'Plan Öncesi', val: o.reservoirBefore, color: '#64748b' },
                    { label: 'Plansız 30. Gün', val: o.reservoirNoPlan, color: '#ef4444' },
                    { label: '15. Gün (Ara)', val: o.reservoirMid, color: '#f59e0b' },
                    { label: 'Planla 30. Gün', val: o.reservoirAfter, color: '#10b981' },
                  ].map((col) => (
                    <div key={col.label} className="data-col-item">
                      <span className="data-col-val">%{col.val}</span>
                      <div className="data-col-track">
                        <div
                          className="data-col-fill"
                          style={{ height: `${col.val}%`, background: col.color }}
                        />
                      </div>
                      <span className="data-col-label">{col.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Debrief Chart 2: Before vs After Sectoral Flows */}
              <div className="data-chart-box">
                <h3>🔄 Sektörel Su Çekimi: Önce → 30. Gün (L/dk)</h3>
                <p className="data-chart-sub">
                  Uygulanan müdahalelerin debi üzerindeki gerçek ölçümü:
                </p>
                <div className="data-bars-vertical">
                  {[
                    {
                      label: 'Şebeke Boru Kaçağı',
                      before: f.leakL,
                      after: o.leakAfterL,
                      color: '#10b981',
                    },
                    {
                      label: 'Tarım Kanalı Çekimi',
                      before: f.farmL,
                      after: o.farmAfterL,
                      color: '#0284c7',
                    },
                    {
                      label: 'Merkez Park Tüketimi',
                      before: f.parkL,
                      after: o.parkAfterL,
                      color: '#8b5cf6',
                    },
                  ].map((row) => (
                    <div key={row.label} className="data-hbar-row">
                      <div className="data-hbar-label">
                        <span>{row.label}</span>
                        <strong>
                          {row.before} L/dk → {row.after} L/dk{' '}
                          {row.after < row.before ? `(-${row.before - row.after} L/dk)` : '(Değişmedi)'}
                        </strong>
                      </div>
                      <div className="data-hbar-track">
                        <div
                          className="data-hbar-fill"
                          style={{
                            width: `${Math.min(100, Math.round((row.after / Math.max(1, row.before)) * 100))}%`,
                            background: row.after < row.before ? row.color : '#ef4444',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ---------------- DATA INTERPRETATION QUESTIONS ---------------- */}
        <section className="data-quiz-section">
          <h3>🧠 Grafik ve Veri Yorumlama Soruları</h3>
          <div className="data-quiz-grid">
            <div className="data-quiz-card">
              <p className="data-quiz-prompt">{q1.prompt}</p>
              <div className="data-quiz-options">
                {q1.options.map((opt, idx) => {
                  const picked = q1Answered === idx;
                  const isRight = idx === q1.correct;
                  return (
                    <button
                      key={opt}
                      type="button"
                      className={`data-quiz-btn${
                        picked ? (isRight ? ' correct' : ' wrong') : ''
                      }`}
                      onClick={() => answerQ1(idx)}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {q1Answered !== null && (
                <p className={`data-quiz-feedback ${q1Answered === q1.correct ? 'ok' : 'warn'}`}>
                  {q1Answered === q1.correct
                    ? `✓ ${q1.explanation}`
                    : 'Grafikteki çubuk ve yüzdeleri tekrar karşılaştırıp doğru seçeneği işaretle.'}
                </p>
              )}
            </div>

            <div className="data-quiz-card">
              <p className="data-quiz-prompt">{q2.prompt}</p>
              <div className="data-quiz-options">
                {q2.options.map((opt, idx) => {
                  const picked = q2Answered === idx;
                  const isRight = idx === q2.correct;
                  return (
                    <button
                      key={opt}
                      type="button"
                      className={`data-quiz-btn${
                        picked ? (isRight ? ' correct' : ' wrong') : ''
                      }`}
                      onClick={() => answerQ2(idx)}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {q2Answered !== null && (
                <p className={`data-quiz-feedback ${q2Answered === q2.correct ? 'ok' : 'warn'}`}>
                  {q2Answered === q2.correct
                    ? `✓ ${q2.explanation}`
                    : 'Sütunların değişim miktarına dikkat ederek tekrar dene.'}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ---------------- EVIDENCE / FINDINGS CLASSIFICATION ---------------- */}
        {props.mode === 'evidence' ? (
          <section className="data-findings-section">
            <h3>📋 Saha Kanıtlarını Raporuna Ekle (En az 1 doğrulanmış kanıt seç)</h3>
            <p className="data-evidence-hint">
              ⚠️ Dikkat: Masaya kasabada konuşulan bazı söylentiler de karışmış olabilir. Yalnızca
              ölçüm ve sayaç verisiyle doğrulanmış gerçek kanıtları rapora ekle.
            </p>
            <div className="data-evidence-list">
              {props.notebook
                .filter((entry) => (EVIDENCE_IDS as readonly string[]).includes(entry.cardId))
                .map((entry) => {
                  const checked = props.pickedIds.has(entry.cardId);
                  return (
                    <label
                      key={entry.cardId}
                      className={`data-evidence-item${checked ? ' checked' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => props.onToggleEvidence(entry.cardId)}
                      />
                      <span>
                        {entry.icon} {entry.text}
                        {entry.datum && <em> ({entry.datum})</em>}
                      </span>
                    </label>
                  );
                })}

              {/* Rumor distractors: student must identify them as non-empirical */}
              {rumors.map((rumor) => {
                const checked = rumorChecked.has(rumor.id);
                return (
                  <label
                    key={rumor.id}
                    className={`data-evidence-item rumor-item${checked ? ' rumor-checked' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRumor(rumor)}
                    />
                    <span>
                      {rumor.icon} <strong>[{rumor.source}]</strong> {rumor.text}
                    </span>
                  </label>
                );
              })}
            </div>

            {rumorFeedback && (
              <div className="rumor-warning-box" role="alert">
                <strong>⚠️ Bilimsel Kanıt Uyarısı ({rumorFeedback.source}):</strong>
                <p>{rumorFeedback.whyNotEvidence}</p>
                <small>Meclis raporuna yalnızca doğrulanmış ölçümler girebilir; lütfen işareti kaldır.</small>
              </div>
            )}
          </section>
        ) : (
          <section className="data-findings-section">
            <h3>
              📋 30. Gün Saha Gözlemlerini Sınıflandır (Her iki gruba en az 1 bulgu ata)
            </h3>
            <div className="data-evidence-list">
              {props.notebook
                .filter((entry) => entry.kind === 'finding')
                .map((entry) => {
                  const isWorked = props.workedIds.has(entry.cardId);
                  const isProblem = props.problemIds.has(entry.cardId);
                  return (
                    <div key={entry.cardId} className="data-debrief-row">
                      <span className="data-debrief-text">
                        {entry.icon} {entry.text}
                        {entry.datum && <em> ({entry.datum})</em>}
                      </span>
                      <div className="data-debrief-actions">
                        <button
                          type="button"
                          className={`report-chip worked${isWorked ? ' on' : ''}`}
                          onClick={() => props.onToggleFinding('worked', entry.cardId)}
                        >
                          ✅ Çözüldü / İşe Yaradı
                        </button>
                        <button
                          type="button"
                          className={`report-chip problem${isProblem ? ' on' : ''}`}
                          onClick={() => props.onToggleFinding('problem', entry.cardId)}
                        >
                          ⚠️ Sorun Sürüyor (Feragat)
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        )}

        <footer className="data-report-footer">
          {props.mode === 'evidence' ? (
            <button
              type="button"
              className="startup-button investigation-cta"
              disabled={!evidenceReady}
              onClick={() => {
                const firstTryCorrect = (firstTry.q1 ? 1 : 0) + (firstTry.q2 ? 1 : 0);
                props.onSubmitEvidence({
                  mode: 'evidence',
                  wrongAttempts,
                  completedAt: Date.now(),
                  firstTryCorrect,
                  misconceptions: Array.from(new Set(misconceptions)),
                  evidenceCheck: {
                    shownRumorIds: rumors.map((r) => r.id),
                    rumorPicks: Array.from(rumorEver),
                    filteredAll: rumorEver.size === 0,
                    completedAt: Date.now(),
                  },
                });
              }}
            >
              📊 VERİ RAPORUNU ONAYLA VE MECLİSE GÖNDER →
            </button>
          ) : (
            <button
              type="button"
              className="startup-button investigation-cta"
              disabled={!debriefReady}
              onClick={() => {
                const firstTryCorrect = (firstTry.q1 ? 1 : 0) + (firstTry.q2 ? 1 : 0);
                props.onSubmitDebrief({
                  mode: 'debrief',
                  wrongAttempts,
                  completedAt: Date.now(),
                  firstTryCorrect,
                  misconceptions: Array.from(new Set(misconceptions)),
                });
              }}
            >
              📈 30. GÜN GRAFİK RAPORUNU BAŞKANA SUN →
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
