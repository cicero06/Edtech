import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({ name: 'Denge Kasabası API', status: 'ok' });
      });
  });

  it('persists an anonymous session and derives its observable summary', async () => {
    const server = app.getHttpServer();
    const created = await request(server)
      .post('/sessions')
      .send({ scenarioId: 'water-crisis' })
      .expect(201);
    const sessionId = created.body.id as string;
    expect(sessionId).toMatch(/^[0-9a-f-]{36}$/i);

    await request(server).get(`/sessions/${sessionId}`).expect(200);

    const events = [
      { eventType: 'session_started', screen: 'intro' },
      { eventType: 'location_opened', screen: 'town-map', target: 'dam' },
      { eventType: 'location_opened', screen: 'town-map', target: 'dam' },
      {
        eventType: 'source_opened',
        screen: 'research',
        target: 'municipality_engineer',
      },
      {
        eventType: 'intervention_viewed',
        screen: 'planning',
        target: 'network-leak-repair',
      },
      { eventType: 'hint_requested', screen: 'research' },
      {
        eventType: 'plan_submitted',
        screen: 'decision',
        value: ['network-leak-repair'],
      },
      {
        eventType: 'new_evidence_viewed',
        screen: 'outcome',
        target: 'rainfall-forecast',
      },
      {
        eventType: 'reflection_answered',
        screen: 'reflection',
        value: { unexpectedResult: true, wantsRevision: false },
      },
      { eventType: 'session_completed', screen: 'session-summary' },
    ];
    for (const [index, event] of events.entries()) {
      await request(server)
        .post(`/sessions/${sessionId}/events`)
        .send({
          ...event,
          timestamp: new Date(
            Date.UTC(2026, 8, 10, 12, 0, index),
          ).toISOString(),
        })
        .expect(201);
    }

    await request(server)
      .post(`/sessions/${sessionId}/events`)
      .send({
        eventType: 'plan_submitted',
        screen: 'decision',
        timestamp: '2026-09-10T13:00:00.000Z',
        value: ['network-leak-repair', 'rainwater-harvesting', 'new-well'],
      })
      .expect(400);
    await request(server)
      .post(`/sessions/${sessionId}/events`)
      .send({
        eventType: 'source_opened',
        screen: 'research',
        timestamp: '2026-09-10T13:01:00.000Z',
        target: 'farmer',
        metadata: { name: 'not accepted' },
      })
      .expect(400);
    await request(server)
      .post(`/sessions/${sessionId}/events`)
      .send({
        eventType: 'session_started',
        screen: 'intro',
        timestamp: '2026-09-10T13:02:00.000Z',
        value: { name: 'not accepted' },
      })
      .expect(400);

    const eventResponse = await request(server)
      .get(`/sessions/${sessionId}/events`)
      .expect(200);
    expect(eventResponse.body).toHaveLength(events.length);

    const summary = await request(server)
      .get(`/sessions/${sessionId}/summary`)
      .expect(200);
    expect(summary.body).toEqual({
      locationsExplored: 1,
      sourcesViewed: 1,
      interventionsReviewed: 1,
      plansCreated: 1,
      hintsRequested: 1,
      newEvidenceViewed: true,
      strategyChanged: false,
      reflectionCompleted: true,
    });

    const completed = await request(server)
      .get(`/sessions/${sessionId}`)
      .expect(200);
    expect(completed.body.completedAt).not.toBeNull();
  });

  afterEach(async () => {
    await app.close();
  });
});
