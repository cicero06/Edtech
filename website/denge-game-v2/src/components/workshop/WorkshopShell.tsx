/**
 * Frame shared by the district workshops: header, NPC speech line, telemetry
 * chips and the content area. Each workshop only renders its own steps.
 */
import type { ReactNode } from 'react';
import { SPRITESHEET_ASSETS, type TextureKey } from '../../Game/data/assets';
import './Workshop.css';

export interface WorkshopChip {
  icon: string;
  label: string;
  ok: boolean;
}

interface Props {
  theme: 'kemal' | 'nuri' | 'riza';
  eyebrow: string;
  title: string;
  stepLabel: string;
  npc: { texture: TextureKey; label: string };
  speech: string;
  /** Speech turns red — used for safety warnings. */
  alert?: boolean;
  chips: WorkshopChip[];
  sound: boolean;
  onToggleSound: () => void;
  onClose: () => void;
  children: ReactNode;
}

/** Front-facing first frame of an NPC walk strip, like the investigation cards. */
export function NpcFace({ texture }: { texture: TextureKey }) {
  const sheet = SPRITESHEET_ASSETS.find((s) => s.key === texture);
  if (!sheet) return null;
  const height = 64;
  const frameW = (sheet.frameWidth / sheet.frameHeight) * height;
  return (
    <div className="ws-portrait" style={{ width: frameW }} aria-hidden>
      <img
        src={`${import.meta.env.BASE_URL}${encodeURI(sheet.path)}`}
        alt=""
        style={{ width: frameW * sheet.columns, height }}
        draggable={false}
      />
    </div>
  );
}

export default function WorkshopShell(props: Props) {
  return (
    <div className={`ws-overlay ws-theme-${props.theme}`} role="dialog" aria-modal="true" aria-label={props.title}>
      <div className="ws-shell">
        <header className="ws-top">
          <div>
            <div className="ws-eyebrow">{props.eyebrow}</div>
            <h1 className="ws-title">{props.title}</h1>
          </div>
          <div className="ws-top-actions">
            <span className="ws-badge">{props.stepLabel}</span>
            <button className="ws-btn ghost" onClick={props.onToggleSound} aria-label="Ses">
              {props.sound ? '🔊' : '🔇'}
            </button>
            <button className="ws-btn ghost" onClick={props.onClose} aria-label="Kapat">
              ✕
            </button>
          </div>
        </header>

        <section className={`ws-speech ${props.alert ? 'alert' : ''}`} aria-live="polite">
          <NpcFace texture={props.npc.texture} />
          <div>
            <div className="ws-eyebrow">{props.npc.label}</div>
            <p>{props.speech}</p>
          </div>
        </section>

        <div className="ws-chips">
          {props.chips.map((chip) => (
            <div key={chip.icon + chip.label} className={`ws-chip ${chip.ok ? 'ok' : ''}`}>
              <span aria-hidden>{chip.icon}</span> {chip.label} {chip.ok && '✓'}
            </div>
          ))}
        </div>

        {props.children}
      </div>
    </div>
  );
}
