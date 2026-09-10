import {
  IsISO8601,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export const eventTypes = [
  'session_started',
  'location_opened',
  'source_opened',
  'intervention_viewed',
  'intervention_selected',
  'intervention_removed',
  'reason_selected',
  'confidence_submitted',
  'plan_submitted',
  'outcome_viewed',
  'new_evidence_viewed',
  'hint_requested',
  'reflection_answered',
  'strategy_changed',
  'plan_revised',
  'session_completed',
] as const;

export const screens = [
  'intro',
  'town-map',
  'research',
  'planning',
  'decision',
  'outcome',
  'reflection',
  'session-summary',
] as const;

export type EventType = (typeof eventTypes)[number];
export type ScreenName = (typeof screens)[number];

export class CreateEventDto {
  @IsIn(eventTypes)
  eventType!: EventType;

  @IsIn(screens)
  screen!: ScreenName;

  @IsISO8601({ strict: true })
  timestamp!: string;

  @IsOptional()
  @IsString()
  target?: string;

  @IsOptional()
  value?: unknown;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
