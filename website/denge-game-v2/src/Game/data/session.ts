/**
 * Mock org + session store - the seam where the real backend (Atlas) will
 * plug in later.
 *
 * TWO LAYERS, mirroring the platform:
 *
 *   1. ORG - the account hierarchy a school signs up as:
 *        School -> Teacher (signs in on the school's behalf)
 *               -> ClassRoom (owns a joinCode the students type in)
 *               -> Student (picked by name from the class roster)
 *      Teachers manage the roster; students never self-register.
 *
 *   2. SESSIONS - one GameSession per student, keyed by student id, plus an
 *      "active student" pointer so the game can always call loadSession()
 *      without knowing who is playing.
 *
 * Every session also carries an `events` log - a structured, chronological
 * trace of the player's decisions (choices, evidence, plan, report, finale).
 * Nothing analyses it yet; it exists so Atlas can later show teachers and
 * parents per-student breakdowns without changing the game. Each student
 * carries a `shareCode` - the future key of the parent report link.
 *
 * Today all of this persists to localStorage; when a database arrives only
 * these functions change (each one maps 1:1 onto a REST endpoint) - the UI
 * and the scene won't notice.
 */

import { TextureKeys, type TextureKey } from './assets';
import { INITIAL_STATS, type GameStats } from './stats';
import type { InvestigationId } from './story';
import { noteEvent, noteState } from '../sync/engine';

/** Mirrors the stage machine inside GameScene. */
export type QuestStage =
  // chapter 1 - understand the problem, decide a plan, tell the town
  | 'lina-intro'
  | 'meet-mayor'
  | 'investigate'
  | 'report'
  | 'meeting'
  | 'announce'
  // chapter 2 - the plan meets reality: 30 days, findings, second chance
  | 'expectation'
  | 'implement'
  | 'revisit'
  | 'debrief'
  | 'retry'
  | 'finale'
  | 'done';

/** Turkish display names for each stage - shown on the player profile card. */
export const QUEST_STAGE_LABELS: Record<QuestStage, string> = {
  'lina-intro': 'Lina ile tanışma',
  'meet-mayor': 'Belediye ziyareti',
  investigate: 'Bölgeleri inceleme',
  report: 'Lina’ya rapor',
  meeting: 'Çözüm toplantısı',
  announce: 'Kasabaya duyuru',
  expectation: 'Beklenti tahmini',
  implement: 'Uygulama — 30 gün',
  revisit: 'Sonuç turu',
  debrief: 'Belediye değerlendirmesi',
  retry: 'Alternatif plan',
  finale: 'Kapanış',
  done: 'Hikâye tamamlandı',
};

/** What the game itself needs to know about who is playing. */
export interface PlayerProfile {
  name: string;
  avatar: TextureKey;
}

// ---------------------------------------------------------------------------
// Org model - School -> Teacher -> ClassRoom -> Student
// ---------------------------------------------------------------------------

/** The customer. A school signs up once; its teachers act on its behalf. */
export interface School {
  id: string;
  name: string;
  createdAt: number;
}

/**
 * A teacher account belonging to a school. The mock "signs in on the
 * school's behalf" by picking/entering names - real auth arrives with Atlas.
 */
export interface TeacherProfile {
  id: string;
  schoolId: string;
  name: string;
}

/** A class owned by one teacher; students join by typing its joinCode. */
export interface ClassRoom {
  id: string;
  teacherId: string;
  name: string;
  /** Human-typable join code, e.g. `5A-K7X2` - generated when created. */
  joinCode: string;
  createdAt: number;
}

/**
 * A registered student - created by the teacher inside a class, never
 * self-registered. `name` is whatever the school needs for recognition;
 * PII minimisation (first name + initial) is a backend decision later.
 */
export interface StudentProfile extends PlayerProfile {
  id: string;
  classId: string;
  /** School number - optional, helps teachers tell same-name kids apart. */
  studentNo?: string;
  /** Future parent-report-link key, e.g. `DNGA-4K7X`. Generated at creation. */
  shareCode: string;
  createdAt: number;
}

export interface NotebookEntry {
  /** Investigation id for chapter-1 hints, `finding-*` ids for chapter-2 observations. */
  cardId: string;
  icon: string;
  text: string;
  datum?: string;
  /** `'finding'` marks a chapter-2 review observation (selectable in the town report). */
  kind?: 'finding';
}

