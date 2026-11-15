/**
 * Bereket Vadisi drip-irrigation model — a direct port of the Unity
 * simulation (GameHUD.Riza.cs → UpdateRizaPhysicsSimulation), kept free of
 * React and three.js so both the 3D scene and the console read one truth.
 */

export type Hour = 'noon' | 'morning' | 'night';

export interface FarmState {
  valveOpen: boolean;
  /** 1 = filter full of sand, 0 = clean. */
  sediment: number;
  pipes: [boolean, boolean, boolean];
  /** Pressure-compensating gold nozzle on the sloped third row. */
  pcNozzle: boolean;
  /** System pressure in bar (regulator), 0.5 – 3.0. */
  pressure: number;
  hour: Hour;
  /** Root-zone moisture per row, 0 – 1 (ideal band 0.50 – 0.72). */
  moisture: [number, number, number];
  /** Seconds the system has been held in balance (3 s wins). */
  hold: number;
  won: boolean;
}

/**
 * Rıza runs a *test irrigation* (1.8 bar, morning) while the lines go in, so
 * the student can see rows 1–2 recover while the sloped row 3 stays dry.
 * Once the nozzle is fitted, the regulator drops back to his old habits
 * (OLD_HABITS) and tuning them is step 5.
 */
export const INITIAL_FARM: FarmState = {
  valveOpen: false,
  sediment: 1,
  pipes: [false, false, false],
  pcNozzle: false,
  pressure: 1.8,
  hour: 'morning',
  moisture: [0.22, 0.22, 0.22],
  hold: 0,
  won: false,
};

/** Rıza's old settings — what the student has to correct in step 5. */
export const OLD_HABITS = { pressure: 0.8, hour: 'noon' as Hour };

export const PRESSURE_MIN = 0.5;
export const PRESSURE_MAX = 3.0;
export const PRESSURE_OK: readonly [number, number] = [1.6, 2.1];
export const MOISTURE_OK: readonly [number, number] = [0.5, 0.72];
export const HOLD_SECONDS = 3;

/** Evaporation loss shown to the student per watering hour. */
export const HOUR_INFO: Record<Hour, { label: string; loss: number; factor: number; note: string }> = {
  noon: { label: '☀️ 13:00', loss: 38, factor: 0.62, note: 'Öğle güneşinde suyun %38’i buharlaşır.' },
  morning: { label: '🌅 06:00', loss: 4, factor: 1, note: 'Sabah serinliğinde kayıp yalnızca %4.' },
  night: { label: '🌙 02:00', loss: 7, factor: 0.95, note: 'Gece serin ama nem köklerde mantar yapabilir.' },
};

export const flowing = (s: FarmState) => s.valveOpen && s.sediment <= 0.05;

/** Pressure that actually reaches each row's drippers. */
export function rowPressure(s: FarmState, row: number): number {
  if (row === 1) return s.pressure * 0.96; // friction on the middle run
  if (row === 2) return s.pressure * (s.pcNozzle ? 0.98 : 0.52); // uphill + far
  return s.pressure;
}

/** Christiansen uniformity: 1 = every row gets the same water. */
export function uniformity(m: readonly number[]): number {
  const avg = (m[0] + m[1] + m[2]) / 3;
  if (avg <= 0.05) return 0.2;
  const dev = Math.abs(m[0] - avg) + Math.abs(m[1] - avg) + Math.abs(m[2] - avg);
  return Math.min(1, Math.max(0, 1 - dev / (3 * avg)));
}

export const moistureOk = (v: number) => v >= MOISTURE_OK[0] && v <= MOISTURE_OK[1];
export const pressureOk = (p: number) => p >= PRESSURE_OK[0] && p <= PRESSURE_OK[1];

export function balanced(s: FarmState): boolean {
  return (
    flowing(s) &&
    s.pipes.every(Boolean) &&
    s.pcNozzle &&
    pressureOk(s.pressure) &&
    s.hour === 'morning' &&
    uniformity(s.moisture) >= 0.85 &&
    s.moisture.every(moistureOk)
  );
}

const moveTowards = (v: number, target: number, step: number) =>
  Math.abs(target - v) <= step ? target : v + Math.sign(target - v) * step;

/** Advances the model by dt seconds. Pure — returns a new state. */
export function stepFarm(s: FarmState, dt: number): FarmState {
  const isFlowing = flowing(s);
  const factor = HOUR_INFO[s.hour].factor;
  const moisture = s.moisture.map((m, r) => {
    if (s.pipes[r] && isFlowing) {
      const target = Math.min(0.95, Math.max(0.2, 0.6 * (rowPressure(s, r) / 1.8) * factor));
      return moveTowards(m, target, dt * 0.35);
    }
    return moveTowards(m, 0.22, dt * 0.2);
  }) as FarmState['moisture'];

  const next = { ...s, moisture };
  if (s.won) return next;
  if (balanced(next)) {
    const hold = s.hold + dt;
    return { ...next, hold, won: hold >= HOLD_SECONDS };
  }
  return { ...next, hold: Math.max(0, s.hold - dt * 2) };
}

/** 1 valve · 2 filter · 3 pipes · 4 nozzle · 5 balance · 6 done (Unity's quest steps). */
export function currentStep(s: FarmState): number {
  if (s.won) return 6;
  if (!s.valveOpen) return 1;
  if (s.sediment > 0.05) return 2;
  if (!s.pipes.every(Boolean)) return 3;
  if (!s.pcNozzle) return 4;
  return 5;
}

export const STEP_TITLES = ['Ana vana', 'Kum filtresi', 'Damla boruları', 'Altın PC nozul', 'Hidrolik denge'] as const;
