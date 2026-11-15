/**
 * On-screen gauge while the student does a workshop's in-town part:
 * Kemal's sprinkler counter or Nuri's acoustic radar (dB meter).
 * Data arrives from the scene via FIELD_TASK_STATUS.
 */
import type { FieldStatus } from '../../Game/data/fieldTasks';
import './FieldHud.css';

const BARS = 16;

export default function FieldHud({ status }: { status: FieldStatus }) {
  if (status.task === 'kemal-sprinklers') {
    const done = status.aligned === status.total;
    return (
      <div className={`field-hud kemal ${done ? 'ok' : ''}`} role="status" aria-live="polite">
        <span className="field-hud-icon" aria-hidden>🚿</span>
        <div>
          <b>Fıskiyeler: {status.aligned}/{status.total} doğru yönde</b>
          <small>Fıskiyeye yürü, <kbd>E</kbd> ile çevir. Su yola düşüyorsa ⚠ yanar.</small>
        </div>
        <div className="field-hud-dots" aria-hidden>
          {Array.from({ length: status.total }, (_, i) => (
            <span key={i} className={i < status.aligned ? 'on' : ''} />
          ))}
        </div>
      </div>
    );
  }

  const level = Math.round(((status.db - 25) / 69) * BARS);
  const hint = status.hot
    ? 'Kaçak tam altında! E ile kazıyı aç.'
    : status.trend === 'up'
      ? 'Ses yükseliyor — doğru yöndesin.'
      : status.trend === 'down'
        ? 'Ses azalıyor — geri dön, başka yöne dene.'
        : 'Yürü ve sesin nasıl değiştiğini izle.';
  return (
    <div className={`field-hud radar ${status.hot ? 'hot' : ''}`} role="status" aria-live="polite">
      <span className="field-hud-icon" aria-hidden>{status.hot ? '🚨' : '🎧'}</span>
      <div className="field-hud-radar">
        <b>Akustik radar: {status.db} dB</b>
        <div className="field-hud-bars" aria-hidden>
          {Array.from({ length: BARS }, (_, i) => (
            <span key={i} className={i < level ? 'on' : ''} style={{ height: `${30 + (i / BARS) * 70}%` }} />
          ))}
        </div>
        <small>{hint}</small>
      </div>
    </div>
  );
}
