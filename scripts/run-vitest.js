import { execSync } from 'child_process';
import fs from 'node:fs';

try {
  const output = execSync('npx vitest run', { encoding: 'utf8' });
  fs.writeFileSync('vitest_out.txt', 'VITEST SUCCESS:\n' + output, 'utf8');
} catch (e) {
  fs.writeFileSync('vitest_out.txt', 'VITEST ERROR:\n' + (e.stdout || '') + '\n' + (e.stderr || ''), 'utf8');
}
