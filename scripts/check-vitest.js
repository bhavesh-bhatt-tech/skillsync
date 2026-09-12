import { spawnSync } from 'child_process';
import fs from 'node:fs';

const res = spawnSync('npx', ['vitest', 'run'], {
  encoding: 'utf8',
  shell: true,
});

fs.writeFileSync('vitest_status.txt', (res.stdout || '') + '\n' + (res.stderr || ''), 'utf8');
console.log('Exit code:', res.status);
