import assert from 'node:assert/strict';
import test from 'node:test';
import { Readable } from 'node:stream';

import { handleAiRequest } from '../../api/ai.js';

function invokeHandler(path, body, method = 'POST') {
  return new Promise((resolve, reject) => {
    const req = Readable.from([JSON.stringify(body)]);
    req.method = method;
    req.url = path;
    req.headers = { 'content-type': 'application/json' };

    let statusCode = 200;
    const chunks = [];
    const res = {
      writeHead(code) {
        statusCode = code;
      },
      end(data) {
        if (data) chunks.push(Buffer.from(data));
        try {
          const text = Buffer.concat(chunks).toString('utf8');
          resolve({ status: statusCode, json: text ? JSON.parse(text) : null });
        } catch (err) {
          reject(err);
        }
      },
    };

    handleAiRequest(req, res, path).catch(reject);
  });
}

test('POST /ai/analyze-rationale classifies systemic thinking and trade-offs without grading', async () => {
  const { status, json } = await invokeHandler('/ai/analyze-rationale', {
    rationale:
      'Parkın fıskiyelerini kapattım ama boru kaçağını tamir ettirdim çünkü mahalledeki insanların içme suyu ve tarlalar daha önemliydi.',
    solutionIds: ['repair-pipes', 'fountains-off', 'drip-irrigation'],
    totalCost: 850000,
    facts: { reservoirPct: 38, outflowL: 180, leakL: 45, leakPct: 25, farmL: 110 },
  });

  assert.equal(status, 200);
  assert.equal(json.systemic_thinking.level, 'GUCLU');
  assert.equal(json.trade_off_awareness.acknowledged, true);
  assert.equal(json.evidence_grounding.level, 'KANITA_DAYALI');
  assert.ok(json.constructive_feedback.length > 10);
});

test('POST /ai/generate-report produces parent and teacher pedagogical summaries', async () => {
  const { status, json } = await invokeHandler('/ai/generate-report', {
    session: {
      notebook: [{ cardId: 'baraj' }, { cardId: 'konut' }, { cardId: 'tarim' }, { cardId: 'park' }],
      kadim: { solved: true, placeTries: 4, hints: 0, prediction: 'konut', confidence: 4 },
      plan: {
        solutionIds: ['repair-pipes', 'drip-irrigation'],
        totalCost: 850000,
        rationale: 'Kaçağı önleyip tarımı kurtarmak istedim.',
      },
      altPlan: {
        solutionIds: ['repair-pipes', 'saving-campaign', 'fountains-off'],
        totalCost: 550000,
        rationale: 'Evleri de desteklemek istedim.',
      },
    },
    facts: { reservoirPct: 38, leakPct: 25, leakL: 45 },
  });

  assert.equal(status, 200);
  assert.ok(json.thinking_style_title);
  assert.ok(json.parent_summary.includes('4 farklı bölgeden'));
  assert.ok(json.dinner_table_question.endsWith('?'));
  assert.ok(json.teacher_summary.length > 20);
  assert.ok(Array.isArray(json.strengths) && json.strengths.length >= 3);
});

test('POST /ai/guide-chat grounds Socratic reply in the student town facts', async () => {
  const { status, json } = await invokeHandler('/ai/guide-chat', {
    question: 'Nuri Amca’nın sokağındaki boru kaçağı ne kadar?',
    facts: { reservoirPct: 36, outflowL: 200, leakL: 52, leakPct: 26, farmL: 115, parkL: 28 },
    quest: 'investigate',
    completedCards: ['baraj', 'konut'],
  });

  assert.equal(status, 200);
  assert.ok(json.reply.includes('52 litre'));
  assert.ok(json.reply.includes('%26'));
  assert.ok(json.socratic_question.endsWith('?'));
  assert.ok(json.suggested_district.includes('Konut'));
});
