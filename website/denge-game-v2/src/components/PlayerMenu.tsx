import { useEffect, useState } from 'react';

import { AvatarFace } from './IntroSequence';
import { playSfx } from '../Game/audio';
import { SoundKeys } from '../Game/data/assets';
import {
  loadSession,
  studentOrg,
  QUEST_STAGE_LABELS,
  type StudentProfile,
} from '../Game/data/session';

/**
 * In-game player card: a small chip in the bottom-left corner that opens the
 * profile menu - session summary, settings and the way back to the splash /
 * profile screens. The world keeps running behind it; closing or navigating
 * is handled by App (the scene restores from the saved session on return).
 */
type PlayerMenuProps = {
  player: StudentProfile;
  muted: boolean;
  objective: string | null;
  onMute: (muted: boolean) => void;
  onGoHome: () => void;
  onSwitchProfile: () => void;
};

const formatSavedAt = (ts: number) =>
  new Date(ts).toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function PlayerMenu({
  player,
  muted,
  objective,
  onMute,
  onGoHome,
  onSwitchProfile,
}: PlayerMenuProps) {
  const [open, setOpen] = useState(false);

  // Esc closes the menu - the world keeps running, so no pause state needed.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Fresh read each time the panel opens - the session mutates constantly.
  const session = open ? loadSession() : null;
  const org = open ? studentOrg(player.id) : null;

  return (
    <>
      <button
        className="player-card"
        aria-label="Oyuncu profili ve menü"
        aria-expanded={open}
        onClick={() => {
          playSfx(SoundKeys.TICK, 0.6);
          setOpen((value) => !value);
        }}
      >
        <AvatarFace textureKey={player.avatar} size={30} />
        <span className="player-card-name">{player.name}</span>
        <span className="player-card-caret" aria-hidden="true">▲</span>
      </button>

      {open && (
        <aside className="player-menu" aria-label="Oyuncu profili">
          <div className="player-menu-head">
            <AvatarFace textureKey={player.avatar} />
            <div className="player-menu-id">
              <strong>
                {player.name}
                {player.studentNo && <em className="player-menu-no"> · {player.studentNo}</em>}
              </strong>
              <span>{session ? QUEST_STAGE_LABELS[session.quest] : 'Karar destekçisi'}</span>
              {org && (
                <span className="player-menu-org">
                  {org.schoolName} · {org.className}
                </span>
              )}
            </div>
            <button className="player-menu-close" aria-label="Kapat" onClick={() => setOpen(false)}>
              ✕
            </button>
          </div>

          <ul className="player-menu-facts">
            {objective && (
              <li>
                <span>🎯 Görev</span>
                <em>{objective}</em>
              </li>
            )}
            {session && (
              <li>
                <span>📒 Defter</span>
                <em>{session.notebook.length} kayıt</em>
              </li>
            )}
            {session?.plan && (
              <li>
                <span>📋 Plan</span>
                <em>{session.plan.solutionIds.length} çözüm · {session.plan.totalCost.toLocaleString('tr-TR')} ₺</em>
              </li>
            )}
            {session && (
              <li>
                <span>💾 Kayıt</span>
                <em>{formatSavedAt(session.savedAt)}</em>
              </li>
            )}
          </ul>

          <div className="player-menu-section">
            <h3>Ayarlar</h3>
            <button
              className="player-menu-row"
              aria-pressed={muted}
              onClick={() => {
                playSfx(SoundKeys.TICK, 0.7);
                onMute(!muted);
              }}
            >
              <span>{muted ? '🔇 Ses kapalı' : '🔊 Ses açık'}</span>
              <em>{muted ? 'Aç' : 'Kapat'}</em>
            </button>
          </div>

          <div className="player-menu-actions">
            <button className="player-menu-action" onClick={onGoHome}>
              🏠 Ana sayfaya dön
            </button>
            <button className="player-menu-action" onClick={onSwitchProfile}>
              🔁 Oturum değiştir
            </button>
          </div>
          <p className="player-menu-note">
            Her öğrencinin kaydı kendine aittir — oturum değiştirince bu oyun
            silinmez, listeden geri seçebilirsin.
          </p>
        </aside>
      )}
    </>
  );
}
