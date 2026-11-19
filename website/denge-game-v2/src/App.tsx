import { useEffect, useRef, useState } from 'react';

import PhaserGame from './components/PhaserGame';
import IntroSequence from './components/IntroSequence';
import InvestigationCard from './components/InvestigationCard';
import AylinWorkshopModal, { type AylinWorkshopDecisionResult } from './components/AylinWorkshopModal';
import KemalWorkshop from './components/workshop/KemalWorkshop';
import NuriWorkshop from './components/workshop/NuriWorkshop';
import FieldHud from './components/workshop/FieldHud';
import RizaWorkshop from './components/workshop/RizaWorkshop';
import KadimPuzzle from './components/workshop/KadimPuzzle';
import { KadimTracker, StoneReward } from './components/KadimStones';
import { planEffects, scenarioCard, activeFacts } from './Game/scenario';
import GuideModal from './components/GuideModal';
import DataReportModal, { type DataQuizMetric } from './components/DataReportModal';
import {
  analyzeStudentRationale,
  generatePedagogicalReport,
  type GuideChatTurn,
} from './Game/ai/pedagogicalEngine';
import { collectedStones, stoneForCard, type KadimPieceId } from './Game/data/kadim';
import type { FieldStatus, FieldTaskId } from './Game/data/fieldTasks';
import type { MinigameResult } from './Game/data/minigames';
import { minigameForCard } from './Game/data/minigames';
import SolutionPanel from './components/SolutionPanel';
import FinaleCard from './components/FinaleCard';
import AnnouncementCard from './components/AnnouncementCard';
import MiniMap from './components/MiniMap';
import PlayerMenu from './components/PlayerMenu';
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
  ObjectivePayload,
  OpenSolutionPayload,
  OverviewChangedPayload,
  SolutionPanelMode,
} from './Game/events/gameEvents';
import { applyDecision, applyStatChanges, INITIAL_STATS, STAT_META, type GameStats } from './Game/data/stats';
import {
  EVIDENCE_IDS,
  EVIDENCE_PROMPT,
  REPORT_PROMPT,
  type SolutionCard,
} from './Game/data/story';
import {
  getStudent,
  loadSession,
  newSession,
  recordEvent,
  saveSession,
  setActiveStudent,
  type GameSession,
  type KadimResult,
  type NotebookEntry,
  type StudentProfile,
} from './Game/data/session';
import { isMuted, playSfx, setMuted } from './Game/audio';
import { playRecordedVoice, setVoiceMuted, stopVoice } from './Game/speech';
import { SoundKeys } from './Game/data/assets';
import {
  getRemoteContext,
  getSyncStatus,
  subscribeSyncStatus,
  unbindAttempt,
  type SyncStatus,
} from './Game/sync/engine';

/** Short HUD wording for the remote-attempt sync state. */
const SYNC_LABELS: Record<Exclude<SyncStatus, 'local'>, string> = {
  synced: '✓ Kaydedildi',
  pending: '☁ Gönderim bekliyor',
  syncing: '↻ Kaydediliyor…',
  offline: '⚠ Bağlantı yok — kayıtlar bekliyor',
  error: '⚠ Kayıt sorunu — yetişkine söyle',
};

/**
 * React owns all UI: the HUD, the dialogue card and the decision buttons.
 * Phaser owns the world. They only ever talk through the typed EventBus.
 */