export interface SubmittedPlan {
  solutionIds: string[];
  totalCost: number;
  /** The student's own justification for the package. */
  rationale?: string;
}

/**
 * One beat of gameplay worth analysing later. `type` says what happened,
 * `data` carries the specifics (choice id, plan contents, report columns…).
 */
export type SessionEventType =
  | 'choice'
  | 'investigation'
  | 'evidence'
  | 'plan'
  | 'announce'
  | 'report'
  | 'alt-plan'
  | 'finale'
  /** A district workshop finished (see data/minigames.ts). */
  | 'minigame';

export interface SessionEvent {
  at: number;
  type: SessionEventType;
  data?: Record<string, unknown>;
}

export interface GameSession {
  /** Owner account - sessions of different students never mix. */
  studentId: string;
  player: PlayerProfile;
  quest: QuestStage;
  completedCards: InvestigationId[];
  notebook: NotebookEntry[];
  evidence: string[];
  plan: SubmittedPlan | null;
  /** Announce round: residents already told about the plan. */
  announcedNpcIds: string[];
  /** Announce round: the plan poster was hung on the civic notice board. */
  posterHung: boolean;
  /** The public announcement the player composed for the town. */
  announcement?: { icon: string; headline: string; message: string };
  // ---- chapter 2 ------------------------------------------------------------
  /** The player's prediction, picked right after the announcement. */
  expectation?: string;
  /** Implementation timeline stop reached: 0 start, 1 mid-month, 2 day 30. */
  implPhase?: number;
  /** Residents whose post-implementation review talk was heard. */
  reviewedNpcIds?: string[];
  /** Stats snapshot taken right before the first plan was submitted. */
  baseStats?: GameStats;
  /** Stats right after plan 1 was applied - the "first run" result. */
  planStats?: GameStats;
  /** The debrief report: findings grouped by what worked vs. what still hurts. */
  report?: { workedIds: string[]; problemIds: string[] };
  /** The second-chance package, if the player tried an alternative. */
  altPlan?: SubmittedPlan | null;
  /** Stats after the alternative plan - the "second run" result. */
  altStats?: GameStats;
  /** The closing "Bugün karar versem…" sentence. */
  finalStatement?: string;
  stats: GameStats;
  /** Structured gameplay trace - the raw material for Atlas analytics. */
  events: SessionEvent[];
  /** Speaker toggle - remembered across sessions. */
  muted: boolean;
  savedAt: number;
}

/**
 * Avatar picker options - kept deliberately small: the two kid walk sheets.
 * The world sprite follows the pick (see GameScene.playerTexture).
 */
export const AVATARS: readonly TextureKey[] = [
  TextureKeys.PLAYER,
  TextureKeys.LINA,
] as const;

export const AVATAR_LABELS: Partial<Record<TextureKey, string>> = {
  [TextureKeys.PLAYER]: 'Erkek',
  [TextureKeys.LINA]: 'Kız',
};

// ---------------------------------------------------------------------------
// Storage layout
// ---------------------------------------------------------------------------

const ORG_KEY = 'denge-kasabasi-org-v1';
const ACTIVE_STUDENT_KEY = 'denge-kasabasi-active-student-v2';
const ACTIVE_TEACHER_KEY = 'denge-kasabasi-active-teacher-v2';
const LAST_CLASS_KEY = 'denge-kasabasi-last-class-v1';
const SESSION_PREFIX = 'denge-kasabasi-session-v2:';
/** Pre-org saves - migrated on first access. */
const LEGACY_SESSION_KEY = 'denge-kasabasi-session-v2';
const LEGACY_ACCOUNTS_KEY = 'denge-kasabasi-accounts-v2';

const sessionKey = (studentId: string) => `${SESSION_PREFIX}${studentId}`;

interface OrgFile {
  schools: School[];
  teachers: TeacherProfile[];
  classes: ClassRoom[];
  students: StudentProfile[];
}

const EMPTY_ORG: OrgFile = { schools: [], teachers: [], classes: [], students: [] };

function readOrg(): OrgFile {
  try {
    const raw = localStorage.getItem(ORG_KEY);
    return raw ? (JSON.parse(raw) as OrgFile) : { ...EMPTY_ORG, students: [] };
  } catch {
    return { ...EMPTY_ORG, students: [] };
  }
}

