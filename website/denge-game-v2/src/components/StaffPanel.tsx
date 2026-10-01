import { useCallback, useEffect, useState } from 'react';

import { SoundKeys } from '../Game/data/assets';
import { playSfx } from '../Game/audio';
import manifestJson from '../Game/data/scenario-manifest.json';
import {
  staffAddParticipant,
  staffCreateActivity,
  staffCreateGroup,
  staffCreateWorkspace,
  staffGetActivity,
  staffGetGroup,
  staffListGroups,
  staffListWorkspaces,
  staffSetActivityStatus,
  type RemoteGroup,
  type RemoteWorkspace,
} from '../Game/sync/api';

/**
 * Facilitator console for the remote pilot flow.
 *
 * Until Supabase sign-in lands, the staff identity is a dev handle sent as
 * `x-atlas-user` (backend ignores it in production). The flow:
 *
 *   handle → workspace → group (join code + roster) → activity → open
 *
 * Kids then join with group code + roster name on the gate's pilot entry.
 */
type StaffPanelProps = {
  onBack: () => void;
};

type PanelView = 'workspaces' | 'group';

const STAFF_KEY = 'denge:v2:staff-subject';
const ATTEMPT_LABELS: Record<string, string> = {
  ACTIVE: 'sürüyor',
  COMPLETED: 'tamamlandı',
  ABANDONED: 'yarım kaldı',
};

