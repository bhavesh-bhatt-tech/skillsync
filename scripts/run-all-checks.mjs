import { execSync } from 'node:child_process';
import fs from 'node:fs';

const results = {};

try {
  const tscOut = execSync('node ./node_modules/typescript/bin/tsc -b', { encoding: 'utf8' });
  results.tsc = { status: 'pass', out: tscOut };
} catch (e) {
  results.tsc = { status: 'fail', out: (e.stdout || '') + '\n' + (e.stderr || '') };
}

try {
  const eslintOut = execSync('node ./node_modules/eslint/bin/eslint.js .', { encoding: 'utf8' });
  results.eslint = { status: 'pass', out: eslintOut };
} catch (e) {
  results.eslint = { status: 'fail', out: (e.stdout || '') + '\n' + (e.stderr || '') };
}

fs.writeFileSync('checks-output.json', JSON.stringify(results, null, 2), 'utf8');
console.log('Checks finished!');
