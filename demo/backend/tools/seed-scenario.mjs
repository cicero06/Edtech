/**
 * Seeds a ScenarioVersion row from a generated manifest JSON.
 *
 *   node tools/seed-scenario.mjs <path-to-scenario-manifest.json>
 *
 * Example:
 *   node tools/seed-scenario.mjs \
 *     ../../website/denge-game-v2/src/Game/data/scenario-manifest.json
 *
 * Scenario versions are immutable: an existing (scenario, version) row is
 * left untouched — if the content changed, generate a new manifest first
 * (its version tag is a content hash, so it lands as a new row).
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import pg from 'pg';

const file = resolve(process.argv[2] ?? '');
if (!process.argv[2]) {
  console.error('usage: node tools/seed-scenario.mjs <manifest.json>');
  process.exit(1);
}

const { scenario, version, manifest } = JSON.parse(readFileSync(file, 'utf8'));
if (!scenario || !version || !manifest) {
  console.error('manifest file must contain { scenario, version, manifest }');
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  const result = await client.query(
    `INSERT INTO "ScenarioVersion" (id, scenario, version, manifest)
     VALUES (gen_random_uuid(), $1, $2, $3::jsonb)
     ON CONFLICT (scenario, version) DO NOTHING
     RETURNING id`,
    [scenario, version, JSON.stringify(manifest)],
  );
  if (result.rowCount === 0) {
    console.log(`already present: ${scenario}@${version}`);
  } else {
    console.log(`seeded ${scenario}@${version} -> ${result.rows[0].id}`);
  }
} finally {
  await client.end();
}
