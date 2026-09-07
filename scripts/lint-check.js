import { ESLint } from 'eslint';
import fs from 'node:fs';

async function run() {
  const eslint = new ESLint();
  const results = await eslint.lintFiles([
    'src/**/*.{ts,tsx}',
    'server/**/*.{ts,tsx}',
    'tests/**/*.{ts,tsx}',
    'prisma/**/*.{ts,tsx}',
  ]);
  const formatter = await eslint.loadFormatter('stylish');
  const resultText = await formatter.format(results);
  fs.writeFileSync('lint-results.txt', resultText, 'utf8');
  console.log('Linting complete, written to lint-results.txt');
}

run().catch(console.error);
