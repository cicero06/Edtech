import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const gameRoot = resolve(root, "denge-kasabasi-game");
const targetRoot = resolve(root, "dist", "denge-kasabasi", "oyna");

await mkdir(targetRoot, { recursive: true });
await rm(targetRoot, { recursive: true, force: true });
await mkdir(targetRoot, { recursive: true });
await cp(resolve(gameRoot, "dist"), targetRoot, { recursive: true });

console.log("Demo oyunu dist/denge-kasabasi/oyna altında hazır.");