function writeOrg(org: OrgFile): void {
  try {
    localStorage.setItem(ORG_KEY, JSON.stringify(org));
  } catch {
    /* storage full or private mode */
  }
}

const makeId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/** Unambiguous alphabet for typed codes: no 0/O, 1/I, etc. */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const randomCode = (length = 4) =>
  Array.from({ length }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join('');

const makeJoinCode = (className: string, taken: readonly string[]): string => {
  const prefix = className.replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ]/g, '').slice(0, 4).toLocaleUpperCase('tr') || 'SNF';
  let code = '';
  do {
    code = `${prefix}-${randomCode()}`;
  } while (taken.includes(code));
  return code;
};

const makeShareCode = (taken: readonly string[]): string => {
  let code = '';
  do {
    code = `DNGA-${randomCode()}`;
  } while (taken.includes(code));
  return code;
};

// ---------------------------------------------------------------------------
// Migration - legacy saves become Demo org members, nothing is lost
// ---------------------------------------------------------------------------

let migrated = false;

/** Finds or creates the demo school/teacher/class used by all migrations. */
function demoClass(org: OrgFile): { school: School; teacher: TeacherProfile; classRoom: ClassRoom } {
  let school = org.schools.find((s) => s.name === 'Demo Okulu');
  if (!school) {
    school = { id: makeId('ok'), name: 'Demo Okulu', createdAt: Date.now() };
    org.schools.push(school);
  }
  let teacher = org.teachers.find((t) => t.schoolId === school!.id);
  if (!teacher) {
    teacher = { id: makeId('tc'), schoolId: school.id, name: 'Öğretmen' };
    org.teachers.push(teacher);
  }
  let classRoom = org.classes.find((c) => c.teacherId === teacher!.id);
  if (!classRoom) {
    classRoom = {
      id: makeId('cls'),
      teacherId: teacher.id,
      name: 'Demo Sınıfı',
      joinCode: makeJoinCode('DEMO', org.classes.map((c) => c.joinCode)),
      createdAt: Date.now(),
    };
    org.classes.push(classRoom);
  }
  return { school, teacher, classRoom };
}

interface LegacyAccountsFile {
  teacher?: { name: string } | null;
  students?: { id: string; name: string; studentNo?: string; avatar: TextureKey; createdAt: number }[];
}

function migrateAccounts(org: OrgFile): void {
  const raw = localStorage.getItem(LEGACY_ACCOUNTS_KEY);
  if (!raw) return;
  const legacy = JSON.parse(raw) as LegacyAccountsFile;
  const { teacher, classRoom } = demoClass(org);
  if (legacy.teacher?.name) teacher.name = legacy.teacher.name;
  const takenCodes = org.students.map((s) => s.shareCode);
  for (const old of legacy.students ?? []) {
    org.students.push({
      id: old.id,
      classId: classRoom.id,
      name: old.name,
      studentNo: old.studentNo,
      avatar: old.avatar,
      shareCode: makeShareCode(takenCodes),
      createdAt: old.createdAt,
    });
    takenCodes.push(org.students[org.students.length - 1].shareCode);
  }
  localStorage.removeItem(LEGACY_ACCOUNTS_KEY);
}

function migrateLegacySession(org: OrgFile): void {
  const raw = localStorage.getItem(LEGACY_SESSION_KEY);
  if (!raw) return;
  const legacy = JSON.parse(raw) as GameSession;
  const { classRoom } = demoClass(org);
  const takenCodes = org.students.map((s) => s.shareCode);
  const student: StudentProfile = {
    id: makeId('st'),
    classId: classRoom.id,
    name: legacy.player.name,
    avatar: legacy.player.avatar,
    shareCode: makeShareCode(takenCodes),
    createdAt: legacy.savedAt,
  };
  org.students.push(student);
  localStorage.setItem(
    sessionKey(student.id),
    JSON.stringify({ ...legacy, studentId: student.id, events: legacy.events ?? [] }),
  );
  localStorage.setItem(ACTIVE_STUDENT_KEY, student.id);
  localStorage.removeItem(LEGACY_SESSION_KEY);
}

