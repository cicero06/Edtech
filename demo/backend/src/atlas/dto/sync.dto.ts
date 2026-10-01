import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  EVENT_TYPES,
  type LearningEventType,
} from '../events/event-catalog.js';

export class EventEnvelopeDto {
  @IsUUID('4')
  clientEventId!: string;

  @IsInt()
  @Min(0)
  sequence!: number;

  @IsIn(EVENT_TYPES)
  type!: LearningEventType;

  @IsInt()
  @Min(1)
  payloadSchemaVersion!: number;

  @IsISO8601({ strict: true })
  occurredAt!: string;

  @IsObject()
  payload!: Record<string, unknown>;
}

export class SyncAttemptDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => EventEnvelopeDto)
  events?: EventEnvelopeDto[];

  /** Latest client-side attempt snapshot; presence requires baseRevision. */
  @IsOptional()
  state?: unknown;

  /** Revision the client based its state on; required when state is sent. */
  @IsOptional()
  @IsInt()
  @Min(0)
  baseRevision?: number;
}

export class JoinActivityDto {
  @IsString()
  @Length(1, 20)
  joinCode!: string;

  @IsString()
  @Length(1, 60)
  displayName!: string;

  /** Idempotency key for attempt creation; retries reuse the same value. */
  @IsOptional()
  @IsString()
  @Length(1, 80)
  clientAttemptId?: string;

  /** Explicitly start a new attempt; previous ACTIVE ones are abandoned. */
  @IsOptional()
  @IsBoolean()
  restart?: boolean;
}
