import { SOLUTION_CARDS } from './story';

/**
 * Recorded-voice filename mapping for dialogue pages.
 *
 * Every OPEN_DIALOGUE emit pairs its pages with a `voiceFiles` array built
 * here - index i plays `assets/audio/voices/<voiceFiles[i]>`. A `null` slot
 * means that page has no recording (dynamic text we cannot pre-record); the
 * player simply keeps reading. Missing files fail silently by design.
 *
 * Naming: `<npcId>-<beat>-<variant>.mp3`
 *   talk      — the NPC's chapter-1 small talk line
 *   announce  — the resident's reaction to the submitted plan
 *   review    — the resident's day-30 outcome report
 *   react-*   — the mayor's per-measure reaction lines
 *   twist-*   — Lina's mid-month complication per primary measure
 */

/** Variant suffix shared by the announce and review rounds. */
type PlanVariant = 'rain' | 'drip' | 'repair' | 'saving' | 'fountains' | 'default';

/**
 * The variant `npcPlanReaction` selects, mirroring story.ts. Aylin has no
 * repair-specific announce line, so `repair-pipes` falls back to `default`.
 */
function announceVariant(npcId: string, solutionIds: readonly string[]): PlanVariant {
  const picked = new Set(solutionIds);
  switch (npcId) {
    case 'muhendis-aylin':
      return picked.has('rain-harvest') ? 'rain' : 'default';
    case 'ciftci-riza':
      return picked.has('drip-irrigation') ? 'drip' : 'default';
    case 'nuri-amca':
      if (picked.has('repair-pipes')) return 'repair';
      if (picked.has('saving-campaign')) return 'saving';
      return 'default';
    case 'isci-kemal':
      if (picked.has('rain-harvest')) return 'rain';
      if (picked.has('fountains-off')) return 'fountains';
      return 'default';
    default:
      return 'default';
  }
}

/** Legacy review-recording variant (unused since day-30 reviews come from the scenario engine). */
function reviewVariant(npcId: string, solutionIds: readonly string[]): PlanVariant {
  if (npcId === 'muhendis-aylin' && solutionIds.includes('repair-pipes')) return 'repair';
  return announceVariant(npcId, solutionIds);
}

/** `<npcId>-talk.mp3` — the fallback small-talk line from npcs.ts. */
export function smallTalkVoice(npcId: string): (string | null)[] {
  return [`${npcId}-talk.mp3`];
}

/** `<npcId>-announce-<variant>.mp3` — the resident's reaction to the plan. */
export function announceVoice(npcId: string, solutionIds: readonly string[]): (string | null)[] {
  return [`${npcId}-announce-${announceVariant(npcId, solutionIds)}.mp3`];
}

/** `<npcId>-review-<variant>.mp3` — the resident's day-30 outcome. */
export function reviewVoice(npcId: string, solutionIds: readonly string[]): (string | null)[] {
  return [`${npcId}-review-${reviewVariant(npcId, solutionIds)}.mp3`];
}

/**
 * Files for `mayorReactionPages` — one file per picked measure (same push
 * order), one file per gap combination, then the fixed closer. The gap
 * line's text depends on which needs were left unserved, so each of the
 * seven possible combinations gets its own recording.
 */
export function mayorReactionVoiceFiles(solutionIds: readonly string[]): (string | null)[] {
  const picked = new Set(solutionIds);
  const files: (string | null)[] = [];

  for (const id of ['repair-pipes', 'drip-irrigation', 'fountains-off', 'rain-harvest', 'saving-campaign']) {
    if (picked.has(id)) files.push(`mayor-react-${id}.mp3`);
  }

  const gaps: string[] = [];
  if (!picked.has('repair-pipes') && !picked.has('saving-campaign')) gaps.push('ev');
  if (!picked.has('drip-irrigation')) gaps.push('tarim');
  if (!picked.has('rain-harvest') && !picked.has('fountains-off')) gaps.push('park');
  if (gaps.length) files.push(`mayor-react-gap-${gaps.join('-')}.mp3`);

  files.push('mayor-react-close.mp3');
  return files;
}

/**
 * Files for Lina's implementation talks. Phase 0 = mid-month progress +
 * the twist of the most expensive picked measure; phase 1+ = the day-30
 * review-round kickoff.
 */
export function implementVoiceFiles(
  implPhase: number,
  solutionIds: readonly string[],
): (string | null)[] {
  if (implPhase !== 0) {
    return ['lina-implement-end-01.mp3', 'lina-implement-end-02.mp3'];
  }
  // Same rule as story.ts `primaryPickedSolution`: the most expensive pick.
  const primary = SOLUTION_CARDS
    .filter((c) => solutionIds.includes(c.id))
    .sort((a, b) => b.cost - a.cost)[0];
  return ['lina-mid.mp3', primary ? `lina-twist-${primary.id}.mp3` : null];
}

/**
 * Files for `linaComparePages` — the added/dropped sentences embed solution
 * titles and are combinatorial, so they stay silent (null). The same-plan
 * line and the fixed closing page do get recordings.
 */
export function compareVoiceFiles(
  firstIds: readonly string[],
  secondIds: readonly string[],
): (string | null)[] {
  const first = new Set(firstIds);
  const second = new Set(secondIds);
  const changed =
    firstIds.length !== secondIds.length ||
    [...second].some((id) => !first.has(id));

  const files: (string | null)[] = [];
  if (changed) {
    const dropped = firstIds.filter((id) => !second.has(id));
    const added = secondIds.filter((id) => !first.has(id));
    if (dropped.length) files.push(null);
    if (added.length) files.push(null);
  } else {
    files.push('lina-compare-same.mp3');
  }
  files.push('lina-compare-tail.mp3');
  return files;
}

/** Files for `mayorFinalePages` — the middle page only exists after a retry. */
export function finaleVoiceFiles(hasAlt: boolean): (string | null)[] {
  return hasAlt
    ? ['mayor-finale-01.mp3', 'mayor-finale-alt.mp3', 'mayor-finale-02.mp3']
    : ['mayor-finale-01.mp3', 'mayor-finale-02.mp3'];
}
