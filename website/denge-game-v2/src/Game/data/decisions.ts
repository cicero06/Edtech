/**
 * Decision trace — the raw material for analysing *how* a student decides,
 * not only what they finally picked (yol haritası §6, "karar izi").
 *
 * Every context (a puzzle, a workshop, the plan meeting…) declares the steps
 * it may report. The manifest hands this map to the backend, which rejects
 * any other context/step for activities created with it; older activities
 * accept steps unenforced, so adding a context never breaks a running class.
 *
 * Steps are behavioural traces for the teacher, never a competence or
 * personality score. Recording happens through `recordDecision` in
 * session.ts — this module stays pure data so the manifest build can load it.
 */

export const DECISION_STEPS = {
  /** Kadim Uyum Haritası — the four-district system puzzle before the plan meeting. */
  kadim: [
    'piece_placed',
    'piece_rotated',
    'hint_used',
    'prediction_made',
    'confidence_given',
    'phase_done',
    'completed',
  ],
} as const satisfies Record<string, readonly string[]>;

export type DecisionContext = keyof typeof DECISION_STEPS;
export type DecisionStep<C extends DecisionContext> = (typeof DECISION_STEPS)[C][number];
