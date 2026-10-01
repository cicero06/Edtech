import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';

const DEV_USER = { 'x-atlas-user': 'e2e-teacher' };
const STRANGER = { 'x-atlas-user': 'e2e-stranger' };

function envelope(overrides: Record<string, unknown> = {}) {
  return {
    clientEventId: crypto.randomUUID(),
    sequence: 0,
    type: 'attempt_started',
    payloadSchemaVersion: 1,
    occurredAt: '2026-10-01T09:00:00.000Z',
    payload: {},
    ...overrides,
  };
}

describe('Atlas v2 API (e2e)', () => {
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

  afterEach(async () => {
    await app.close();
  });

  async function provisionActivity() {
    const server = app.getHttpServer();
    const ws = await request(server)
      .post('/v2/workspaces')
      .set(DEV_USER)
      .send({ kind: 'PILOT', name: `Deneme ${crypto.randomUUID()}` })
      .expect(201);
    const group = await request(server)
      .post(`/v2/workspaces/${ws.body.id}/groups`)
      .set(DEV_USER)
      .send({ name: 'Grup A' })
      .expect(201);
    await request(server)
      .post(`/v2/groups/${group.body.id}/participants`)
      .set(DEV_USER)
      .send({ displayName: 'P-07' })
      .expect(201);
    const activity = await request(server)
      .post(`/v2/groups/${group.body.id}/activities`)
      .set(DEV_USER)
      .send({
        title: 'Sabah oturumu',
        scenario: 'denge-kasabasi',
        version: '0.1.0',
        manifest: {
          solutions: { repair: 20, well: 15 },
          maxCost: 50,
          cards: ['c-pipes'],
          evidenceIds: ['e-rain'],
        },
      })
      .expect(201);
    await request(server)
      .post(`/v2/activities/${activity.body.id}/open`)
      .set(DEV_USER)
      .expect(201);
    return { group, activity };
  }

  it('runs the full roster → join → sync → complete flow', async () => {
    const server = app.getHttpServer();
    const { group, activity } = await provisionActivity();

    // Roster gate: a name that was never added cannot join.
    await request(server)
      .post('/v2/join')
      .send({ joinCode: group.body.joinCode, displayName: 'stranger' })
      .expect(403);
    // Closed/forbidden ordering: no open activity → reject.
    // (activity is OPEN here, so the join below must succeed.)

    const join = await request(server)
      .post('/v2/join')
      .send({
        joinCode: group.body.joinCode,
        displayName: 'p-07',
        clientAttemptId: 'e2e-attempt-1',
      })
      .expect(201);
    const token = join.body.token as string;
    const attemptId = join.body.attempt.id as string;
    const bearer = { Authorization: `Bearer ${token}` };

    // Re-joining without restart resumes the same attempt.
    const rejoin = await request(server)
      .post('/v2/join')
      .send({ joinCode: group.body.joinCode, displayName: 'P-07' })
      .expect(201);
    expect(rejoin.body.attempt.id).toBe(attemptId);

    const started = envelope({ sequence: 0 });
    const choice = envelope({
      sequence: 1,
      type: 'choice_made',
      occurredAt: '2026-10-01T09:01:00.000Z',
      payload: { choiceId: 'c-ask-engineer', dialogueId: 'd-1' },
    });
    const sync = await request(server)
      .post(`/v2/attempts/${attemptId}/sync`)
      .set(bearer)
      .send({
        events: [started, choice],
        baseRevision: 0,
        state: { stage: 'investigation' },
      })
      .expect(201);
    expect(sync.body).toEqual({ accepted: 2, skipped: 0, revision: 1 });

    // Retry of the same batch: deduplicated, not duplicated.
    const retry = await request(server)
      .post(`/v2/attempts/${attemptId}/sync`)
      .set(bearer)
      .send({ events: [started, choice] })
      .expect(201);
    expect(retry.body).toMatchObject({ accepted: 0, skipped: 2 });

    // Same clientEventId with a different payload → conflict.
    await request(server)
      .post(`/v2/attempts/${attemptId}/sync`)
      .set(bearer)
      .send({
        events: [
          envelope({
            clientEventId: choice.clientEventId,
            sequence: 1,
            type: 'choice_made',
            payload: { choiceId: 'c-different' },
          }),
        ],
      })
      .expect(409);

    // Manifest validation: plan cost must match the scenario manifest.
    await request(server)
      .post(`/v2/attempts/${attemptId}/sync`)
      .set(bearer)
      .send({
        events: [
          envelope({
            sequence: 2,
            type: 'plan_submitted',
            payload: { solutionIds: ['repair'], totalCost: 99 },
          }),
        ],
      })
      .expect(400);
    await request(server)
      .post(`/v2/attempts/${attemptId}/sync`)
      .set(bearer)
      .send({
        events: [
          envelope({
            sequence: 2,
            type: 'plan_submitted',
            payload: { solutionIds: ['repair'], totalCost: 20 },
          }),
        ],
      })
      .expect(201);

    // Stale state revision → conflict.
    await request(server)
      .post(`/v2/attempts/${attemptId}/sync`)
      .set(bearer)
      .send({ baseRevision: 0, state: { stage: 'finale' } })
      .expect(409);

    // Completing the attempt locks it against further syncs.
    await request(server)
      .post(`/v2/attempts/${attemptId}/sync`)
      .set(bearer)
      .send({
        events: [envelope({ sequence: 3, type: 'attempt_completed' })],
      })
      .expect(201);
    await request(server)
      .post(`/v2/attempts/${attemptId}/sync`)
      .set(bearer)
      .send({ events: [envelope({ sequence: 4 })] })
      .expect(409);

    // Staff read views; participant cannot read raw events, strangers nothing.
    const view = await request(server)
      .get(`/v2/activities/${activity.body.id}`)
      .set(DEV_USER)
      .expect(200);
    expect(view.body.attempts).toHaveLength(1);
    expect(view.body.attempts[0]._count.events).toBe(4);
    await request(server)
      .get(`/v2/attempts/${attemptId}/events`)
      .set(bearer)
      .expect(403);
    const events = await request(server)
      .get(`/v2/attempts/${attemptId}/events`)
      .set(DEV_USER)
      .expect(200);
    expect(events.body).toHaveLength(4);
    await request(server)
      .get(`/v2/attempts/${attemptId}`)
      .set(STRANGER)
      .expect(403);
  });

  it('rejects unauthenticated management calls and cross-participant access', async () => {
    const server = app.getHttpServer();
    const { group } = await provisionActivity();
    await request(server).post('/v2/workspaces').send({ kind: 'PILOT', name: 'x' }).expect(401);

    const join = await request(server)
      .post('/v2/join')
      .send({ joinCode: group.body.joinCode, displayName: 'P-07' })
      .expect(201);
    // A participant token cannot call staff endpoints.
    await request(server)
      .get(`/v2/groups/${group.body.id}`)
      .set({ Authorization: `Bearer ${join.body.token}` })
      .expect(403);

    // A second participant's token cannot read the first one's attempt.
    await request(server)
      .post(`/v2/groups/${group.body.id}/participants`)
      .set(DEV_USER)
      .send({ displayName: 'P-08' })
      .expect(201);
    const other = await request(server)
      .post('/v2/join')
      .send({ joinCode: group.body.joinCode, displayName: 'P-08' })
      .expect(201);
    await request(server)
      .get(`/v2/attempts/${join.body.attempt.id}`)
      .set({ Authorization: `Bearer ${other.body.token}` })
      .expect(403);
    await request(server)
      .post(`/v2/attempts/${join.body.attempt.id}/sync`)
      .set({ Authorization: `Bearer ${other.body.token}` })
      .send({ events: [envelope({ sequence: 0 })] })
      .expect(403);
  });
});
