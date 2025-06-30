import * as p from '@clack/prompts';
import { readConfig, getAllCasts, updateCast } from '../lib/config.js';
import { validateDemo, validateTerminalDimensions } from '../lib/validation.js';
import type { CastConfig, ValidationResult } from '../types.js';

export async function validateCommand(name?: string, options?: any): Promise<void> {
  console.clear();

  p.intro('✅ Validate CLI demos');

  // Check if DG is initialized
  const config = readConfig();
  if (!config) {
    p.cancel('No config found. Run `dg init` first.');
    return;
  }

  const casts = getAllCasts();
  if (casts.length === 0) {
    p.cancel('No demos found. Run `dg capture` to record your first demo.');
    return;
  }

  // Validate terminal dimensions
  const spinner = p.spinner();
  spinner.start('Checking environment...');

  const dimensionsOK = await validateTerminalDimensions();

  if (dimensionsOK) {
    spinner.stop('✅ Terminal dimensions optimal');
  } else {
    spinner.stop('⚠️  Non-standard terminal dimensions detected');
  }

  // Select demos to validate
  let selectedCasts: CastConfig[] = [];

  if (name) {
    // Validate specific demo
    const cast = casts.find(c => c.name === name);
    if (!cast) {
      p.cancel(`Demo '${name}' not found. Available demos: ${casts.map(c => c.name).join(', ')}`);
      return;
    }
    selectedCasts = [cast];
  } else {
    // Validate all or selected demos
    if (casts.length === 1) {
      selectedCasts = casts;
    } else {
      const selection = await p.multiselect({
        message: 'Which demos would you like to validate?',
        options: [
          { value: '*', label: 'All demos' },
          ...casts.map(cast => ({
            value: cast.name,
            label: cast.title || cast.name,
            hint: cast.validation?.mode === 'manual-only' ? '(manual-only)' : undefined
          }))
        ]
      });

      if (p.isCancel(selection)) {
        p.cancel('Operation cancelled.');
        return;
      }

      if (selection.includes('*')) {
        selectedCasts = casts;
      } else {
        selectedCasts = casts.filter(c => selection.includes(c.name));
      }
    }
  }

  if (selectedCasts.length === 0) {
    p.cancel('No demos selected for validation.');
    return;
  }

  // Validate each selected demo
  const results: Array<{ cast: CastConfig; result: ValidationResult }> = [];

  for (const cast of selectedCasts) {
    const valSpinner = p.spinner();
    valSpinner.start(`Validating ${cast.title || cast.name}...`);

    try {
      const result = await validateDemo(cast);

      // Update validation timestamp for passed/skipped demos
      if (result.status === 'passed' || result.status === 'skipped') {
        updateCast({
          ...cast,
          validated: new Date().toISOString()
        });
      }

      results.push({ cast, result });

      const icon = result.status === 'passed' ? '✅' :
        result.status === 'skipped' ? '⏭️' : '❌';
      valSpinner.stop(`${icon} ${cast.title || cast.name} - ${result.status}`);

    } catch (error) {
      console.error('Validation error:', error);
      valSpinner.stop(`❌ ${cast.title || cast.name} - validation error`);
      results.push({
        cast,
        result: {
          status: 'failed',
          reason: (error as Error).message
        }
      });
    }
  }

  // Display detailed results
  const passed = results.filter(r => r.result.status === 'passed');
  const skipped = results.filter(r => r.result.status === 'skipped');
  const failed = results.filter(r => r.result.status === 'failed');

  console.log('\n📊 Validation Results:\n');

  if (passed.length > 0) {
    console.log('✅ Passed:');
    for (const { cast } of passed) {
      console.log(`   • ${cast.title || cast.name}`);
    }
    console.log('');
  }

  if (skipped.length > 0) {
    console.log('⏭️  Skipped:');
    for (const { cast, result } of skipped) {
      console.log(`   • ${cast.title || cast.name}: ${result.reason}`);
    }
    console.log('');
  }

  if (failed.length > 0) {
    console.log('❌ Failed:');
    for (const { cast, result } of failed) {
      console.log(`   • ${cast.title || cast.name}: ${result.reason}`);
    }
    console.log('');
  }

  // Summary
  const total = results.length;
  const summary = `${passed.length} passed, ${skipped.length} skipped, ${failed.length} failed (${total} total)`;

  if (failed.length === 0) {
    p.note(
      `${summary}`,
      '🎉 All validations successful!'
    );
  } else {
    p.note(
      `${summary}`,
      `❌ ${failed.length} validation(s) failed`
    );
  }

  // Exit with error code if validations failed (for CI)
  if (failed.length > 0) {
    process.exit(1);
  }
} 