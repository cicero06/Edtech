import { describe, expect, it } from 'vitest';
import {
  validateEventPayload,
  type ScenarioManifest,
} from './event-catalog.js';

const manifest: ScenarioManifest = {
  solutions: { repair: 20, well: 15, harvest: 25 },
  maxCost: 50,
  cards: ['c-pipes', 'c-fountain'],
  evidenceIds: ['e-rain', 'e-bill'],
  icons: ['star', 'leaf'],
  reportItemIds: ['r1', 'r2', 'r3'],
  minigames: { aylin: ['patch', 'replace'], kemal: [] },
};

describe('validateEventPayload', () => {
  it('accepts a conforming plan and verifies recomputed cost', () => {
    expect(
      validateEventPayload(
        'plan_submitted',
        { solutionIds: ['repair', 'harvest'], totalCost: 45 },
        manifest,
      ),
    ).toBeNull();
  });

  it('rejects a plan whose totalCost lies about the manifest', () => {
    expect(
      validateEventPayload(
        'plan_submitted',
        { solutionIds: ['repair'], totalCost: 5 },
        manifest,
      ),
    ).toMatch(/totalCost/);
  });

  it('rejects a plan exceeding the scenario budget', () => {
    expect(
      validateEventPayload(
        'plan_submitted',
        { solutionIds: ['repair', 'well', 'harvest'] },
        manifest,
      ),
    ).toMatch(/budget/);
  });

  it('rejects ids outside the manifest and unknown payload keys', () => {
    expect(
      validateEventPayload('evidence_submitted', { confirmedIds: ['nope'] }, manifest),
    ).toMatch(/outside the scenario/);
    expect(
      validateEventPayload('finale_submitted', { statement: 'x', extra: 1 }, manifest),
    ).toMatch(/Unexpected payload keys/);
  });

  it('rejects overlapping report classifications', () => {
    expect(
      validateEventPayload(
        'report_classified',
        { workedIds: ['r1'], problemIds: ['r1'] },
        manifest,
      ),
    ).toMatch(/overlap/);
  });

  it('is permissive where the manifest declares nothing', () => {
    expect(
      validateEventPayload(
        'investigation_completed',
        { cardId: 'any-card' },
        {},
      ),
    ).toBeNull();
  });

  it('validates mini-game results against the manifest', () => {
    const ok = {
      gameId: 'aylin',
      decisionId: 'replace',
      score: 80,
      metrics: { cost: 400000, waterSaved: 20 },
    };
    expect(validateEventPayload('minigame_completed', ok, manifest)).toBeNull();
    expect(
      validateEventPayload('minigame_completed', { ...ok, gameId: 'nope' }, manifest),
    ).toMatch(/gameId/);
    expect(
      validateEventPayload('minigame_completed', { ...ok, decisionId: 'x' }, manifest),
    ).toMatch(/decisionId/);
    expect(
      validateEventPayload('minigame_completed', { ...ok, score: 101 }, manifest),
    ).toMatch(/score/);
    expect(
      validateEventPayload(
        'minigame_completed',
        { ...ok, metrics: { cost: 'a lot' } },
        manifest,
      ),
    ).toMatch(/metrics\.cost/);
    expect(
      validateEventPayload('minigame_completed', { ...ok, extra: 1 }, manifest),
    ).toMatch(/Unexpected/);
    // Older scenario versions have no minigames list: accepted, not enforced.
    expect(validateEventPayload('minigame_completed', ok, {})).toBeNull();
  });
});