function App() {
  const [introStage, setIntroStage] = useState<IntroStage>('splash');
  const [player, setPlayer] = useState<StudentProfile | null>(null);
  const [savedName, setSavedName] = useState(() => loadSession()?.player.name);
  const [dialogue, setDialogue] = useState<DialoguePayload | null>(null);
  const [dialoguePage, setDialoguePage] = useState(0);
  /** Typewriter: how many characters of the current line are visible. */
  const [typed, setTyped] = useState(0);
  const [investigation, setInvestigation] = useState<InvestigationPayload | null>(null);
  const [fieldStatus, setFieldStatus] = useState<FieldStatus | null>(null);
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
  const [kadimOpen, setKadimOpen] = useState(false);
  /** Kadim map already handed to the mayor — the stone tracker retires. */
  const [kadimDone, setKadimDone] = useState(false);
  const [stoneReward, setStoneReward] = useState<{ pieceId: KadimPieceId; count: number } | null>(null);
  const [timeShift, setTimeShift] = useState<{
    from: { date: string; time: string };
    to: { date: string; time: string };
    label: string;
    direction: 'forward' | 'back';
  } | null>(null);
  const [dayTint, setDayTint] = useState<string | null>(null);
  const lastTime = useRef<{ date: string; time: string } | null>(null);
  const [finaleOpen, setFinaleOpen] = useState(false);
  const [mapOverview, setMapOverview] = useState(false);
  const [stats, setStats] = useState<GameStats>(INITIAL_STATS);
  const [district, setDistrict] = useState<string>('—');
  const [muted, setMutedState] = useState(isMuted());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(getSyncStatus());
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideHistory, setGuideHistory] = useState<GuideChatTurn[]>(
    () => loadSession()?.aiProfile?.guideHistory ?? [],
  );

  useEffect(() => subscribeSyncStatus(setSyncStatus), []);

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
    const onOverviewChanged = (payload: OverviewChangedPayload) => setMapOverview(payload.active);
    const onFieldStatus = (payload: FieldStatus | null) => setFieldStatus(payload);
    const onOpenKadim = () => setKadimOpen(true);

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
    EventBus.on(GameEvents.OVERVIEW_CHANGED, onOverviewChanged);
    EventBus.on(GameEvents.FIELD_TASK_STATUS, onFieldStatus);
    EventBus.on(GameEvents.OPEN_KADIM, onOpenKadim);

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
      EventBus.off(GameEvents.OVERVIEW_CHANGED, onOverviewChanged);
      EventBus.off(GameEvents.FIELD_TASK_STATUS, onFieldStatus);
      EventBus.off(GameEvents.OPEN_KADIM, onOpenKadim);
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
    if (!dialogue) return;
    const lines = [dialogue.text, ...(dialogue.pages ?? [])];
    const pageText = lines[dialoguePage] ?? '';
    playRecordedVoice(dialogue.voiceFiles?.[dialoguePage], dialogue.npcId, pageText);
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
    recordEvent('choice', { choiceId });
    setDialogue(null);
    EventBus.emit(GameEvents.DIALOGUE_CHOICE, choiceId);
  };

  const completeInvestigation = (cardId: string) => {
    const card = scenarioCard(cardId);
    if (card && !notebook.some((entry) => entry.cardId === card.id)) {
      const next = [
        ...notebook,
        { cardId: card.id, icon: card.icon, text: card.hint, datum: card.datum },
      ];
      setNotebook(next);
      persist({ notebook: next });
      // A district workshop also hands over a Kadim engraving stone — show it.
      const stone = stoneForCard(card.id);
      if (stone) {
        setStoneReward({ pieceId: stone.id, count: collectedStones(next.map((n) => n.cardId)).length });
      }
    }
    recordEvent('investigation', { cardId });
    setInvestigation(null);
    playSfx(SoundKeys.COMPLETE, 0.8);
    EventBus.emit(GameEvents.INVESTIGATION_COMPLETED, { cardId });
  };

  /** Workshop closed with ✕ before finishing — the scene must unfreeze. */
  const closeWorkshop = () => {
    setInvestigation(null);
    EventBus.emit(GameEvents.INVESTIGATION_CLOSED);
  };

  /** Workshop sends the student into town (sprinklers / radar). */
  const goToField = (task: FieldTaskId) => {
    setInvestigation(null);
    EventBus.emit(GameEvents.FIELD_TASK_START, { task });
  };

  /** Kadim map solved: keep the result for the teacher, then the plan meeting opens. */
  const finishKadim = (result: KadimResult) => {
    persist({ kadim: result });
    setKadimOpen(false);
    setKadimDone(true);
    playSfx(SoundKeys.COMPLETE, 0.8);
    EventBus.emit(GameEvents.KADIM_COMPLETED);
  };

  const closeKadim = () => {
    setKadimOpen(false);
    EventBus.emit(GameEvents.INVESTIGATION_CLOSED);
  };

  /** A district workshop finished: notebook entry + its own analytics event. */
  const finishWorkshop = (cardId: string, result: MinigameResult) => {
    completeInvestigation(cardId);
    recordEvent('minigame', { ...result });
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

  const recordDataQuiz = (metric?: DataQuizMetric) => {
    if (!metric) return;
    const current = loadSession();
    if (!current) return;
    const prevList = current.aiProfile?.dataQuizzes ?? [];
    saveSession({
      ...current,
      aiProfile: {
        ...current.aiProfile,
        dataQuizzes: [...prevList, metric],
      },
    });
  };

  const submitEvidence = (metric?: DataQuizMetric) => {
    const confirmedIds = [...evidencePicked];
    setEvidenceMode(false);
    setNotebookOpen(false);
    persist({ evidence: confirmedIds });
    recordDataQuiz(metric);
    recordEvent('evidence', {
      confirmedIds,
      graphWrongAttempts: metric?.wrongAttempts ?? 0,
    });
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

  const submitReport = (metric?: DataQuizMetric) => {
    const report = { workedIds: [...reportWorked], problemIds: [...reportProblems] };
    setReportMode(false);
    setNotebookOpen(false);
    persist({ report });
    recordDataQuiz(metric);
    recordEvent('report', {
      ...report,
      graphWrongAttempts: metric?.wrongAttempts ?? 0,
    });
    EventBus.emit(GameEvents.REPORT_SUBMITTED, report);
  };

  const submitPlan = (selected: SolutionCard[], totalCost: number, rationale: string) => {
    const plan = { solutionIds: selected.map((c) => c.id), totalCost, rationale };
    setSolutionOpen(false);
    playSfx(SoundKeys.ALERT, 0.9);

    const session = loadSession();
    const isRetry = session?.quest === 'retry';
    if (isRetry) {
      // Second-chance run: same starting conditions, so the alt plan applies
      // to the pre-plan snapshot - not on top of the first run's results.
      const baseStats = session.baseStats ?? stats;
      const nextStats = applyStatChanges(baseStats, ...planEffects(selected));
      setStats(nextStats);
      persist({ altPlan: plan, altStats: nextStats, stats: nextStats });
      recordEvent('alt-plan', plan);
    } else {
      const nextStats = applyStatChanges(stats, ...planEffects(selected));
      setStats(nextStats);
      persist({
        plan,
        stats: nextStats,
        baseStats: stats,
        planStats: nextStats,
      });
      recordEvent('plan', plan);
    }

    // Asynchronously run the Pedagogical AI Rationale Analyzer without blocking gameplay
    void analyzeStudentRationale({
      rationale,
      solutionIds: plan.solutionIds,
      totalCost,
      facts: activeFacts(),
      mode: isRetry ? 'retry' : 'initial',
    }).then((analysis) => {
      const current = loadSession();
      if (!current) return;
      const nextAiProfile = {
        ...current.aiProfile,
        ...(isRetry ? { altRationaleAnalysis: analysis } : { rationaleAnalysis: analysis }),
      };
      saveSession({ ...current, aiProfile: nextAiProfile });
      recordEvent('rationale-analysis', {
        mode: isRetry ? 'retry' : 'initial',
        systemicLevel: analysis.systemic_thinking.level,
        primaryFocus: analysis.stakeholder_empathy.primary_focus,
        sacrificedAxis: analysis.trade_off_awareness.sacrificed_axis,
      });
    });

    EventBus.emit(GameEvents.PLAN_SUBMITTED, {
      solutionIds: plan.solutionIds,
      totalCost,
      rationale,
    });
  };

  const submitFinale = (statement: string) => {
    setFinaleOpen(false);
    persist({ finalStatement: statement });
    recordEvent('finale', { statement });
    EventBus.emit(GameEvents.FINALE_SUBMITTED, { statement });

    // Pre-generate the personalized Parent & Teacher Pedagogical AI Report
    const latest = loadSession();
    if (latest) {
      void generatePedagogicalReport(latest, activeFacts()).then((summary) => {
        const current = loadSession();
        if (!current) return;
        saveSession({
          ...current,
          aiProfile: {
            ...current.aiProfile,
            reportSummary: summary,
          },
        });
      });
    }
  };

  const addGuideTurn = (turn: GuideChatTurn) => {
    setGuideHistory((prev) => {
      const next = [...prev, turn];
      const current = loadSession();
      if (current) {
        saveSession({
          ...current,
          aiProfile: {
            ...current.aiProfile,
            guideHistory: next,
          },
        });
      }
      return next;
    });
  };

  /** The composed announcement is saved, then the scene hangs the poster. */
  const submitAnnouncement = (icon: string, headline: string, message: string) => {
    setAnnounceOpen(false);
    playSfx(SoundKeys.ALERT, 0.9);
    persist({ announcement: { icon, headline, message } });
    recordEvent('announce', { icon, headline, message });
    EventBus.emit(GameEvents.ANNOUNCE_SUBMITTED, { icon, headline, message });
  };

  /**
   * Roster pick on the login screen: the student becomes active, their own
   * save resumes if it exists - otherwise a fresh session runs the cinematic.
   */
  const loginStudent = (student: StudentProfile) => {
    stopVoice();
    // Picked someone else while a remote attempt was bound? Detach the
    // engine so its queue can never write under another participant.
    const remote = getRemoteContext();
    if (remote && remote.participantId !== student.id) unbindAttempt();
    setPlayer(student);
    setSavedName(student.name);
    setActiveStudent(student.id);
    const session = loadSession(student.id);
    if (session) {
      hydrate(session);
      setIntroStage('complete');
    } else {
      setNotebook([]);
      setKadimDone(false);
      setGuideHistory([]);
      setStats({ ...INITIAL_STATS });
      setEvidencePicked(new Set());
      saveSession(newSession(student));
      setIntroStage('opening');
    }
  };

  /** Shared speaker toggle - used by the HUD button and the settings row. */
  const applyMuted = (value: boolean) => {
    setVoiceMuted(value);
    setMuted(value);
    setMutedState(value);
  };

  /** Player menu -> splash: the session stays saved, "Devam et" resumes it. */
  const goHome = () => {
    stopVoice();
    // Transient overlays would outlive the destroyed scene - drop them.
    setDialogue(null);
    setInvestigation(null);
    setSavedName(loadSession()?.player.name);
    setIntroStage('splash');
  };

  /** Player menu -> profile form: submitting it overwrites the session. */
  const switchProfile = () => {
    stopVoice();
    setDialogue(null);
    setInvestigation(null);
    setIntroStage('profile');
  };

  /** Copies a stored session into React state; the scene restores the rest. */
  const hydrate = (session: GameSession) => {
    setNotebook(session.notebook);
    setKadimDone(!!session.kadim);
    setGuideHistory(session.aiProfile?.guideHistory ?? []);
    setStats(session.stats);
    setEvidencePicked(new Set(session.evidence));
    setMuted(session.muted);
    setMutedState(session.muted);
  };

  /** "Devam et" on the splash: resumes whichever student was last active. */
  const resumeSession = () => {
    const session = loadSession();
    if (!session) return;
    const student = getStudent(session.studentId);
    setPlayer(
      student ?? {
        ...session.player,
        id: session.studentId,
        classId: '',
        shareCode: '',
        createdAt: session.savedAt,
      },
    );
    hydrate(session);
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
        onStudent={loginStudent}
        savedName={savedName}
        onResume={resumeSession}
        onBack={() => setIntroStage('splash')}
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

        {/* Remote attempt sync state - only rendered for server-bound play. */}
        {syncStatus !== 'local' && (
          <div className={`sync-chip sync-${syncStatus}`} role="status">
            {SYNC_LABELS[syncStatus]}
          </div>
        )}

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
        {fieldStatus && !investigation && !dialogue && <FieldHud status={fieldStatus} />}

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

        {!kadimDone && collectedStones(notebook.map((n) => n.cardId)).length > 0 && (
          <KadimTracker
            collected={collectedStones(notebook.map((n) => n.cardId))}
            fresh={stoneReward?.pieceId ?? null}
          />
        )}
        {stoneReward && (
          <StoneReward
            pieceId={stoneReward.pieceId}
            count={stoneReward.count}
            onDone={() => setStoneReward(null)}
          />
        )}

        <MiniMap
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
          onClick={() => applyMuted(!muted)}
        >
          {muted ? '🔇' : '🔊'}
        </button>

        <button
          type="button"
          className="guide-hud-button"
          aria-label="Lina Akıllı Rehbere sor"
          onClick={() => {
            playSfx(SoundKeys.TICK, 0.7);
            setGuideOpen(true);
          }}
        >
          🧭 <span>Lina’ya Sor</span>
        </button>

        {player && (
          <PlayerMenu
            player={player}
            muted={muted}
            objective={objective}
            onMute={applyMuted}
            onGoHome={goHome}
            onSwitchProfile={switchProfile}
          />
        )}

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
                onClick={() => submitEvidence()}
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
                  onClick={() => submitReport()}
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
        {investigation && investigation.cardId === 'baraj' && (
          <AylinWorkshopModal
            onComplete={(result: AylinWorkshopDecisionResult) => {
              completeInvestigation('baraj');
              const choiceKey = `aylin-${result.decisionId}`;
              const nextStats = applyDecision(stats, choiceKey);
              setStats(nextStats);
              persist({ stats: nextStats });
              recordEvent('minigame', {
                gameId: 'aylin',
                decisionId: result.decisionId,
                metrics: { cost: result.cost, waterSaved: result.waterSaved },
              });
            }}
            onClose={closeWorkshop}
            hasParkData={notebook.some((n) => n.cardId === 'park')}
            hasMahalleData={notebook.some((n) => n.cardId === 'konut')}
          />
        )}

        {investigation?.cardId === 'park' && (
          <KemalWorkshop
            field={investigation.field?.task === 'kemal-sprinklers' ? investigation.field : undefined}
            onGoToField={() => goToField('kemal-sprinklers')}
            onComplete={(result) => finishWorkshop('park', result)}
            onClose={closeWorkshop}
          />
        )}

        {investigation?.cardId === 'konut' && (
          <NuriWorkshop
            field={investigation.field?.task === 'nuri-radar' ? investigation.field : undefined}
            onGoToField={() => goToField('nuri-radar')}
            onComplete={(result) => finishWorkshop('konut', result)}
            onClose={closeWorkshop}
          />
        )}

        {investigation?.cardId === 'tarim' && (
          <RizaWorkshop
            onComplete={(result) => finishWorkshop('tarim', result)}
            onClose={closeWorkshop}
          />
        )}

        {investigation && !minigameForCard(investigation.cardId) && (() => {
          const card = scenarioCard(investigation.cardId);
          return card ? <InvestigationCard card={card} onComplete={completeInvestigation} /> : null;
        })()}

        {kadimOpen && <KadimPuzzle onComplete={finishKadim} onClose={closeKadim} />}

        {evidenceMode && (
          <DataReportModal
            mode="evidence"
            notebook={notebook}
            pickedIds={evidencePicked}
            onToggleEvidence={toggleEvidence}
            onSubmitEvidence={(metric) => submitEvidence(metric)}
          />
        )}

        {reportMode && (
          <DataReportModal
            mode="debrief"
            notebook={notebook}
            planIds={loadSession()?.plan?.solutionIds ?? []}
            workedIds={reportWorked}
            problemIds={reportProblems}
            onToggleFinding={toggleReportFinding}
            onSubmitDebrief={(metric) => submitReport(metric)}
          />
        )}

        {solutionOpen && <SolutionPanel mode={solutionMode} onSubmit={submitPlan} />}

        {announceOpen && <AnnouncementCard player={player} onSubmit={submitAnnouncement} />}

        {finaleOpen && <FinaleCard onSubmit={submitFinale} />}

        {guideOpen && (() => {
          const currentSession = loadSession();
          return (
            <GuideModal
              facts={activeFacts()}
              quest={currentSession?.quest ?? 'investigate'}
              completedCards={currentSession?.completedCards ?? notebook.map((n) => n.cardId)}
              plan={currentSession?.plan ?? null}
              history={guideHistory}
              onAddTurn={addGuideTurn}
              onClose={() => setGuideOpen(false)}
            />
          );
        })()}

        {!dialogue && !investigation && !kadimOpen && !solutionOpen && !finaleOpen && !announceOpen && !guideOpen && !mapOverview && (
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
