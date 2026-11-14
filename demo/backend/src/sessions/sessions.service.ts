import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { C } from '../firebase/collections.js';
import {
  decodeJson,
  encodeJson,
  FirebaseService,
  fromDoc,
} from '../firebase/firebase.service.js';
import type {
  CreateEventDto,
  EventType,
  ScreenName,
} from './dto/create-event.dto.js';

const locations = new Set([
  'dam',
  'homes',
  'agriculture',
  'park',
  'municipality',
]);
const sources = new Set([
  'municipality_engineer',
  'farmer',
  'environmental_expert',
  'water_usage',
  'social_media',
  'municipality_budget',
]);
const interventions = new Map([
  ['network-leak-repair', 20],
  ['reduce-agricultural-irrigation', 5],
  ['reduce-park-irrigation', 2],
  ['rainwater-harvesting', 25],
  ['new-well', 15],
]);
const reasons = new Set([
  'water-saving',
  'budget-balance',
  'environment',
  'multiple-problems',
  'other',
]);
const eventScreens: Record<EventType, ScreenName> = {
  session_started: 'intro',
  location_opened: 'town-map',
  source_opened: 'research',
  intervention_viewed: 'planning',
  intervention_selected: 'planning',
  intervention_removed: 'planning',
  reason_selected: 'decision',
  confidence_submitted: 'decision',
  plan_submitted: 'decision',
  outcome_viewed: 'outcome',
  new_evidence_viewed: 'outcome',
  hint_requested: 'research',
  reflection_answered: 'reflection',
  strategy_changed: 'reflection',
  plan_revised: 'decision',
  session_completed: 'session-summary',
};

@Injectable()
export class SessionsService {
  constructor(private readonly firebase: FirebaseService) {}

  private get sessions() {
    return this.firebase.db.collection(C.v1Sessions);
  }

  async create(scenarioId: string) {
    const session = {
      id: randomUUID(),
      scenarioId,
      startedAt: new Date(),
      completedAt: null as Date | null,
    };
    const { id, ...data } = session;
    await this.sessions.doc(id).create(data);
    return session;
  }

