import { build } from 'esbuild';

const tools = ['utm-builder', 'cold-email-checker', 'serp-preview', 'headline-analyzer', 'sales-funnel-calculator'];

for (const t of tools) {
  await build({
    entryPoints: [`${t}/src/main.ts`],
    outfile: `${t}/app.js`,
    bundle: true,
    format: 'iife',
    target: 'es2020',
    legalComments: 'inline',
  });
  console.log(`built ${t}/app.js`);
}
