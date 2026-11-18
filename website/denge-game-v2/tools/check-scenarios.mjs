/**
 * Scenario consistency gate:
 *
 *   npm run check:scenarios
 *
 * Bundles src/Game/scenario/check.ts with rolldown (same approach as
 * gen-manifest.mjs) and fails the build when any sentence in the text bank
 * contradicts the town model or the model breaks an invariant.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const rolldown = join(root, 'node_modules', '.bin', 'rolldown');
const bundle = join(root, 'node_modules', '.cache', 'check-scenarios-entry.mjs');

mkdirSync(dirname(bundle), { recursive: true });
execFileSync(
  rolldown,
  ['--input', 'src/Game/scenario/check.ts', '--file', bundle, '--format', 'esm'],
  { cwd: root, stdio: ['ignore', 'ignore', 'inherit'] },
);

const { runChecks } = await import(`${pathToFileURL(bundle).href}?t=${Date.now()}`);
const started = Date.now();
const report = runChecks();
const ms = Date.now() - started;

console.log(
  `senaryo denetimi: ${report.variants} varyant × 32 plan, ${report.renders} cümle, ` +
    `rezerv değişimi ${report.deltaRange[0]}…+${report.deltaRange[1]} puan (${ms} ms)`,
);
if (report.errors.length) {
  console.error(`\n✗ ${report.errors.length} tutarsızlık:`);
  for (const e of report.errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('✓ bütün cümleler modelle tutarlı');