  async findOne(id: string) {
    const session = fromDoc<{
      id: string;
      scenarioId: string;
      startedAt: Date;
      completedAt: Date | null;
    }>(await this.sessions.doc(id).get());
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  async addEvent(sessionId: string, dto: CreateEventDto) {
    await this.findOne(sessionId);
    this.validateEvent(dto);
    const event = {
      id: randomUUID(),
      sessionId,
      eventType: dto.eventType,
      screen: dto.screen,
      target: dto.target ?? null,
      value: dto.value === undefined ? null : encodeJson(dto.value),
      metadata: dto.metadata === undefined ? null : encodeJson(dto.metadata),
      occurredAt: new Date(dto.timestamp),
      createdAt: new Date(),
    };
    const { id, ...data } = event;
    const ref = this.sessions.doc(sessionId);
    const batch = this.firebase.db.batch();
    batch.create(ref.collection(C.events).doc(id), data);
    if (dto.eventType === 'session_completed') {
      batch.update(ref, { completedAt: new Date(dto.timestamp) });
    }
    await batch.commit();
    return { ...event, value: dto.value ?? null, metadata: dto.metadata ?? null };
  }

  async findEvents(sessionId: string) {
    await this.findOne(sessionId);
    const snap = await this.sessions
      .doc(sessionId)
      .collection(C.events)
      .orderBy('occurredAt', 'asc')
      .get();
    return snap.docs
      .map((d) => {
        const e = fromDoc<{
          id: string;
          eventType: string;
          target: string | null;
          value: unknown;
          metadata: unknown;
          createdAt: Date;
          occurredAt: Date;
        }>(d)!;
        return { ...e, value: decodeJson(e.value), metadata: decodeJson(e.metadata) };
      })
      .sort(
        (a, b) =>
          a.occurredAt.getTime() - b.occurredAt.getTime() ||
          a.createdAt.getTime() - b.createdAt.getTime(),
      );
  }

  async summary(sessionId: string) {
    const events = await this.findEvents(sessionId);
    const uniqueTargets = (eventType: string) =>
      new Set(
        events
          .filter((event) => event.eventType === eventType && event.target)
          .map((event) => event.target),
      ).size;
    return {
      locationsExplored: uniqueTargets('location_opened'),
      sourcesViewed: uniqueTargets('source_opened'),
      interventionsReviewed: uniqueTargets('intervention_viewed'),
      plansCreated: events.filter(
        (event) => event.eventType === 'plan_submitted',
      ).length,
      hintsRequested: events.filter(
        (event) => event.eventType === 'hint_requested',
      ).length,
      newEvidenceViewed: events.some(
        (event) => event.eventType === 'new_evidence_viewed',
      ),
      strategyChanged: events.some(
        (event) =>
          event.eventType === 'strategy_changed' ||
          event.eventType === 'plan_revised',
      ),
      reflectionCompleted: events.some(
        (event) => event.eventType === 'reflection_answered',
      ),
    };
  }

  private validateEvent(dto: CreateEventDto): void {
    if (eventScreens[dto.eventType] !== dto.screen) {
      throw new BadRequestException('Event is not valid for this screen');
    }
    if (dto.metadata && Object.keys(dto.metadata).length > 0) {
      throw new BadRequestException('Event metadata is not accepted');
    }
    const targetEvents: EventType[] = [
      'location_opened',
      'source_opened',
      'intervention_viewed',
      'intervention_selected',
      'intervention_removed',
      'reason_selected',
      'new_evidence_viewed',
    ];
    const valueEvents: EventType[] = [
      'confidence_submitted',
      'plan_submitted',
      'outcome_viewed',
      'reflection_answered',
      'plan_revised',
    ];
    if (dto.target !== undefined && !targetEvents.includes(dto.eventType)) {
      throw new BadRequestException('Target is not accepted for this event');
    }
    if (dto.value !== undefined && !valueEvents.includes(dto.eventType)) {
      throw new BadRequestException('Value is not accepted for this event');
    }
    if (dto.eventType === 'location_opened')
      this.requireTarget(dto.target, locations);
    if (dto.eventType === 'source_opened')
      this.requireTarget(dto.target, sources);
    if (
      [
        'intervention_viewed',
        'intervention_selected',
        'intervention_removed',
      ].includes(dto.eventType)
    ) {
      this.requireTarget(dto.target, new Set(interventions.keys()));
    }
    if (dto.eventType === 'reason_selected')
      this.requireTarget(dto.target, reasons);
    if (
      dto.eventType === 'new_evidence_viewed' &&
      dto.target !== 'rainfall-forecast'
    ) {
      throw new BadRequestException('Invalid evidence target');
    }
    if (
      dto.eventType === 'confidence_submitted' &&
      !(
        dto.value === 1 ||
        dto.value === 2 ||
        dto.value === 3 ||
        dto.value === 4 ||
        dto.value === 5
      )
    ) {
      throw new BadRequestException('Confidence must be between 1 and 5');
    }
    if (
      dto.eventType === 'outcome_viewed' &&
      dto.value !== 'first' &&
      dto.value !== 'final'
    ) {
      throw new BadRequestException('Invalid outcome mode');
    }
    if (
      dto.eventType === 'plan_submitted' ||
      dto.eventType === 'plan_revised'
    ) {
      this.validatePlan(dto.value);
    }
    if (dto.eventType === 'reflection_answered') {
      const value = dto.value;
      if (
        !value ||
        typeof value !== 'object' ||
        Array.isArray(value) ||
        typeof (value as Record<string, unknown>).unexpectedResult !==
          'boolean' ||
        typeof (value as Record<string, unknown>).wantsRevision !== 'boolean' ||
        Object.keys(value).some(
          (key) => key !== 'unexpectedResult' && key !== 'wantsRevision',
        )
      ) {
        throw new BadRequestException('Invalid reflection answers');
      }
    }
  }

  private requireTarget(
    target: string | undefined,
    allowed: Set<string>,
  ): void {
    if (!target || !allowed.has(target))
      throw new BadRequestException('Invalid event target');
  }

  private validatePlan(value: unknown): void {
    if (
      !Array.isArray(value) ||
      value.some((id) => typeof id !== 'string' || !interventions.has(id)) ||
      new Set(value).size !== value.length ||
      value.length > 3
    ) {
      throw new BadRequestException('Invalid plan');
    }
    const cost = value.reduce<number>(
      (total, id) => total + (interventions.get(id as string) ?? 0),
      0,
    );
    if (cost > 50) throw new BadRequestException('Plan exceeds budget');
  }
}
