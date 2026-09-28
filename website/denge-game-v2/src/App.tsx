import { useEffect, useState } from 'react';

import PhaserGame from './components/PhaserGame';
import IntroSequence from './components/IntroSequence';
import InvestigationCard from './components/InvestigationCard';
import SolutionPanel from './components/SolutionPanel';
import { advanceIntro, type IntroStage } from './Game/data/intro';
import { EventBus } from './Game/events/EventBus';
import { GameEvents } from './Game/events/gameEvents';
import type {
  DialoguePayload,
  DistrictChangedPayload,
  InvestigationPayload,
  ObjectivePayload,
} from './Game/events/gameEvents';
import { applyDecision, applyStatChanges, INITIAL_STATS, STAT_META, type GameStats } from './Game/data/stats';
import {
  EVIDENCE_IDS,
  EVIDENCE_PROMPT,
  investigationCard,
  type SolutionCard,
} from './Game/data/story';
import {
  loadSession,
  newSession,
  saveSession,
  type GameSession,
  type NotebookEntry,
  type PlayerProfile,
} from './Game/data/session';
import { isMuted, playSfx, setMuted } from './Game/audio';
import { SoundKeys } from './Game/data/assets';

/**
 * React owns all UI: the HUD, the dialogue card and the decision buttons.
 * Phaser owns the world. They only ever talk through the typed EventBus.
 */
