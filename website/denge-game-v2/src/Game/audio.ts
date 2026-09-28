/**
 * React-side sound effects.
 *
 * Phaser owns the world sounds (ambience, footsteps, dialogue murmur) inside
 * GameScene; this module covers the short UI cues that happen in React-land:
 * notebook pages, evidence ticks, completion dings. One shared mute flag -
 * persisted in the mock session and mirrored to Phaser over the EventBus.
 */

import { EventBus } from './events/EventBus';
import { GameEvents } from './events/gameEvents';
import { loadSession, saveSession } from './data/session';
import { SoundKeys } from './data/assets';

export type UiSoundKey =
  | typeof SoundKeys.TICK
  | typeof SoundKeys.COMPLETE
  | typeof SoundKeys.ALERT
  | typeof SoundKeys.PAGE;

let muted = loadSession()?.muted ?? false;

export const isMuted = () => muted;

export function setMuted(value: boolean): void {
  muted = value;
  const session = loadSession();
  if (session) saveSession({ ...session, muted: value });
  EventBus.emit(GameEvents.AUDIO_MUTED, { muted: value });
}

/** Fire-and-forget UI cue; silently skipped while muted or pre-gesture. */
export function playSfx(key: UiSoundKey, volume = 1): void {
  if (muted) return;
  const audio = new Audio(`${import.meta.env.BASE_URL}assets/audio/${key}.mp3`);
  audio.volume = volume;
  void audio.play().catch(() => {
    // Pre-gesture autoplay block - the next click unlocks audio anyway.
  });
}
