import { ESLint } from 'eslint';

async function run() {
  const eslint = new ESLint();
  const results = await eslint.lintFiles(['src/**/*.ts', 'src/**/*.tsx']);
  const formatter = await eslint.loadFormatter('stylish');
  const resultText = await formatter.format(results);
  console.log(resultText);
  let total = 0;
  results.forEach(r => total += r.messages.length);
  console.log(`\nTotal ESLint/SonarJS issues found: ${total}`);
}

run().catch(console.error);
