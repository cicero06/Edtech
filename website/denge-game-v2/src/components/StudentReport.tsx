import { useState } from 'react';

import { AvatarFace } from './IntroSequence';
import {
  QUEST_STAGE_LABELS,
  loadSession,
  type GameSession,
  type SessionEvent,
  type StudentProfile,
} from '../Game/data/session';
import { STAT_META, type GameStats } from '../Game/data/stats';
import { SOLUTION_CARDS, investigationCard } from '../Game/data/story';

/**
 * Read-only descriptive report of one student's session - shown to the
 * teacher from the class panel and to the parent via share code.
 *
 * Displays collected state as-is: no grading, no interpretation. The
 * behaviour-profile analytics (evidence-seeking, plan revision…) are an
 * Atlas-side layer to be designed after the game flow is final.
 */
type StudentReportProps = {
  student: StudentProfile;
  schoolName: string;
  className: string;
  onBack: () => void;
  backLabel?: string;
};

const EVENT_LABELS: Record<SessionEvent['type'], string> = {
  choice: 'Karar verdi',
  investigation: 'Bölge inceledi',
  evidence: 'Kanıt seçti',
  plan: 'Plan paketi sundu',
  announce: 'Kasabaya duyurdu',
  report: 'Bulgu raporu hazırladı',
  'alt-plan': 'Alternatif plan sundu',
  finale: 'Kapanış yaptı',
  minigame: 'Atölye görevini tamamladı',
};

const fmtTime = (at: number) =>
  new Date(at).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

const solutionOf = (id: string) => SOLUTION_CARDS.find((s) => s.id === id);

/** Stat changes between two snapshots (+N / −N chips; zero deltas hidden). */
function StatDelta({ before, after }: { before?: GameStats; after?: GameStats }) {
  if (!before || !after) return null;
  const rows = STAT_META.map(({ key, icon, label }) => ({
    key,
    icon,
    label,
    delta: after[key] - before[key],
    to: after[key],
  })).filter((r) => r.delta !== 0);
  if (rows.length === 0) return <p className="report-note">Ölçülebilir değişim olmadı.</p>;
  return (
    <ul className="report-deltas">
      {rows.map((r) => (
        <li key={r.key}>
          <span>
            {r.icon} {r.label}
          </span>
          <em className={r.delta > 0 ? 'delta up' : 'delta down'}>
            {r.delta > 0 ? '+' : ''}
            {r.delta} → {r.to}
          </em>
        </li>
      ))}
    </ul>
  );
}

/** One plan package: picked solutions, total cost, the student's own words. */
function PlanBlock({ session, which }: { session: GameSession; which: 'plan' | 'altPlan' }) {
  const plan = which === 'plan' ? session.plan : session.altPlan;
  if (!plan) return null;
  return (
    <>
      <ul className="plan-items">
        {plan.solutionIds.map((id) => {
          const s = solutionOf(id);
          return (
            <li key={id}>
              <span>{s ? `${s.icon} ${s.title}` : id}</span>
              {s && <em>{s.cost.toLocaleString('tr-TR')} ₺</em>}
            </li>
          );
        })}
        <li className="plan-total">
          <span>Toplam</span>
          <em>{plan.totalCost.toLocaleString('tr-TR')} ₺</em>
        </li>
      </ul>
      {plan.rationale && <blockquote className="report-quote">“{plan.rationale}”</blockquote>}
      <StatDelta
        before={which === 'plan' ? session.baseStats : session.planStats}
        after={which === 'plan' ? session.planStats : session.altStats}
      />
    </>
  );
}

/** Report findings may reference notebook entries or investigation ids. */
function findingLabel(session: GameSession, id: string): string {
  const note = session.notebook.find((n) => n.cardId === id);
  if (note) return `${note.icon} ${note.text}`;
  const card = investigationCard(id);
  return card ? `${card.icon} ${card.title}` : id;
}

