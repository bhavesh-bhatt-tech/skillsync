import { ESLint } from 'eslint';
import fs from 'node:fs';

async function main() {
  try {
    const eslint = new ESLint();
    const results = await eslint.lintFiles([
      'src/**/*.ts',
      'src/**/*.tsx',
      'server/**/*.ts',
      'tests/**/*.ts',
      'tests/**/*.tsx',
      'prisma/**/*.ts',
    ]);

    let output = '';
    let totalIssues = 0;
    for (const res of results) {
      if (res.messages.length > 0) {
        output += `\nFILE: ${res.filePath}\n`;
        for (const msg of res.messages) {
          totalIssues++;
          output += `  [${msg.severity === 2 ? 'ERROR' : 'WARN'}] Line ${msg.line}:${msg.column} - ${msg.message} (${msg.ruleId})\n`;
        }
      }
    }

    if (totalIssues === 0) {
      output = 'No ESLint / Sonar issues found!\n';
    } else {
      output += `\nTotal issues: ${totalIssues}\n`;
    }

    fs.writeFileSync('current_eslint_issues.txt', output, 'utf8');
    console.log(`Done. Total issues: ${totalIssues}`);
  } catch (err) {
    fs.writeFileSync('current_eslint_issues.txt', `ERROR: ${err.stack || err}`, 'utf8');
    console.error(err);
  }
}

main();



