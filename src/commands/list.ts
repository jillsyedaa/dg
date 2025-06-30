import { join } from 'path';
import { existsSync } from 'fs';
import { readConfig, getAllCasts } from '../lib/config.js';

interface DemoStatus {
  name: string;
  title: string;
  lastRecorded: string;
  hasSVG: boolean;
  interactive: boolean;
  validation: 'auto' | 'manual-only';
}

export async function listCommand(): Promise<void> {

  // Check if DG is initialized
  const config = readConfig();
  if (!config) {
    console.log('❌ No config found. Run `dg init` first.');
    return;
  }

  const casts = getAllCasts();

  if (casts.length === 0) {
    console.log('ℹ️  No demos found yet.');
    console.log('\nNext steps:');
    console.log('  Run \'dg capture\' to record your first demo');
    return;
  }

  // Gather status for each demo
  const demos: DemoStatus[] = [];

  for (const cast of casts) {
    const svgPath = join(config.outputDir, 'svg', `${cast.name}-light.svg`);

    demos.push({
      name: cast.name,
      title: cast.title,
      lastRecorded: new Date(cast.updated).toLocaleDateString(),
      hasSVG: existsSync(svgPath),
      interactive: cast.interactive || false,
      validation: cast.validation?.mode || 'auto'
    });
  }

  const interactive = demos.filter(d => d.interactive).length;

  // Display demos table
  console.log('\n');

  // Calculate column widths
  const nameWidth = Math.max(20, ...demos.map(d => d.name.length + 2));
  const titleWidth = Math.max(24, ...demos.map(d => (d.title?.length || 0) + 2));
  const updatedWidth = 12;

  // Print table header
  console.log(
    `${'No.'.padEnd(4)}${'Name'.padEnd(nameWidth)}${'SVG'.padEnd(8)}${'Validation'.padEnd(12)}${'Title'.padEnd(titleWidth)}${'Updated'.padEnd(updatedWidth)}`
  );
  console.log('-'.repeat(4 + nameWidth + 8 + 12 + titleWidth + updatedWidth));

  // Print each demo row
  demos.forEach((demo, idx) => {
    const svgStatus = demo.hasSVG ? '✅' : '❌';
    const validation = demo.validation === 'auto'
      ? (demo.interactive ? 'Manual' : 'Auto')
      : 'Manual';
    console.log(
      `${String(idx + 1).padEnd(4)}${demo.name.padEnd(nameWidth)}${svgStatus.padEnd(8)}${validation.padEnd(12)}${(demo.title || '').padEnd(titleWidth)}${demo.lastRecorded.padEnd(updatedWidth)}`
    );
  });

  // Show action items if needed
  const needsGeneration = demos.filter(d => !d.hasSVG);
  if (needsGeneration.length > 0) {
    console.log('\nAction needed:');
    console.log(`${needsGeneration.length} demo(s) need SVG generation:`);
    needsGeneration.forEach(d => console.log(`  • ${d.name}`));
    console.log('\nRun \'dg generate\' to create missing assets.');
  }

  if (interactive > 0) {
    console.log('\nNote:');
    console.log(`${interactive} demo(s) contain interactive elements and require manual validation in CI.`);
  }

  console.log();
} 