export default function StaffPanel({ onBack }: StaffPanelProps) {
  const [subject, setSubject] = useState(
    () => localStorage.getItem(STAFF_KEY) ?? '',
  );
  const [subjectInput, setSubjectInput] = useState(subject);
  const [view, setView] = useState<PanelView>('workspaces');

  const [workspaces, setWorkspaces] = useState<RemoteWorkspace[]>([]);
  const [workspaceName, setWorkspaceName] = useState('');
  const [currentWorkspace, setCurrentWorkspace] =
    useState<RemoteWorkspace | null>(null);
  const [groups, setGroups] = useState<RemoteGroup[]>([]);
  const [groupName, setGroupName] = useState('');

  const [group, setGroup] = useState<RemoteGroup | null>(null);
  const [participantName, setParticipantName] = useState('');
  const [activityTitle, setActivityTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshGroup = useCallback(
    async (groupId: string) => {
      const fresh = await staffGetGroup(subject, groupId);
      setGroup(fresh);
      const withAttempts = await Promise.all(
        (fresh.activities ?? []).map((a) => staffGetActivity(subject, a.id)),
      );
      setGroup((current) =>
        current ? { ...current, activities: withAttempts } : current,
      );
    },
    [subject],
  );

  const run = useCallback(
    async (job: () => Promise<void>) => {
      setBusy(true);
      setError(null);
      try {
        await job();
      } catch {
        setError('İşlem başarısız — sunucu ayakta mı, kodu kontrol et.');
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const loadWorkspaces = useCallback(
    (handle: string) =>
      staffListWorkspaces(handle).then(setWorkspaces).catch(() => {
        setWorkspaces([]);
        setError('Sunucuya ulaşılamadı.');
      }),
    [],
  );

  useEffect(() => {
    if (subject) void loadWorkspaces(subject);
  }, [subject, loadWorkspaces]);

  const signIn = () => {
    const handle = subjectInput.trim();
    if (!handle) return;
    localStorage.setItem(STAFF_KEY, handle);
    setSubject(handle);
    playSfx(SoundKeys.TICK, 0.7);
  };

  const openGroup = (entry: RemoteGroup) =>
    run(async () => {
      await refreshGroup(entry.id);
      setView('group');
    });

  // ================= sign-in =================
  if (!subject) {
    return (
      <div className="gate-card" aria-label="Pilot yönetimi">
        <p className="startup-eyebrow">PİLOT YÖNETİMİ</p>
        <h2 className="profile-title gate-title">Yönetici adı</h2>
        <p className="gate-hint">
          Geliştirme aşamasında sunucu bu adı yönetici olarak tanır; gerçek
          giriş Supabase bağlanınca gelecek.
        </p>
        <input
          className="gate-code-input"
          type="text"
          placeholder="YÖNETİCİ ADI"
          maxLength={40}
          value={subjectInput}
          autoFocus
          onChange={(e) => setSubjectInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && signIn()}
        />
        <button
          className="startup-button startup-button-primary"
          disabled={!subjectInput.trim()}
          onClick={signIn}
        >
          Devam →
        </button>
        <button className="gate-link" onClick={onBack}>
          ← Geri dön
        </button>
      </div>
    );
  }

  // ================= workspace + group list =================
  if (view === 'workspaces') {
    return (
      <div className="gate-card" aria-label="Çalışma alanları">
        <p className="startup-eyebrow">PİLOT YÖNETİMİ · {subject}</p>
        <h2 className="profile-title gate-title">Çalışma alanları</h2>

        {workspaces.map((ws) => (
          <div key={ws.id} className="gate-form">
            <strong>{ws.name}</strong>
          </div>
        ))}

        <div className="gate-form">
          <input
            type="text"
            placeholder="Yeni çalışma alanı — ör. Ekim Pilotu"
            maxLength={60}
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
          />
          <button
            className="startup-button startup-button-primary gate-inline-btn"
            disabled={!workspaceName.trim() || busy}
            onClick={() =>
              run(async () => {
                const ws = await staffCreateWorkspace(subject, {
                  kind: 'PILOT',
                  name: workspaceName.trim(),
                });
                setWorkspaceName('');
                setWorkspaces((list) => [...list, ws]);
              })
            }
          >
            + Alan
          </button>
        </div>

        {currentWorkspace && (
          <>
            <p className="gate-hint">
              <strong>{currentWorkspace.name}</strong> — gruplar:
            </p>
            <ul className="teacher-list">
              {groups.map((entry) => (
                <li key={entry.id}>
                  <button
                    className="teacher-class-open"
                    onClick={() => openGroup(entry)}
                  >
                    <strong>{entry.name}</strong>
                    <span className="join-code">{entry.joinCode}</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="gate-form">
              <input
                type="text"
                placeholder="Yeni grup — ör. Sabah Grubu"
                maxLength={40}
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
              <button
                className="startup-button startup-button-primary gate-inline-btn"
                disabled={!groupName.trim() || busy}
                onClick={() =>
                  run(async () => {
                    const created = await staffCreateGroup(
                      subject,
                      currentWorkspace.id,
                      groupName.trim(),
                    );
                    setGroupName('');
                    setGroups((list) => [...list, created]);
                  })
                }
              >
                + Grup
              </button>
            </div>
          </>
        )}

        {!currentWorkspace && workspaces.length > 0 && (
          <ul className="teacher-list">
            {workspaces.map((ws) => (
              <li key={ws.id}>
                <button
                  className="teacher-class-open"
                  onClick={() =>
                    run(async () => {
                      setCurrentWorkspace(ws);
                      setGroups(await staffListGroups(subject, ws.id));
                    })
                  }
                >
                  <strong>{ws.name}</strong>
                </button>
              </li>
            ))}
          </ul>
        )}

        {error && <p className="gate-error" role="alert">{error}</p>}
        <button
          className="gate-link"
          onClick={() => {
            localStorage.removeItem(STAFF_KEY);
            setSubject('');
          }}
        >
          Farklı yönetici
        </button>
        <button className="gate-link" onClick={onBack}>
          ← Geri dön
        </button>
      </div>
    );
  }

  // ================= group detail =================
  if (view === 'group' && group) {
    return (
      <div className="gate-card" aria-label={`${group.name} grubu`}>
        <p className="startup-eyebrow">GRUP · {subject}</p>
        <h2 className="profile-title gate-title">{group.name}</h2>
        <p className="gate-hint">
          Grup kodu: <strong className="join-code">{group.joinCode}</strong> —
          çocuklar bu kod + listedeki adlarıyla giriyor
        </p>

        <div className="gate-form">
          <input
            type="text"
            placeholder="Katılımcı takma adı — ör. P-07"
            maxLength={60}
            value={participantName}
            onChange={(e) => setParticipantName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !busy && participantName.trim() &&
              run(async () => {
                await staffAddParticipant(subject, group.id, participantName);
                setParticipantName('');
                await refreshGroup(group.id);
              })}
          />
          <button
            className="startup-button startup-button-primary gate-inline-btn"
            disabled={!participantName.trim() || busy}
            onClick={() =>
              run(async () => {
                await staffAddParticipant(subject, group.id, participantName);
                setParticipantName('');
                await refreshGroup(group.id);
              })
            }
          >
            + Ekle
          </button>
        </div>

        {group.participants && group.participants.length > 0 && (
          <ul className="teacher-list">
            {group.participants.map((p) => (
              <li key={p.id}>
                <span className="teacher-list-name">{p.displayName}</span>
              </li>
            ))}
          </ul>
        )}

        <p className="gate-hint">Etkinlikler:</p>
        <ul className="teacher-list">
          {(group.activities ?? []).map((activity) => (
            <li key={activity.id}>
              <span className="teacher-list-name">
                {activity.title}
                <em> · {activity.status}</em>
                {activity.attempts && (
                  <em> · {activity.attempts.length} deneme</em>
                )}
              </span>
              {activity.status === 'DRAFT' && (
                <button
                  className="teacher-report"
                  title="Etkinliği aç"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await staffSetActivityStatus(subject, activity.id, 'open');
                      await refreshGroup(group.id);
                    })
                  }
                >
                  ▶
                </button>
              )}
              {activity.status === 'OPEN' && (
                <button
                  className="teacher-report"
                  title="Etkinliği kapat"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await staffSetActivityStatus(subject, activity.id, 'close');
                      await refreshGroup(group.id);
                    })
                  }
                >
                  ⏹
                </button>
              )}
            </li>
          ))}
        </ul>
        {(group.activities ?? []).some((a) => a.attempts?.length) && (
          <p className="gate-hint">
            {group.activities
              ?.flatMap((a) =>
                (a.attempts ?? []).map(
                  (t) =>
                    `${t.participant.displayName}: ${ATTEMPT_LABELS[t.status] ?? t.status} (${t._count.events} olay)`,
                ),
              )
              .join(' · ')}
          </p>
        )}

        <div className="gate-form">
          <input
            type="text"
            placeholder="Yeni etkinlik — ör. Sabah oturumu"
            maxLength={60}
            value={activityTitle}
            onChange={(e) => setActivityTitle(e.target.value)}
          />
          <button
            className="startup-button startup-button-primary gate-inline-btn"
            disabled={!activityTitle.trim() || busy}
            onClick={() =>
              run(async () => {
                await staffCreateActivity(subject, group.id, {
                  title: activityTitle.trim(),
                  scenario: manifestJson.scenario,
                  version: manifestJson.version,
                  manifest: manifestJson.manifest,
                });
                setActivityTitle('');
                await refreshGroup(group.id);
              })
            }
          >
            + Etkinlik
          </button>
        </div>
        <p className="gate-hint">
          Senaryo: <code>{manifestJson.scenario}@{manifestJson.version}</code>
        </p>

        {error && <p className="gate-error" role="alert">{error}</p>}
        <button
          className="gate-link"
          onClick={() => {
            setGroup(null);
            setView('workspaces');
          }}
        >
          ← Çalışma alanlarına dön
        </button>
      </div>
    );
  }

  return null;
}