function ensureMigrated(): void {
  if (migrated) return;
  migrated = true;
  try {
    if (localStorage.getItem(LEGACY_ACCOUNTS_KEY) || localStorage.getItem(LEGACY_SESSION_KEY)) {
      const org = readOrg();
      migrateAccounts(org);
      migrateLegacySession(org);
      writeOrg(org);
    }
  } catch {
    /* unreadable legacy data - just start clean */
  }
}

// ---------------------------------------------------------------------------
// Teacher auth (mock) - "signs in on the school's behalf"
//   -> future REST: POST /auth/teacher
// ---------------------------------------------------------------------------

export function getCurrentTeacher(): { teacher: TeacherProfile; school: School } | null {
  ensureMigrated();
  try {
    const id = localStorage.getItem(ACTIVE_TEACHER_KEY);
    if (!id) return null;
    const org = readOrg();
    const teacher = org.teachers.find((t) => t.id === id);
    const school = teacher && org.schools.find((s) => s.id === teacher.schoolId);
    return teacher && school ? { teacher, school } : null;
  } catch {
    return null;
  }
}

/**
 * Mock sign-in: matches (or registers) a school by name, then a teacher
 * under it. Real auth will verify credentials - this only carries identity.
 */
export function loginTeacher(schoolName: string, teacherName: string): TeacherProfile | null {
  ensureMigrated();
  const sName = schoolName.trim();
  const tName = teacherName.trim();
  if (!sName || !tName) return null;
  const org = readOrg();
  let school = org.schools.find((s) => s.name.toLocaleLowerCase('tr') === sName.toLocaleLowerCase('tr'));
  if (!school) {
    school = { id: makeId('ok'), name: sName, createdAt: Date.now() };
    org.schools.push(school);
  }
  let teacher = org.teachers.find(
    (t) => t.schoolId === school!.id && t.name.toLocaleLowerCase('tr') === tName.toLocaleLowerCase('tr'),
  );
  if (!teacher) {
    teacher = { id: makeId('tc'), schoolId: school.id, name: tName };
    org.teachers.push(teacher);
  }
  writeOrg(org);
  try {
    localStorage.setItem(ACTIVE_TEACHER_KEY, teacher.id);
  } catch {
    /* ignore */
  }
  return teacher;
}

