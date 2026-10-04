import { useCallback, useEffect, useState } from 'react';

import manifestJson from '../Game/data/scenario-manifest.json';
import ParentReportModal from './ParentReportModal';
import {
  ApiError,
  staffAddParticipant,
  staffCreateActivity,
  staffCreateGroup,
  staffCreateWorkspace,
  staffDeleteGroup,
  staffDeleteParticipant,
  staffGetActivity,
  staffGetGroup,
  staffGetParticipantReport,
  staffListGroups,
  staffListWorkspaces,
  staffSetActivityStatus,
  type PublicReportResult,
  type RemoteGroup,
  type RemoteWorkspace,
  type StaffAuth,
} from '../Game/sync/api';

type StaffPanelProps = {
  auth: StaffAuth;
  identity: string;
  onSignOut: () => void;
};

type PanelView = 'workspaces' | 'group';

interface MembershipRow {
  role: string;
  workspace: RemoteWorkspace;
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Yönetici / Sahip',
  FACILITATOR: 'Öğretmen',
  VIEWER: 'Gözlemci',
};

const ATTEMPT_LABELS: Record<string, string> = {
  ACTIVE: 'Oynuyor',
  COMPLETED: 'Tamamlandı',
  ABANDONED: 'Yarım Kaldı',
};

