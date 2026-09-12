import { execSync } from 'child_process';
import fs from 'node:fs';

try {
  const output = execSync('npx tsc -b', { encoding: 'utf8' });
  fs.writeFileSync('tsc_out.txt', 'TSC -B SUCCESS:\n' + output, 'utf8');
} catch (e) {
  fs.writeFileSync('tsc_out.txt', 'TSC -B ERROR:\n' + (e.stdout || '') + '\n' + (e.stderr || ''), 'utf8');
}

