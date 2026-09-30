import { useEffect, useRef, useState } from 'react';

import PhaserGame from './components/PhaserGame';
import IntroSequence from './components/IntroSequence';
import InvestigationCard from './components/InvestigationCard';
import SolutionPanel from './components/SolutionPanel';
import FinaleCard from './components/FinaleCard';
import AnnouncementCard from './components/AnnouncementCard';
import MiniMap from './components/MiniMap';
import ChartView from './components/ChartView';
import TimeShift from './components/TimeShift';
import { advanceIntro, type IntroStage } from './Game/data/intro';
import { EventBus } from './Game/events/EventBus';
import { GameEvents } from './Game/events/gameEvents';
import type {
  DayChangedPayload,
  DialoguePayload,
  DistrictChangedPayload,
  FindingAddedPayload,
  InvestigationPayload,
  MarkersChangedPayload,
  MinimapMarker,
  ObjectivePayload,
  OpenSolutionPayload,
  OverviewChangedPayload,
  PlayerMovedPayload,
  SolutionPanelMode,
} from './Game/events/gameEvents';
import { applyDecision, applyStatChanges, INITIAL_STATS, STAT_META, type GameStats } from './Game/data/stats';
import {
  EVIDENCE_IDS,
  EVIDENCE_PROMPT,
  REPORT_PROMPT,
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
import { playRecordedVoice, setVoiceMuted, stopVoice } from './Game/speech';
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
  /** Typewriter: how many characters of the current line are visible. */
  const [typed, setTyped] = useState(0);
  const [investigation, setInvestigation] = useState<InvestigationPayload | null>(null);
  const [objective, setObjective] = useState<string | null>(null);
  const [notebook, setNotebook] = useState<NotebookEntry[]>([]);
  const [notebookOpen, setNotebookOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [evidenceMode, setEvidenceMode] = useState(false);
  const [evidencePicked, setEvidencePicked] = useState<Set<string>>(new Set());
  const [reportMode, setReportMode] = useState(false);
  /** Debrief classification: findings the player filed under each report column. */
  const [reportWorked, setReportWorked] = useState<Set<string>>(new Set());
  const [reportProblems, setReportProblems] = useState<Set<string>>(new Set());
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [solutionMode, setSolutionMode] = useState<SolutionPanelMode>('initial');
  const [announceOpen, setAnnounceOpen] = useState(false);
  const [timeShift, setTimeShift] = useState<{
    from: { date: string; time: string };
    to: { date: string; time: string };
    label: string;
    direction: 'forward' | 'back';
  } | null>(null);
  const [dayTint, setDayTint] = useState<string | null>(null);
  const lastTime = useRef<{ date: string; time: string } | null>(null);
  const [finaleOpen, setFinaleOpen] = useState(false);
  const [playerPos, setPlayerPos] = useState<{ x: number; y: number } | null>(null);
  const [mapMarkers, setMapMarkers] = useState<MinimapMarker[]>([]);
  const [mapOverview, setMapOverview] = useState(false);
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
      setTyped(0);
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
    const onOpenSolution = (payload: OpenSolutionPayload) => {
      setSolutionMode(payload.mode);
      setSolutionOpen(true);
    };
    const onFindingAdded = (payload: FindingAddedPayload) => {
      setNotebook((previous) => {
        if (previous.some((entry) => entry.cardId === payload.entry.cardId)) return previous;
        const next = [...previous, payload.entry];
        persist({ notebook: next });
        return next;
      });
      playSfx(SoundKeys.PAGE, 0.7);
    };
    const onDayChanged = (payload: DayChangedPayload) => {
      const arrived = { date: payload.date, time: payload.time };
      if (payload.direction === 'restore') {
        // Session resume: tint quietly, just remember where the clock is.
        lastTime.current = arrived;
        setDayTint(payload.tint);
        return;
      }
      setTimeShift({
        from: lastTime.current ?? arrived,
        to: arrived,
        label: payload.label,
        direction: payload.direction,
      });
      lastTime.current = arrived;
      setDayTint(payload.tint);
    };
    const onOpenReport = () => {
      setNotebookOpen(true);
      setReportMode(true);
    };
    const onOpenFinale = () => setFinaleOpen(true);
    const onOpenAnnounce = () => setAnnounceOpen(true);
    const onPlayerMoved = (payload: PlayerMovedPayload) => setPlayerPos(payload);
    const onMarkersChanged = (payload: MarkersChangedPayload) => setMapMarkers(payload.markers);
    const onOverviewChanged = (payload: OverviewChangedPayload) => setMapOverview(payload.active);

    EventBus.on(GameEvents.OPEN_DIALOGUE, onOpenDialogue);
    EventBus.on(GameEvents.DISTRICT_CHANGED, onDistrictChanged);
    EventBus.on(GameEvents.OPEN_INVESTIGATION, onOpenInvestigation);
    EventBus.on(GameEvents.OBJECTIVE_CHANGED, onObjectiveChanged);
    EventBus.on(GameEvents.OPEN_EVIDENCE, onOpenEvidence);
    EventBus.on(GameEvents.OPEN_SOLUTION, onOpenSolution);
    EventBus.on(GameEvents.FINDING_ADDED, onFindingAdded);
    EventBus.on(GameEvents.DAY_CHANGED, onDayChanged);
    EventBus.on(GameEvents.OPEN_REPORT, onOpenReport);
    EventBus.on(GameEvents.OPEN_FINALE, onOpenFinale);
    EventBus.on(GameEvents.OPEN_ANNOUNCE, onOpenAnnounce);
    EventBus.on(GameEvents.PLAYER_MOVED, onPlayerMoved);
    EventBus.on(GameEvents.MARKERS_CHANGED, onMarkersChanged);
    EventBus.on(GameEvents.OVERVIEW_CHANGED, onOverviewChanged);

    return () => {
      EventBus.off(GameEvents.OPEN_DIALOGUE, onOpenDialogue);
      EventBus.off(GameEvents.DISTRICT_CHANGED, onDistrictChanged);
      EventBus.off(GameEvents.OPEN_INVESTIGATION, onOpenInvestigation);
      EventBus.off(GameEvents.OBJECTIVE_CHANGED, onObjectiveChanged);
      EventBus.off(GameEvents.OPEN_EVIDENCE, onOpenEvidence);
      EventBus.off(GameEvents.OPEN_SOLUTION, onOpenSolution);
      EventBus.off(GameEvents.FINDING_ADDED, onFindingAdded);
      EventBus.off(GameEvents.DAY_CHANGED, onDayChanged);
      EventBus.off(GameEvents.OPEN_REPORT, onOpenReport);
      EventBus.off(GameEvents.OPEN_FINALE, onOpenFinale);
      EventBus.off(GameEvents.OPEN_ANNOUNCE, onOpenAnnounce);
      EventBus.off(GameEvents.PLAYER_MOVED, onPlayerMoved);
      EventBus.off(GameEvents.MARKERS_CHANGED, onMarkersChanged);
      EventBus.off(GameEvents.OVERVIEW_CHANGED, onOverviewChanged);
    };
  }, []);

  const typeTimer = useRef<number | null>(null);

  // Typewriter + karakter sesi: satır harf harf akarken konuşanın mırıltı
  // dosyası loop'ta çalar; satır bitince ya da kart kapanınca durur.
  useEffect(() => {
    if (!dialogue) return;
    const text = [dialogue.text, ...(dialogue.pages ?? [])][dialoguePage] ?? '';
    let i = 0;
    typeTimer.current = window.setInterval(() => {
      i += 1;
      setTyped(i);
      if (i >= text.length) {
        window.clearInterval(typeTimer.current ?? undefined);
        typeTimer.current = null;
      }
    }, 30);
    return () => {
      window.clearInterval(typeTimer.current ?? undefined);
      typeTimer.current = null;
    };
  }, [dialogue, dialoguePage]);

  useEffect(() => {
    playRecordedVoice(dialogue?.voiceFiles?.[dialoguePage]);
    return stopVoice;
  }, [dialogue, dialoguePage]);

  useEffect(() => {
    setVoiceMuted(muted);
  }, [muted]);

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

  /** Toggle a finding into/out of one of the two report columns. */
  const toggleReportFinding = (kind: 'worked' | 'problem', cardId: string) => {
    playSfx(SoundKeys.TICK, 0.7);
    const set = kind === 'worked' ? setReportWorked : setReportProblems;
    set((previous) => {
      const next = new Set(previous);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  };

  const submitReport = () => {
    const report = { workedIds: [...reportWorked], problemIds: [...reportProblems] };
    setReportMode(false);
    setNotebookOpen(false);
    persist({ report });
    EventBus.emit(GameEvents.REPORT_SUBMITTED, report);
  };

  const submitPlan = (selected: SolutionCard[], totalCost: number, rationale: string) => {
    const plan = { solutionIds: selected.map((c) => c.id), totalCost, rationale };
    setSolutionOpen(false);
    playSfx(SoundKeys.ALERT, 0.9);

    const session = loadSession();
    if (session?.quest === 'retry') {
      // Second-chance run: same starting conditions, so the alt plan applies
      // to the pre-plan snapshot - not on top of the first run's results.
      const baseStats = session.baseStats ?? stats;
      const nextStats = applyStatChanges(baseStats, ...selected.map((c) => c.effects));
      setStats(nextStats);
      persist({ altPlan: plan, altStats: nextStats, stats: nextStats });
    } else {
      const nextStats = applyStatChanges(stats, ...selected.map((c) => c.effects));
      setStats(nextStats);
      persist({
        plan,
        stats: nextStats,
        baseStats: stats,
        planStats: nextStats,
      });
    }

    EventBus.emit(GameEvents.PLAN_SUBMITTED, {
      solutionIds: plan.solutionIds,
      totalCost,
      rationale,
    });
  };

  const submitFinale = (statement: string) => {
    setFinaleOpen(false);
    persist({ finalStatement: statement });
    EventBus.emit(GameEvents.FINALE_SUBMITTED, { statement });
  };

  /** The composed announcement is saved, then the scene hangs the poster. */
  const submitAnnouncement = (icon: string, headline: string, message: string) => {
    setAnnounceOpen(false);
    playSfx(SoundKeys.ALERT, 0.9);
    persist({ announcement: { icon, headline, message } });
    EventBus.emit(GameEvents.ANNOUNCE_SUBMITTED, { icon, headline, message });
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
  const currentLine = dialogueLines[dialoguePage] ?? '';
  const typing = dialogue !== null && typed < currentLine.length;

  /** Undertale skip: show the whole line and silence the voice at once. */
  const skipTyping = () => {
    if (typeTimer.current !== null) {
      window.clearInterval(typeTimer.current);
      typeTimer.current = null;
    }
    setTyped(currentLine.length);
  };

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

        {/* Time-of-day tint sits over the world, under the HUD. */}
        <div className="day-tint" style={{ background: dayTint ?? 'transparent' }} />
        {timeShift && (
          <TimeShift
            from={timeShift.from}
            to={timeShift.to}
            label={timeShift.label}
            direction={timeShift.direction}
            onDone={() => setTimeShift(null)}
          />
        )}

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

        <MiniMap
          player={playerPos}
          markers={mapMarkers}
          overview={mapOverview}
          onToggle={() => EventBus.emit(GameEvents.MAP_TOGGLED)}
        />

        {mapOverview && (
          <div className="map-mode-pill">
            🗺️ Kasaba Haritası — <kbd>M</kbd> ile oyuna dön
          </div>
        )}

        <button
          className="mute-button"
          aria-label={muted ? 'Sesi aç' : 'Sesi kapat'}
          aria-pressed={muted}
          onClick={() => {
            setVoiceMuted(!muted);
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
            {reportMode && <p className="evidence-prompt">{REPORT_PROMPT}</p>}
            <ul>
              {notebook.map((entry) => {
                const reportMarkable = reportMode && entry.kind === 'finding';
                const evidenceMarkable =
                  !reportMode &&
                  evidenceMode &&
                  (EVIDENCE_IDS as readonly string[]).includes(entry.cardId);
                return (
                  <li key={entry.cardId} className={reportMarkable || evidenceMarkable ? 'markable' : ''}>
                    {reportMarkable ? (
                      <div className="report-row">
                        <span className="report-text">
                          {entry.icon} {entry.text}
                          {entry.datum && <em className="notebook-datum">{entry.datum}</em>}
                        </span>
                        <span className="report-chips">
                          <button
                            type="button"
                            className={`report-chip worked${reportWorked.has(entry.cardId) ? ' on' : ''}`}
                            aria-pressed={reportWorked.has(entry.cardId)}
                            title="İşe yaradı"
                            onClick={() => toggleReportFinding('worked', entry.cardId)}
                          >
                            ✅
                          </button>
                          <button
                            type="button"
                            className={`report-chip problem${reportProblems.has(entry.cardId) ? ' on' : ''}`}
                            aria-pressed={reportProblems.has(entry.cardId)}
                            title="Sorun sürüyor"
                            onClick={() => toggleReportFinding('problem', entry.cardId)}
                          >
                            ⚠️
                          </button>
                        </span>
                      </div>
                    ) : evidenceMarkable ? (
                      <label className="evidence-row">
                        <input
                          type="checkbox"
                          checked={evidencePicked.has(entry.cardId)}
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
            ) : reportMode ? (
              <>
                <p className="notebook-progress report-legend">
                  ✅ işe yaradı · ⚠️ sorun sürüyor — ikisinde de en az bir bulgu olmalı
                </p>
                <button
                  className="startup-button evidence-submit"
                  disabled={reportWorked.size === 0 || reportProblems.size === 0}
                  onClick={submitReport}
                >
                  ✔ Raporu hazırladım
                </button>
              </>
            ) : (
              <p className="notebook-progress">
                {Math.max(0, notebook.filter((e) => e.kind !== 'finding').length - 1)}/4 bölge
                incelendi
              </p>
            )}
          </aside>
        )}

        {/* ---------------- DIALOGUE ---------------- */}
        {dialogue && (
          <div className="dialogue-overlay">
            <div
              className="dialogue-card"
              onClick={() => {
                if (typing) skipTyping();
              }}
            >

              <div className="npc-name">{dialogue.name}</div>
              <p className="dialogue-text">
                {currentLine.slice(0, typed)}
                {typing && <span className="tw-cursor">▌</span>}
              </p>
              {isLastPage && !typing && dialogue.chart && (
                <div className="dialogue-chart">
                  <ChartView chart={dialogue.chart} />
                </div>
              )}

              {dialogue.choices && dialogue.choices.length > 0 && isLastPage && !typing ? (
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
                  onClick={() => {
                    if (typing) skipTyping();
                    else if (isLastPage) closeDialogue();
                    else {
                      setDialoguePage(dialoguePage + 1);
                      setTyped(0);
                    }
                  }}
                >
                  {typing ? '⏩' : isLastPage ? 'Devam Et' : 'Dinlemeye devam et →'}
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

        {solutionOpen && <SolutionPanel mode={solutionMode} onSubmit={submitPlan} />}

        {announceOpen && <AnnouncementCard player={player} onSubmit={submitAnnouncement} />}

        {finaleOpen && <FinaleCard onSubmit={submitFinale} />}

        {!dialogue && !investigation && !solutionOpen && !finaleOpen && !announceOpen && !mapOverview && (
          <p className="controls">
            WASD / Yön tuşları ile hareket et · NPC'nin yanında <kbd>E</kbd> ile konuş ·{' '}
            <kbd>M</kbd> ile kasaba haritası · <kbd>`</kbd> ile çarpışma kutularını göster
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