export default function StaffPanel({ auth, identity, onSignOut }: StaffPanelProps) {
  const [view, setView] = useState<PanelView>('workspaces');

  const [memberships, setMemberships] = useState<MembershipRow[]>([]);
  const [workspaceName, setWorkspaceName] = useState('');
  const [currentWorkspace, setCurrentWorkspace] = useState<RemoteWorkspace | null>(null);
  const [groups, setGroups] = useState<RemoteGroup[]>([]);
  const [groupName, setGroupName] = useState('');

  const [group, setGroup] = useState<RemoteGroup | null>(null);
  const [participantName, setParticipantName] = useState('');
  const [activityTitle, setActivityTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Student report modal
  const [activeReport, setActiveReport] = useState<PublicReportResult | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    void navigator.clipboard.writeText(text);
    setCopyFeedback(`${label} panoya kopyalandı!`);
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  const refreshGroup = useCallback(
    async (groupId: string) => {
      const fresh = await staffGetGroup(auth, groupId);
      setGroup(fresh);
      const withAttempts = await Promise.all(
        (fresh.activities ?? []).map((a) => staffGetActivity(auth, a.id)),
      );
      setGroup((current) =>
        current ? { ...current, activities: withAttempts } : current,
      );
    },
    [auth],
  );

  const run = useCallback(
    async (job: () => Promise<void>) => {
      setBusy(true);
      setError(null);
      try {
        await job();
      } catch (e) {
        setError(
          e instanceof ApiError && e.status === 401
            ? 'Oturumun süresi doldu — çıkış yapıp tekrar giriş yapın.'
            : 'İşlem gerçekleştirilemedi — sunucu durumunu kontrol edin.',
        );
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const loadWorkspaces = useCallback(
    () =>
      staffListWorkspaces(auth).then(setMemberships).catch(() => {
        setMemberships([]);
        setError('Sunucuya ulaşılamadı.');
      }),
    [auth],
  );

  useEffect(() => {
    void loadWorkspaces();
  }, [loadWorkspaces]);

  const openGroup = (entry: RemoteGroup) =>
    run(async () => {
      await refreshGroup(entry.id);
      setView('group');
    });

  const handleDeleteGroup = (targetGroup: RemoteGroup) => {
    if (!currentWorkspace) return;
    if (!window.confirm(`"${targetGroup.name}" sınıfını ve kayıtlarını silmek istediğinize emin misiniz?`)) return;
    run(async () => {
      await staffDeleteGroup(auth, currentWorkspace.id, targetGroup.id);
      setGroups((list) => list.filter((g) => g.id !== targetGroup.id));
    });
  };

  const handleDeleteParticipant = (participantId: string, pName: string) => {
    if (!group) return;
    if (!window.confirm(`"${pName}" adlı öğrenciyi silmek istediğinize emin misiniz?`)) return;
    run(async () => {
      await staffDeleteParticipant(auth, group.id, participantId);
      await refreshGroup(group.id);
    });
  };

  const handleViewParticipantReport = (participantId: string) => {
    run(async () => {
      const rep = await staffGetParticipantReport(auth, participantId);
      setActiveReport(rep);
    });
  };

  // ================= WORKSPACES & GROUPS LIST =================
  if (view === 'workspaces') {
    return (
      <div className="gate-card professional-staff-card" aria-label="Öğretmen Yönetim Paneli">
        <div className="staff-header-row">
          <p className="startup-eyebrow">ÖĞRETMEN PANELİ · {identity}</p>
          <button className="gate-link logout-link" onClick={onSignOut}>
            Çıkış Yap ✕
          </button>
        </div>

        <h2 className="profile-title gate-title">Sınıflar & Çalışma Alanları</h2>

        {copyFeedback && <p className="gate-success-toast">{copyFeedback}</p>}

        {/* Workspace select / create */}
        {!currentWorkspace && memberships.length > 0 && (
          <div className="staff-section-block">
            <p className="gate-hint">Lütfen işlem yapmak istediğiniz okulu/alanı seçin:</p>
            <ul className="teacher-list">
              {memberships.map((m) => (
                <li key={m.workspace.id}>
                  <button
                    className="teacher-class-open"
                    onClick={() =>
                      run(async () => {
                        setCurrentWorkspace(m.workspace);
                        setGroups(await staffListGroups(auth, m.workspace.id));
                      })
                    }
                  >
                    <strong>🏫 {m.workspace.name}</strong>
                    <em className="share-code">{ROLE_LABELS[m.role] ?? m.role}</em>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Create workspace if none exists */}
        {memberships.length === 0 && (
          <div className="staff-section-block">
            <p className="gate-hint">Henüz tanımlı okul veya pilot çalışma alanınız yok:</p>
            <div className="gate-form">
              <input
                type="text"
                placeholder="Okul veya Alan Adı — ör. Atatürk İlkokulu"
                maxLength={60}
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
              />
              <button
                className="startup-button startup-button-primary gate-inline-btn"
                disabled={!workspaceName.trim() || busy}
                onClick={() =>
                  run(async () => {
                    const ws = await staffCreateWorkspace(auth, {
                      kind: 'SCHOOL',
                      name: workspaceName.trim(),
                    });
                    setWorkspaceName('');
                    setMemberships([{ role: 'OWNER', workspace: ws }]);
                    setCurrentWorkspace(ws);
                    setGroups([]);
                  })
                }
              >
                + Alan Oluştur
              </button>
            </div>
          </div>
        )}

        {/* Selected workspace details & group management */}
        {currentWorkspace && (
          <div className="staff-workspace-view">
            <div className="staff-meta-row">
              <span className="workspace-title-pill">🏫 {currentWorkspace.name}</span>
              {memberships.length > 1 && (
                <button
                  type="button"
                  className="gate-link"
                  onClick={() => {
                    setCurrentWorkspace(null);
                    setGroups([]);
                  }}
                >
                  ← Diğer Alanlar
                </button>
              )}
            </div>

            <p className="gate-hint">Bu alana ait sınıflar ve gruplar:</p>

            <ul className="teacher-list">
              {groups.map((entry) => (
                <li key={entry.id} className="staff-group-row">
                  <button
                    className="teacher-class-open"
                    onClick={() => openGroup(entry)}
                  >
                    <strong>👥 {entry.name}</strong>
                    <span className="join-code">Kod: {entry.joinCode}</span>
                  </button>
                  <button
                    type="button"
                    className="teacher-del"
                    title="Sınıfı Sil"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteGroup(entry);
                    }}
                  >
                    Sil
                  </button>
                </li>
              ))}
            </ul>

            {groups.length === 0 && (
              <p className="gate-hint empty-hint">Henüz bir sınıf/grup oluşturulmamış.</p>
            )}

            <div className="gate-form">
              <input
                type="text"
                placeholder="Yeni sınıf adı — ör. 5/A Sınıfı"
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
                      auth,
                      currentWorkspace.id,
                      groupName.trim(),
                    );
                    setGroupName('');
                    setGroups((list) => [...list, created]);
                  })
                }
              >
                + Sınıf Ekle
              </button>
            </div>
          </div>
        )}

        {error && <p className="gate-error" role="alert">{error}</p>}
      </div>
    );
  }

  // ================= GROUP / CLASS DETAIL VIEW =================
  if (view === 'group' && group) {
    const openActivity = (group.activities ?? []).find((a) => a.status === 'OPEN');

    return (
      <>
        <div className="gate-card professional-staff-card" aria-label={`${group.name} Sınıf Yönetimi`}>
          <div className="staff-header-row">
            <button
              className="gate-link"
              onClick={() => {
                setGroup(null);
                setView('workspaces');
              }}
            >
              ← Sınıf Listesine Dön
            </button>
            <span className="staff-current-tag">Öğretmen: {identity}</span>
          </div>

          <h2 className="profile-title gate-title">👥 {group.name}</h2>

          {/* Prominent Class Join Code Card */}
          <div className="staff-join-code-banner">
            <div>
              <span className="banner-label">ÖĞRENCİ SINIF KODU:</span>
              <strong className="banner-code">{group.joinCode}</strong>
            </div>
            <button
              type="button"
              className="startup-button startup-button-glass"
              onClick={() => copyToClipboard(group.joinCode, 'Sınıf Kodu')}
            >
              📋 Kodu Kopyala
            </button>
          </div>

          {copyFeedback && <p className="gate-success-toast">{copyFeedback}</p>}

          {/* Activity State / Session Control */}
          <div className="staff-activity-box">
            <h3 className="staff-subheading">🎮 Oyun Oturumu & Etkinlik Durumu</h3>
            {openActivity ? (
              <div className="activity-active-bar">
                <span className="activity-status-indicator pulse-green">● ETKİNLİK AÇIK</span>
                <span className="activity-name">{openActivity.title}</span>
                <button
                  type="button"
                  className="startup-button startup-button-glass btn-sm"
                  title="Öğrenci girişlerini kapat"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await staffSetActivityStatus(auth, openActivity.id, 'close');
                      await refreshGroup(group.id);
                    })
                  }
                >
                  ⏹ Oturumu Kapat
                </button>
              </div>
            ) : (
              <div className="activity-closed-bar">
                <span className="activity-status-indicator gray">○ ETKİNLİK KAPALI</span>
                <p className="activity-help-text">
                  Öğrencilerin sınıf koduyla oyuna girebilmesi için bir oturum başlatmalısınız.
                </p>
                {(group.activities ?? []).filter((a) => a.status === 'DRAFT').length > 0 ? (
                  <button
                    type="button"
                    className="startup-button startup-button-primary btn-sm"
                    disabled={busy}
                    onClick={() =>
                      run(async () => {
                        const draft = (group.activities ?? []).find((a) => a.status === 'DRAFT')!;
                        await staffSetActivityStatus(auth, draft.id, 'open');
                        await refreshGroup(group.id);
                      })
                    }
                  >
                    ▶ Oturumu Başlat (Aç)
                  </button>
                ) : (
                  <div className="gate-form">
                    <input
                      type="text"
                      placeholder="Yeni etkinlik adı — ör. 1. Dönem Simülasyonu"
                      maxLength={60}
                      value={activityTitle}
                      onChange={(e) => setActivityTitle(e.target.value)}
                    />
                    <button
                      type="button"
                      className="startup-button startup-button-primary gate-inline-btn"
                      disabled={!activityTitle.trim() || busy}
                      onClick={() =>
                        run(async () => {
                          const act = await staffCreateActivity(auth, group.id, {
                            title: activityTitle.trim(),
                            scenario: manifestJson.scenario,
                            version: manifestJson.version,
                            manifest: manifestJson.manifest,
                          });
                          await staffSetActivityStatus(auth, act.id, 'open');
                          setActivityTitle('');
                          await refreshGroup(group.id);
                        })
                      }
                    >
                      ▶ Etkinlik Oluştur ve Başlat
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Student Roster */}
          <div className="staff-roster-section">
            <h3 className="staff-subheading">
              🎒 Sınıf Öğrenci Listesi ({group.participants?.length ?? 0} Kayıt)
            </h3>

            {/* Add Student Form */}
            <div className="gate-form">
              <input
                type="text"
                placeholder="Öğrenci Adı Soyadı — ör. Ali Yılmaz"
                maxLength={60}
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' &&
                  !busy &&
                  participantName.trim() &&
                  run(async () => {
                    await staffAddParticipant(auth, group.id, participantName);
                    setParticipantName('');
                    await refreshGroup(group.id);
                  })
                }
              />
              <button
                type="button"
                className="startup-button startup-button-primary gate-inline-btn"
                disabled={!participantName.trim() || busy}
                onClick={() =>
                  run(async () => {
                    await staffAddParticipant(auth, group.id, participantName);
                    setParticipantName('');
                    await refreshGroup(group.id);
                  })
                }
              >
                + Öğrenci Ekle
              </button>
            </div>

            {/* Roster Table / List */}
            {group.participants && group.participants.length > 0 ? (
              <ul className="staff-student-list">
                {group.participants.map((p) => {
                  const attempt = p.latestAttempt;
                  const shareCode = p.shareCode ?? `DNGA-${p.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`;

                  return (
                    <li key={p.id} className="staff-student-card">
                      <div className="student-main-info">
                        <strong className="student-name">{p.displayName}</strong>
                        <div className="student-share-code-line">
                          <span className="code-tag">Veli Kodu: <code>{shareCode}</code></span>
                          <button
                            type="button"
                            className="code-copy-btn"
                            title="Veliye göndermek için kodu kopyala"
                            onClick={() => copyToClipboard(shareCode, `${p.displayName} veli kodu`)}
                          >
                            📋 Kopyala
                          </button>
                        </div>
                      </div>

                      <div className="student-actions-row">
                        <span className={`attempt-badge ${attempt ? attempt.status.toLowerCase() : 'none'}`}>
                          {attempt ? (ATTEMPT_LABELS[attempt.status] ?? attempt.status) : 'Başlamadı'}
                        </span>

                        <button
                          type="button"
                          className="startup-button startup-button-glass btn-xs"
                          onClick={() => handleViewParticipantReport(p.id)}
                        >
                          📊 Rapor
                        </button>

                        <button
                          type="button"
                          className="teacher-del"
                          title="Öğrenciyi Sil"
                          onClick={() => handleDeleteParticipant(p.id, p.displayName)}
                        >
                          ✕ Sil
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="gate-hint empty-hint">
                Bu sınıfta henüz kayıtlı öğrenci yok. Yukarıdaki formdan öğrenci ekleyin.
              </p>
            )}
          </div>

          {error && <p className="gate-error" role="alert">{error}</p>}
        </div>

        {/* Modal for viewing student report */}
        {activeReport && (
          <ParentReportModal
            report={activeReport}
            onClose={() => setActiveReport(null)}
          />
        )}
      </>
    );
  }

  return null;
}
