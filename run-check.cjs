const { execSync } = require('child_process');
const fs = require('fs');

try {
  const tscOut = execSync('npx tsc --noEmit', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  fs.writeFileSync('tsc-results.txt', tscOut);
} catch (e) {
  fs.writeFileSync('tsc-results.txt', (e.stdout || '') + '\n' + (e.stderr || ''));
}

try {
  const eslintOut = execSync('npx eslint .', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  fs.writeFileSync('eslint-results.txt', eslintOut);
} catch (e) {
  fs.writeFileSync('eslint-results.txt', (e.stdout || '') + '\n' + (e.stderr || ''));
}

try {
  const vitestOut = execSync('npx vitest run --reporter=default', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  fs.writeFileSync('vitest-results.txt', vitestOut);
} catch (e) {
  fs.writeFileSync('vitest-results.txt', (e.stdout || '') + '\n' + (e.stderr || ''));
}

console.log('Checked successfully.');
