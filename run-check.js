const { execSync } = require('node:child_process');
const fs = require('node:fs');

/**
 * Executes a shell command and saves the output (or error output) to a file.
 * @param {string} command - The shell command to execute.
 * @param {string} outputFile - The path to the output file.
 */
function runCommandAndSave(command, outputFile) {
  try {
    console.log(`Running: ${command}...`);
    const output = execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    fs.writeFileSync(outputFile, output);
  } catch (error) {
    // Robustly handle error objects from execSync
    const stdout = (error && typeof error === 'object' && 'stdout' in error) ? error.stdout : '';
    const stderr = (error && typeof error === 'object' && 'stderr' in error) ? error.stderr : '';
    fs.writeFileSync(outputFile, (stdout || '') + '\n' + (stderr || ''));
  }
}

const tasks = [
  { command: 'npx tsc --noEmit', output: 'tsc-results.txt' },
  { command: 'npx eslint .', output: 'eslint-results.txt' },
  { command: 'npx vitest run', output: 'vitest-results.txt' }
];

tasks.forEach(task => runCommandAndSave(task.command, task.output));

console.log('Done checking.');

