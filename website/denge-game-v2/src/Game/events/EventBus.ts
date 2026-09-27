/**
 * Typed wrapper around a single Phaser EventEmitter shared by React and Phaser.
 *
 * Using the wrapper instead of the raw emitter means a typo in an event name, or
 * a mismatched payload, is a compile error rather than a silent no-op - which is
 * exactly how the dialogue system previously ended up half-connected.
 */

import Phaser from 'phaser';
import type { GameEventPayloads } from './gameEvents';

type EventName = keyof GameEventPayloads;

/** `emit` takes no payload argument for events typed as `void`. */
type EmitArgs<K extends EventName> = GameEventPayloads[K] extends void
  ? []
  : [payload: GameEventPayloads[K]];

type Handler<K extends EventName> = (payload: GameEventPayloads[K]) => void;

const emitter = new Phaser.Events.EventEmitter();

export const EventBus = {
  on<K extends EventName>(event: K, handler: Handler<K>, context?: unknown): void {
    emitter.on(event, handler, context);
  },

  once<K extends EventName>(event: K, handler: Handler<K>, context?: unknown): void {
    emitter.once(event, handler, context);
  },

  off<K extends EventName>(event: K, handler: Handler<K>, context?: unknown): void {
    emitter.off(event, handler, context);
  },

  emit<K extends EventName>(event: K, ...args: EmitArgs<K>): void {
    emitter.emit(event, ...args);
  },
};