function App() {
  const [introStage, setIntroStage] = useState<IntroStage>('splash');
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [savedName] = useState(() => loadSession()?.player.name);
  const [dialogue, setDialogue] = useState<DialoguePayload | null>(null);
  const [dialoguePage, setDialoguePage] = useState(0);
  const [investigation, setInvestigation] = useState<InvestigationPayload | null>(null);
  const [objective, setObjective] = useState<string | null>(null);
  const [notebook, setNotebook] = useState<NotebookEntry[]>([]);
  const [notebookOpen, setNotebookOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [evidenceMode, setEvidenceMode] = useState(false);
  const [evidencePicked, setEvidencePicked] = useState<Set<string>>(new Set());
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [stats, setStats] = useState<GameStats>(INITIAL_STATS);
  const [district, setDistrict] = useState<string>('—');
  const [muted, setMutedState] = useState(isMuted());

  /** Merge-write into the mock session store; no-op until a profile exists. */
  const persist = (patch: Partial<GameSession>) => {
    const session = loadSession();
    if (session) saveSession({ ...session, ...patch });
  };

  // ---- Phaser -> React -----------------------------------------------------
  useEffect(() => {
    const onOpenDialogue = (payload: DialoguePayload) => {
      setDialogue(payload);
      setDialoguePage(0);
    };
    const onDistrictChanged = (payload: DistrictChangedPayload) => setDistrict(payload.label);
    const onOpenInvestigation = (payload: InvestigationPayload) => setInvestigation(payload);
    const onObjectiveChanged = (payload: ObjectivePayload) => {
      setObjective(payload.text);
      persist({ quest: payload.stage });
    };
    const onOpenEvidence = () => {
      setNotebookOpen(true);
      setEvidenceMode(true);
    };
    const onOpenSolution = () => setSolutionOpen(true);

    EventBus.on(GameEvents.OPEN_DIALOGUE, onOpenDialogue);
    EventBus.on(GameEvents.DISTRICT_CHANGED, onDistrictChanged);
    EventBus.on(GameEvents.OPEN_INVESTIGATION, onOpenInvestigation);
    EventBus.on(GameEvents.OBJECTIVE_CHANGED, onObjectiveChanged);
    EventBus.on(GameEvents.OPEN_EVIDENCE, onOpenEvidence);
    EventBus.on(GameEvents.OPEN_SOLUTION, onOpenSolution);

    return () => {
      EventBus.off(GameEvents.OPEN_DIALOGUE, onOpenDialogue);
      EventBus.off(GameEvents.DISTRICT_CHANGED, onDistrictChanged);
      EventBus.off(GameEvents.OPEN_INVESTIGATION, onOpenInvestigation);
      EventBus.off(GameEvents.OBJECTIVE_CHANGED, onObjectiveChanged);
      EventBus.off(GameEvents.OPEN_EVIDENCE, onOpenEvidence);
      EventBus.off(GameEvents.OPEN_SOLUTION, onOpenSolution);
    };
  }, []);

  // ---- React -> Phaser -----------------------------------------------------
  const closeDialogue = () => {
    setDialogue(null);
    EventBus.emit(GameEvents.DIALOGUE_CLOSED);
  };

  const selectChoice = (choiceId: string) => {
    const nextStats = applyDecision(stats, choiceId);
    setStats(nextStats);
    persist({ stats: nextStats });
    setDialogue(null);
    EventBus.emit(GameEvents.DIALOGUE_CHOICE, choiceId);
  };

  const completeInvestigation = (cardId: string) => {
    const card = investigationCard(cardId);
    if (card && !notebook.some((entry) => entry.cardId === card.id)) {
      const next = [
        ...notebook,
        { cardId: card.id, icon: card.icon, text: card.hint, datum: card.datum },
      ];
      setNotebook(next);
      persist({ notebook: next });
    }
    setInvestigation(null);
    playSfx(SoundKeys.COMPLETE, 0.8);
    EventBus.emit(GameEvents.INVESTIGATION_COMPLETED, { cardId });
  };

  const toggleEvidence = (cardId: string) => {
    playSfx(SoundKeys.TICK, 0.7);
    setEvidencePicked((previous) => {
      const next = new Set(previous);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  };

  const submitEvidence = () => {
    const confirmedIds = [...evidencePicked];
    setEvidenceMode(false);
    setNotebookOpen(false);
    persist({ evidence: confirmedIds });
    EventBus.emit(GameEvents.EVIDENCE_SUBMITTED, { confirmedIds });
  };

  const submitPlan = (selected: SolutionCard[], totalCost: number, rationale: string) => {
    const nextStats = applyStatChanges(stats, ...selected.map((c) => c.effects));
    setStats(nextStats);
    setSolutionOpen(false);
    persist({
      plan: { solutionIds: selected.map((c) => c.id), totalCost, rationale },
      stats: nextStats,
    });
    playSfx(SoundKeys.ALERT, 0.9);
    EventBus.emit(GameEvents.PLAN_SUBMITTED, {
      solutionIds: selected.map((c) => c.id),
      totalCost,
      rationale,
    });
  };

  /** Mock login: a fresh session starts when the profile form is submitted. */
  const startSession = (profile: PlayerProfile) => {
    setPlayer(profile);
    setNotebook([]);
    setStats({ ...INITIAL_STATS });
    setEvidencePicked(new Set());
    saveSession(newSession(profile));
  };

  /** "Devam et" on the splash: hydrate React, the scene restores its own quest. */
  const resumeSession = () => {
    const session = loadSession();
    if (!session) return;
    setPlayer(session.player);
    setNotebook(session.notebook);
    setStats(session.stats);
    setEvidencePicked(new Set(session.evidence));
    setMuted(session.muted);
    setMutedState(session.muted);
    setIntroStage('complete');
  };

  const dialogueLines = dialogue ? [dialogue.text, ...(dialogue.pages ?? [])] : [];
  const isLastPage = dialoguePage >= dialogueLines.length - 1;

  if (introStage !== 'complete') {
    return (
      <IntroSequence
        stage={introStage}
        onContinue={() => setIntroStage((current) => advanceIntro(current, introStage))}
        onProfile={startSession}
        savedName={savedName}
        onResume={resumeSession}
      />
    );
  }

  return (
    <main>
      <h1 className="visually-hidden">Denge Kasabası</h1>

      <div className="game-wrapper">
        <PhaserGame />

        {/* ---------------- HUD ---------------- */}
        <button
          className="balance-cluster"
          aria-label="Denge göstergeleri"
          aria-expanded={statsOpen}
          onClick={() => setStatsOpen((open) => !open)}
        >
          {STAT_META.map(({ key, icon, label }) => (
            <StatGauge key={key} icon={icon} label={label} value={stats[key]} color={STAT_COLORS[key]} />
          ))}
        </button>
        <div className="district-pill">{district}</div>

        {statsOpen && (
          <aside className="balance-panel" aria-label="Denge detayları">
            {STAT_META.map(({ key, icon, label }) => (
              <div key={key} className="balance-cell">
                <BigGauge
                  icon={icon}
                  value={stats[key]}
                  color={STAT_COLORS[key]}
                />
                <span className="balance-name">{label}</span>
                <span className={`balance-status ${statusClass(stats[key])}`}>
                  {statusLabel(stats[key])}
                </span>
              </div>
            ))}
          </aside>
        )}

        {objective && <div className="objective-pill">🎯 {objective}</div>}

        {notebook.length > 0 && (
          <button
            className="notebook-button"
            aria-label="Kanıt defterini aç"
            aria-expanded={notebookOpen}
            onClick={() => {
              playSfx(SoundKeys.PAGE, 0.8);
              setNotebookOpen((open) => !open);
            }}
          >
            📒<span className="notebook-count">{notebook.length}</span>
          </button>
        )}

        <button
          className="mute-button"
          aria-label={muted ? 'Sesi aç' : 'Sesi kapat'}
          aria-pressed={muted}
          onClick={() => {
            setMuted(!muted);
            setMutedState(!muted);
          }}
        >
          {muted ? '🔇' : '🔊'}
        </button>

        {notebookOpen && (
          <aside className="notebook-panel" aria-label="Kanıt defteri">
            <h2>{player ? `${player.name} • Kanıt Defteri` : 'Kanıt Defteri'}</h2>
            {evidenceMode && <p className="evidence-prompt">{EVIDENCE_PROMPT}</p>}
            <ul>
              {notebook.map((entry) => {
                const markable = EVIDENCE_IDS.includes(entry.cardId);
                const checked = evidencePicked.has(entry.cardId);
                return (
                  <li key={entry.cardId} className={evidenceMode && markable ? 'markable' : ''}>
                    {evidenceMode && markable ? (
                      <label className="evidence-row">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleEvidence(entry.cardId)}
                        />
                        <span>
                          {entry.icon} {entry.text}
                          {entry.datum && <em className="notebook-datum">{entry.datum}</em>}
                        </span>
                      </label>
                    ) : (
                      <>
                        {entry.icon} {entry.text}
                        {entry.datum && <em className="notebook-datum">{entry.datum}</em>}
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
            {evidenceMode ? (
              <button
                className="startup-button evidence-submit"
                disabled={evidencePicked.size === 0}
                onClick={submitEvidence}
              >
                ✔ Nedenleri işaretledim
              </button>
            ) : (
              <p className="notebook-progress">
                {Math.max(0, notebook.length - 1)}/4 bölge incelendi
              </p>
            )}
          </aside>
        )}

        {/* ---------------- DIALOGUE ---------------- */}
        {dialogue && (
          <div className="dialogue-overlay">
            <div className="dialogue-card">
              <div className="npc-name">{dialogue.name}</div>
              <p className="dialogue-text">{dialogueLines[dialoguePage]}</p>

              {dialogue.choices && dialogue.choices.length > 0 && isLastPage ? (
                <div className="dialogue-choices">
                  {dialogue.choices.map((choice) => (
                    <button
                      key={choice.id}
                      className="choice-button"
                      onClick={() => selectChoice(choice.id)}
                    >
                      {choice.text}
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  className="continue-button"
                  onClick={() => (isLastPage ? closeDialogue() : setDialoguePage(dialoguePage + 1))}
                >
                  {isLastPage ? 'Devam Et' : 'Dinlemeye devam et →'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ---------------- INVESTIGATION ---------------- */}
        {investigation && (() => {
          const card = investigationCard(investigation.cardId);
          return card ? <InvestigationCard card={card} onComplete={completeInvestigation} /> : null;
        })()}

        {solutionOpen && <SolutionPanel onSubmit={submitPlan} />}

        {!dialogue && !investigation && !solutionOpen && (
          <p className="controls">
            WASD / Yön tuşları ile hareket et · NPC'nin yanında <kbd>E</kbd> ile konuş ·{' '}
            <kbd>`</kbd> ile çarpışma kutularını göster
          </p>
        )}
      </div>
    </main>
  );
}

/** One ring color per balance axis - matches the icons, visible at a glance. */
const STAT_COLORS: Record<keyof GameStats, string> = {
  environment: '#57b36a',
  economy: '#e0b34f',
  society: '#5f9fd8',
  water: '#4db8e0',
};

type StatGaugeProps = {
  icon: string;
  label: string;
  value: number;
  color: string;
};

function StatGauge({ icon, label, value, color }: StatGaugeProps) {
  return (
    <span className="stat-gauge" title={`${label}: ${value}`}>
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <circle
          cx="20"
          cy="20"
          r="16"
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="5"
        />
        <circle
          cx="20"
          cy="20"
          r="16"
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${value} 100`}
          transform="rotate(-90 20 20)"
        />
      </svg>
      <span className="gauge-icon">{icon}</span>
    </span>
  );
}

/** Status word + color so the state reads at a glance, without the number. */
function statusClass(value: number): string {
  if (value < 30) return 'critical';
  if (value < 60) return 'warning';
  return 'good';
}

function statusLabel(value: number): string {
  if (value < 30) return 'Kritik';
  if (value < 60) return 'Dikkat';
  return 'Dengeli';
}

type BigGaugeProps = {
  icon: string;
  value: number;
  color: string;
};

function BigGauge({ icon, value, color }: BigGaugeProps) {
  return (
    <span className="big-gauge">
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle
          cx="32"
          cy="32"
          r="26"
          fill="none"
          stroke="#e4ecdf"
          strokeWidth="7"
        />
        <circle
          cx="32"
          cy="32"
          r="26"
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${value} 100`}
          transform="rotate(-90 32 32)"
        />
      </svg>
      <span className="big-gauge-center">
        <span className="big-gauge-icon">{icon}</span>
        <span className="big-gauge-value">%{value}</span>
      </span>
    </span>
  );
}

export default App;
