// Builds release/ai-ml-quick-path-source-<date>.zip and release/ai-ml-quick-path-dist-<date>.zip (requires the `zip` command).
import { execSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const date = new Date().toISOString().slice(0, 10);
execSync('node scripts/build.mjs', { cwd: ROOT, stdio: 'inherit' });
mkdirSync(`${ROOT}/release`, { recursive: true });
for (const f of [`ai-ml-quick-path-source-${date}.zip`, `ai-ml-quick-path-dist-${date}.zip`]) rmSync(`${ROOT}/release/${f}`, { force: true });
execSync(`zip -qr release/ai-ml-quick-path-source-${date}.zip . -x "dist/*" "release/*" "node_modules/*" "*/__pycache__/*" "*.npz" "qa/bad.json"`, { cwd: ROOT });
execSync(`cd dist && zip -qr ../release/ai-ml-quick-path-dist-${date}.zip .`, { cwd: ROOT, shell: '/bin/sh' });
console.log(`Created release/ai-ml-quick-path-source-${date}.zip and release/ai-ml-quick-path-dist-${date}.zip`);
