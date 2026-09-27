import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();

const copies = [
  ["denge-kasabasi-game", "oyna", "Demo oyunu"],
  ["denge-game-v2", "ongosteri", "Ön gösterim oyunu"],
];

for (const [gameDir, slug, label] of copies) {
  const gameRoot = resolve(root, gameDir);
  const targetRoot = resolve(root, "dist", "denge-kasabasi", slug);
  await mkdir(targetRoot, { recursive: true });
  await rm(targetRoot, { recursive: true, force: true });
  await mkdir(targetRoot, { recursive: true });
  await cp(resolve(gameRoot, "dist"), targetRoot, {
    recursive: true,
    filter: (src) => !src.endsWith(".DS_Store"),
  });
  console.log(`${label} dist/denge-kasabasi/${slug} altında hazır.`);
}
