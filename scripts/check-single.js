import { spawnSync } from 'child_process';
import fs from 'node:fs';

const res = spawnSync('npx', ['vitest', 'run', '--no-cache'], {
  encoding: 'utf8',
  shell: true,
});

fs.writeFileSync('all_tests.txt', (res.stdout || '') + '\n' + (res.stderr || ''), 'utf8');