export function logoutTeacher(): void {
  try {
    localStorage.removeItem(ACTIVE_TEACHER_KEY);
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// Classes - future REST: GET/POST/DELETE /classes, GET /classes/join/:code
// ---------------------------------------------------------------------------

/** Classes owned by the signed-in teacher. */
export function listClasses(): ClassRoom[] {
  ensureMigrated();
  const current = getCurrentTeacher();
  if (!current) return [];
  return readOrg()
    .classes.filter((c) => c.teacherId === current.teacher.id)
    .sort((a, b) => a.name.localeCompare(b.name, 'tr', { numeric: true }));
}

export function getClass(id: string): ClassRoom | null {
  ensureMigrated();
  return readOrg().classes.find((c) => c.id === id) ?? null;
}

/** Creates a class under the signed-in teacher; the join code is generated. */
export function addClass(name: string): ClassRoom | null {
  ensureMigrated();
  const current = getCurrentTeacher();
  const trimmed = name.trim();
  if (!current || !trimmed) return null;
  const org = readOrg();
  const classRoom: ClassRoom = {
    id: makeId('cls'),
    teacherId: current.teacher.id,
    name: trimmed,
    joinCode: makeJoinCode(trimmed, org.classes.map((c) => c.joinCode)),
    createdAt: Date.now(),
  };
  org.classes.push(classRoom);
  writeOrg(org);
  return classRoom;
}

/** Removes a class AND every student + save inside it - UI confirms first. */
export function removeClass(id: string): void {
  ensureMigrated();
  const org = readOrg();
  const removed = org.students.filter((s) => s.classId === id);
  org.classes = org.classes.filter((c) => c.id !== id);
  org.students = org.students.filter((s) => s.classId !== id);
  writeOrg(org);
  try {
    for (const student of removed) localStorage.removeItem(sessionKey(student.id));
    const active = localStorage.getItem(ACTIVE_STUDENT_KEY);
    if (active && removed.some((s) => s.id === active)) {
      localStorage.removeItem(ACTIVE_STUDENT_KEY);
    }
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// Student join - future REST: GET /classes/join/:code
// ---------------------------------------------------------------------------

export interface JoinedClass {
  classRoom: ClassRoom;
  school: School;
  teacher: TeacherProfile;
}

/**
 * Student login step 1: resolve a typed join code to its class + school.
 * The roster is never listed without a valid code.
 */
export function joinByCode(code: string): JoinedClass | null {
  ensureMigrated();
  const normalized = code.trim().toLocaleUpperCase('tr').replace(/\s+/g, '');
  if (!normalized) return null;
  const org = readOrg();
  const classRoom = org.classes.find((c) => c.joinCode.replace(/\s+/g, '') === normalized);
  if (!classRoom) return null;
  const teacher = org.teachers.find((t) => t.id === classRoom.teacherId);
  const school = teacher && org.schools.find((s) => s.id === teacher.schoolId);
  if (!teacher || !school) return null;
  try {
    localStorage.setItem(LAST_CLASS_KEY, classRoom.joinCode);
  } catch {
    /* ignore */
  }
  return { classRoom, school, teacher };
}

/** The classroom device remembers the last joined class - code skip. */
export function lastJoinCode(): string | null {
  try {
    return localStorage.getItem(LAST_CLASS_KEY);
  } catch {
    return null;
  }
}

export function clearLastClass(): void {
  try {
    localStorage.removeItem(LAST_CLASS_KEY);
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// Students - future REST: GET/POST/DELETE /classes/:id/students
// ---------------------------------------------------------------------------

export function listStudents(classId: string): StudentProfile[] {
  ensureMigrated();
  return readOrg()
    .students.filter((s) => s.classId === classId)
    .sort(
      (a, b) =>
        (a.studentNo ?? '￿').localeCompare(b.studentNo ?? '￿', 'tr', { numeric: true }) ||
        a.name.localeCompare(b.name, 'tr'),
    );
}

export function getStudent(id: string): StudentProfile | null {
  ensureMigrated();
  return readOrg().students.find((s) => s.id === id) ?? null;
}

/** Adds a student to a class; returns null when the school number is taken. */
export function addStudent(
  classId: string,
  input: { name: string; studentNo?: string; avatar: TextureKey },
): StudentProfile | null {
  ensureMigrated();
  const name = input.name.trim();
  const studentNo = input.studentNo?.trim() || undefined;
  if (!name || !getClass(classId)) return null;
  const org = readOrg();
  if (studentNo && org.students.some((s) => s.classId === classId && s.studentNo === studentNo)) {
    return null;
  }
  const student: StudentProfile = {
    id: makeId('st'),
    classId,
    name,
    studentNo,
    avatar: input.avatar,
    shareCode: makeShareCode(org.students.map((s) => s.shareCode)),
    createdAt: Date.now(),
  };
  org.students.push(student);
  writeOrg(org);
  return student;
}

/** Removes the account AND its saved game - the roster screen confirms first. */
export function removeStudent(id: string): void {
  ensureMigrated();
  const org = readOrg();
  org.students = org.students.filter((s) => s.id !== id);
  writeOrg(org);
  try {
    localStorage.removeItem(sessionKey(id));
    if (localStorage.getItem(ACTIVE_STUDENT_KEY) === id) {
      localStorage.removeItem(ACTIVE_STUDENT_KEY);
    }
  } catch {
    /* ignore */
  }
}

/** Where a student belongs - shown under the name on the profile menu. */
export function studentOrg(studentId: string): { schoolName: string; className: string } | null {
  ensureMigrated();
  const org = readOrg();
  const student = org.students.find((s) => s.id === studentId);
  const classRoom = student && org.classes.find((c) => c.id === student.classId);
  const teacher = classRoom && org.teachers.find((t) => t.id === classRoom.teacherId);
  const school = teacher && org.schools.find((s) => s.id === teacher.schoolId);
  return student && classRoom && school
    ? { schoolName: school.name, className: classRoom.name }
    : null;
}

// ---------------------------------------------------------------------------
// Active student - who is playing right now
// ---------------------------------------------------------------------------

export function getActiveStudentId(): string | null {
  ensureMigrated();
  try {
    return localStorage.getItem(ACTIVE_STUDENT_KEY);
  } catch {
    return null;
  }
}

export function setActiveStudent(id: string | null): void {
  ensureMigrated();
  try {
    if (id) localStorage.setItem(ACTIVE_STUDENT_KEY, id);
    else localStorage.removeItem(ACTIVE_STUDENT_KEY);
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// Sessions - one per student
//   -> future REST: GET/PUT /students/:id/session
// ---------------------------------------------------------------------------

export function loadSession(studentId?: string): GameSession | null {
  ensureMigrated();
  const id = studentId ?? getActiveStudentId();
  if (!id) return null;
  try {
    const raw = localStorage.getItem(sessionKey(id));
    if (!raw) return null;
    const session = JSON.parse(raw) as GameSession;
    // Defensive: fills fields added after the save was written.
    session.studentId = session.studentId ?? id;
    session.events = session.events ?? [];
    return session;
  } catch {
    return null;
  }
}

export function saveSession(session: GameSession): void {
  if (!session.studentId) return;
  const snapshot = { ...session, savedAt: Date.now() };
  try {
    localStorage.setItem(
      sessionKey(session.studentId),
      JSON.stringify(snapshot),
    );
  } catch {
    // Storage full or private mode - the game still works, it just won't resume.
  }
  // Remote attempt bound? Hand the newest snapshot to the sync engine; it
  // is a no-op for purely local sessions.
  noteState(session, snapshot);
}

export function clearSession(studentId?: string): void {
  const id = studentId ?? getActiveStudentId();
  if (!id) return;
  try {
    localStorage.removeItem(sessionKey(id));
  } catch {
    /* ignore */
  }
}

export function newSession(student: StudentProfile): GameSession {
  return {
    studentId: student.id,
    player: { name: student.name, avatar: student.avatar },
    quest: 'lina-intro',
    completedCards: [],
    notebook: [],
    evidence: [],
    plan: null,
    announcedNpcIds: [],
    posterHung: false,
    stats: { ...INITIAL_STATS },
    events: [],
    muted: false,
    savedAt: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// Roster + analytics helpers
// ---------------------------------------------------------------------------

/** Small badge for the login screen: where this student's save currently is. */
export function sessionSummary(studentId: string): { quest: QuestStage; savedAt: number } | null {
  const session = loadSession(studentId);
  return session ? { quest: session.quest, savedAt: session.savedAt } : null;
}

/**
 * Append to the active student's gameplay trace. No-op without a session -
 * the game should never crash because analytics storage failed.
 *   -> future REST: POST /sessions/:id/events
 */
export function recordEvent(type: SessionEventType, data?: Record<string, unknown>): void {
  const session = loadSession();
  if (!session) return;
  saveSession({
    ...session,
    events: [...session.events, { at: Date.now(), type, data }],
  });
  // Remote attempt bound? Enqueue the typed event into the persistent
  // outbox; no-op when the student is local-only.
  noteEvent(type, data ?? {}, session.studentId);
}

/**
 * Remote resume: the server sent an AttemptState snapshot for this
 * participant — drop it into the local cache so loadSession() (and the
 * whole synchronous read path) sees it exactly like a local save.
 */
export function hydrateRemoteSession(
  participantId: string,
  state: unknown,
): void {
  if (!state || typeof state !== 'object') return;
  try {
    localStorage.setItem(sessionKey(participantId), JSON.stringify(state));
  } catch {
    /* private mode — the game runs, resume just won't survive a reload */
  }
}

// ---------------------------------------------------------------------------
// Parent report link - future REST: GET /reports/:shareCode
// ---------------------------------------------------------------------------

export interface SharedStudent {
  student: StudentProfile;
  classRoom: ClassRoom;
  school: School;
  /** Snapshot at lookup time - null when the student never played. */
  session: GameSession | null;
}

/**
 * Parent/guardian entry: resolve a share code (`DNGA-XXXX`) to its student.
 * Read-only - the parent view must never mutate what comes back.
 */
export function findStudentByShareCode(code: string): SharedStudent | null {
  ensureMigrated();
  const normalized = code.trim().toLocaleUpperCase('tr').replace(/\s+/g, '');
  if (!normalized) return null;
  const org = readOrg();
  const student = org.students.find((s) => s.shareCode.replace(/\s+/g, '') === normalized);
  if (!student) return null;
  const classRoom = org.classes.find((c) => c.id === student.classId);
  const teacher = classRoom && org.teachers.find((t) => t.id === classRoom.teacherId);
  const school = teacher && org.schools.find((s) => s.id === teacher.schoolId);
  if (!classRoom || !school) return null;
  return { student, classRoom, school, session: loadSession(student.id) };
}
