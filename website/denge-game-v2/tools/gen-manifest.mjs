/**
 * Generates src/Game/data/scenario-manifest.json from the live story data.
 *
 *   npm run manifest
 *
 * The version tag is content-addressed (`ch1-<hash>`): any change to card
 * ids, solution costs, choices or budgets produces a new ScenarioVersion so
 * historical attempts always resolve against the rules they were played
 * under. Run this after editing story/npc/stat data, commit the JSON, and
 * feed it to the backend (POST /v2/groups/:id/activities or seed script).
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const rolldown = join(root, 'node_modules', '.bin', 'rolldown');
const bundle = join(root, 'node_modules', '.cache', 'manifest-entry.mjs');

mkdirSync(dirname(bundle), { recursive: true });
execFileSync(
  rolldown,
  ['--input', 'src/Game/data/manifest.ts', '--file', bundle, '--format', 'esm'],
  { cwd: root, stdio: 'inherit' },
);

const { SCENARIO_KEY, buildScenarioManifest } = await import(
  pathToFileURL(bundle).href
);

const manifest = buildScenarioManifest();
const hash = createHash('sha256')
  .update(JSON.stringify(manifest))
  .digest('hex')
  .slice(0, 10);

const out = {
  scenario: SCENARIO_KEY,
  version: `ch1-${hash}`,
  manifest,
};

const target = join(root, 'src', 'Game', 'data', 'scenario-manifest.json');
writeFileSync(target, `${JSON.stringify(out, null, 2)}\n`);
console.log(`wrote ${target}`);
console.log(`scenario=${out.scenario} version=${out.version}`);
