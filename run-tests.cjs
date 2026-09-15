const { startVitest } = require('vitest/node');

async function run() {
  const vitest = await startVitest('run', [], {
    reporters: ['verbose', ['json', { outputFile: 'vitest-report.json' }]],
    include: ['tests/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
  });
  process.exit(vitest?.state.getFailedFiles().length ? 1 : 0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
