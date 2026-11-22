// main.ts — hands in The Gilded Vault (repo-v2) for make.fun.
// Node 22 stdlib only. CWD-independent: every path hangs off import.meta.url.
// Copies game/ and screenshots/ from this repository into $MAKEFUN_OUTPUT_DIR
// (default /output) and writes dossier.json with buildDossier from
// ./vendor/makefun-game.ts (the kit's copy, unchanged).
import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });
cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

console.log(`OK: handed in game + screenshots -> ${outDir} (dossier ${dossier.length} bytes)`);
