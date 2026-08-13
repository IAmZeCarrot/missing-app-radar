import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const targets = [
  ['src', '.js'],
  ['scripts', '.mjs'],
];

for (const [directory, extension] of targets) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && path.extname(entry.name) === extension)
    .map((entry) => path.join(directory, entry.name))
    .sort();

  for (const file of files) {
    const result = spawnSync(process.execPath, ['--check', file], {
      stdio: 'inherit',
    });
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
}
