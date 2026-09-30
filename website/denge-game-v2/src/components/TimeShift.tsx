import { useEffect, useRef, useState } from 'react';

import { playSfx } from '../Game/audio';
import { SoundKeys } from '../Game/data/assets';

type TimeShiftProps = {
  /** The date/time we are leaving. */
  from: { date: string; time: string };
  /** The date/time we arrive at. */
  to: { date: string; time: string };
  /** Story label shown under the clock, e.g. '15. gün — Ayın ortası'. */
  label: string;
  /** 'forward' tears the page and spins hands clockwise; 'back' rewinds. */
  direction: 'forward' | 'back';
  onDone: () => void;
};

const DURATION_MS = 2600;
const SPIN_MS = 1800;

const toMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const hourAngle = (time: string): number => ((toMinutes(time) / 60) % 12) * 30;
const minuteAngle = (time: string): number => (toMinutes(time) % 60) * 6;

/**
 * Zaman geçişi kartı: takvim yaprağı yırtılır (ileri) ya da geri takılır
 * (retry), akrep-yelkovan döner, altında günün etiketi durur.
 */
export default function TimeShift({ from, to, label, direction, onDone }: TimeShiftProps) {
  const spin = direction === 'back' ? -720 : 720;
  const [angles, setAngles] = useState({ hour: hourAngle(from.time), minute: minuteAngle(from.time) });
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    playSfx(SoundKeys.TICK, 0.8);
    const start = window.setTimeout(
      () => setAngles({ hour: hourAngle(to.time) + spin, minute: minuteAngle(to.time) + spin }),
      80,
    );
    const mid = window.setTimeout(() => playSfx(SoundKeys.TICK, 0.6), SPIN_MS / 2);
    const end = window.setTimeout(() => doneRef.current(), DURATION_MS);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(mid);
      window.clearTimeout(end);
    };
    // Angles/labels are fixed per overlay instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Forward: the old page tears off, revealing the new date.
  // Back: the new date's page flies back on, covering the old date.
  const pageText = direction === 'back' ? to.date : from.date;
  const underText = direction === 'back' ? from.date : to.date;

  return (
    <div className="time-shift" role="status" aria-label={label}>
      <div className="ts-stage">
        <div className="ts-calendar">
          <div className="ts-page under">{underText}</div>
          <div className={`ts-page top ${direction === 'back' ? 'attach' : 'tear'}`}>
            {pageText}
          </div>
        </div>

        <svg className="ts-clock" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r="54" className="ts-face" />
          <circle cx="60" cy="60" r="4" className="ts-hub" />
          {[...Array(12)].map((_, i) => {
            const a = (i * 30 * Math.PI) / 180;
            return (
              <line
                key={i}
                x1={60 + Math.sin(a) * 46}
                y1={60 - Math.cos(a) * 46}
                x2={60 + Math.sin(a) * 50}
                y2={60 - Math.cos(a) * 50}
                className="ts-tick"
              />
            );
          })}
          <line
            x1="60" y1="60" x2="60" y2="30"
            className="ts-hand hour"
            style={{ transform: `rotate(${angles.hour}deg)`, transformOrigin: '60px 60px' }}
          />
          <line
            x1="60" y1="60" x2="60" y2="16"
            className="ts-hand minute"
            style={{ transform: `rotate(${angles.minute}deg)`, transformOrigin: '60px 60px' }}
          />
        </svg>

        <p className="ts-time">{to.time}</p>
      </div>
      <p className="ts-label">{label}</p>
    </div>
  );
}