export default function StudentReport({
  student,
  schoolName,
  className,
  onBack,
  backLabel = '← Geri',
}: StudentReportProps) {
  // Snapshot on mount - the report never writes back to the session.
  const [session] = useState<GameSession | null>(() => loadSession(student.id));

  return (
    <div className="gate-card report-card" aria-label={`${student.name} raporu`}>
      <header className="report-head">
        <AvatarFace textureKey={student.avatar} size={56} />
        <div className="report-identity">
          <strong>{student.name}</strong>
          <span>
            {student.studentNo && <>No: {student.studentNo} · </>}
            {schoolName} · {className}
          </span>
        </div>
        <span className="join-code">veli kodu: {student.shareCode}</span>
      </header>

      {!session ? (
        <p className="report-note">
          Bu öğrenci henüz oynamadı — kayıt başlayınca rapor burada görünür.
        </p>
      ) : (
        <>
          <section className="report-section">
            <h3>Aşama</h3>
            <p className="report-stage">
              {QUEST_STAGE_LABELS[session.quest]}
              <em> · son kayıt {fmtTime(session.savedAt)}</em>
            </p>
          </section>

          <section className="report-section">
            <h3>İncelemeler ({session.completedCards.length})</h3>
            {session.completedCards.length === 0 ? (
              <p className="report-note">Henüz bölge incelenmedi.</p>
            ) : (
              <ul className="rep-chips">
                {session.completedCards.map((id) => {
                  const card = investigationCard(id);
                  return <li key={id}>{card ? `${card.icon} ${card.title}` : id}</li>;
                })}
              </ul>
            )}
            {session.notebook.length > 0 && (
              <ul className="report-notes-list">
                {session.notebook.map((n) => (
                  <li key={n.cardId}>
                    {n.icon} {n.text}
                    {n.datum && <em> ({n.datum})</em>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {session.evidence.length > 0 && (
            <section className="report-section">
              <h3>Seçilen kanıtlar</h3>
              <ul className="rep-chips">
                {session.evidence.map((id) => {
                  const card = investigationCard(id);
                  return <li key={id}>{card ? `${card.icon} ${card.title}` : id}</li>;
                })}
              </ul>
            </section>
          )}

          {session.plan && (
            <section className="report-section">
              <h3>İlk plan</h3>
              <PlanBlock session={session} which="plan" />
            </section>
          )}

          {session.announcement && (
            <section className="report-section">
              <h3>Kasaba duyurusu</h3>
              <p className="report-announce">
                {session.announcement.icon} <strong>{session.announcement.headline}</strong>
              </p>
              <blockquote className="report-quote">{session.announcement.message}</blockquote>
            </section>
          )}

          {session.report && (
            <section className="report-section">
              <h3>Sonuç raporu</h3>
              <div className="report-verdict">
                <div>
                  <h4>✅ İşe yaradı</h4>
                  <ul className="rep-chips good">
                    {session.report.workedIds.map((id) => (
                      <li key={id}>{findingLabel(session, id)}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4>⚠️ Sorun sürüyor</h4>
                  <ul className="rep-chips bad">
                    {session.report.problemIds.map((id) => (
                      <li key={id}>{findingLabel(session, id)}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          )}

          {session.altPlan && (
            <section className="report-section">
              <h3>Alternatif plan</h3>
              <PlanBlock session={session} which="altPlan" />
            </section>
          )}

          {session.finalStatement && (
            <section className="report-section">
              <h3>Kapanış cümlesi</h3>
              <blockquote className="report-quote">“{session.finalStatement}”</blockquote>
            </section>
          )}

          {session.events.length > 0 && (
            <section className="report-section">
              <h3>Etkinlik izi ({session.events.length})</h3>
              <ol className="report-timeline">
                {session.events.map((ev, i) => (
                  <li key={i}>
                    <time>{fmtTime(ev.at)}</time>
                    <span>{EVENT_LABELS[ev.type]}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </>
      )}

      <button className="gate-link" onClick={onBack}>
        {backLabel}
      </button>
    </div>
  );
}
