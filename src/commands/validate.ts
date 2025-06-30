import * as p from '@clack/prompts';
import { readConfig, getAllCasts, updateCast } from '../lib/config.js';
import { validateDemo, validateTerminalDimensions } from '../lib/validation.js';
import type { CastConfig, ValidationResult } from '../types.js';

export async function validateCommand(name?: string, options: { nonInteractive?: boolean } = {}): Promise<void> {
  if (!options.nonInteractive) {
    console.clear();
    p.intro('✅ Validate CLI demos');
  }

  // Check if DG is initialized
  const config = readConfig();
  if (!config) {
    if (options.nonInteractive) {
      console.error('No config found. Run `dg init` first.');
      process.exit(1);
    }
    p.cancel('No config found. Run `dg init` first.');
    return;
  }

  const casts = getAllCasts();
  if (casts.length === 0) {
    if (options.nonInteractive) {
      console.error('No demos found. Run `dg capture` to record your first demo.');
      process.exit(0);
    }
    p.cancel('No demos found. Run `dg capture` to record your first demo.');
    return;
  }

  // Validate terminal dimensions
  let dimensionsOK = true;
  if (!options.nonInteractive) {
    const spinner = p.spinner();
    spinner.start('Checking environment...');
    dimensionsOK = await validateTerminalDimensions();
    if (dimensionsOK) {
      spinner.stop('✅ Terminal dimensions optimal');
    } else {
      spinner.stop('⚠️  Non-standard terminal dimensions detected');
    }
  }

  // Select demos to validate
  let selectedCasts: CastConfig[] = [];

  if (name) {
    // Validate specific demo
    const cast = casts.find(c => c.name === name);
    if (!cast) {
      const message = `Demo '${name}' not found. Available demos: ${casts.map(c => c.name).join(', ')}`;
      if (options.nonInteractive) {
        console.error(message);
        process.exit(1);
      }
      p.cancel(message);
      return;
    }
    selectedCasts = [cast];
  } else {
    // In non-interactive mode, validate all demos
    if (options.nonInteractive || casts.length === 1) {
      selectedCasts = casts;
    } else {
      // Interactive mode - let user select demos
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
    if (options.nonInteractive) {
      console.error('No demos selected for validation.');
      process.exit(1);
    }
    p.cancel('No demos selected for validation.');
    return;
  }

  // Validate each selected demo
  const results: Array<{ cast: CastConfig; result: ValidationResult }> = [];

  for (const cast of selectedCasts) {
    if (options.nonInteractive) {
      console.log(`Validating ${cast.title || cast.name}...`);
    } else {
      const valSpinner = p.spinner();
      valSpinner.start(`Validating ${cast.title || cast.name}...`);
    }

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
      
      if (options.nonInteractive) {
        console.log(`${icon} ${cast.title || cast.name} - ${result.status}`);
      } else {
        const valSpinner = p.spinner();
        valSpinner.stop(`${icon} ${cast.title || cast.name} - ${result.status}`);
      }

    } catch (error) {
      console.error('Validation error:', error);
      if (options.nonInteractive) {
        console.log(`❌ ${cast.title || cast.name} - validation error`);
      } else {
        const valSpinner = p.spinner();
        valSpinner.stop(`❌ ${cast.title || cast.name} - validation error`);
      }
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
    if (options.nonInteractive) {
      console.log('🎉 All validations successful!');
      console.log(summary);
    } else {
      p.note(summary, '🎉 All validations successful!');
    }
  } else {
    if (options.nonInteractive) {
      console.log(`❌ ${failed.length} validation(s) failed`);
      console.log(summary);
    } else {
      p.note(summary, `❌ ${failed.length} validation(s) failed`);
    }
  }

  // Exit with error code if validations failed (for CI)
  if (failed.length > 0) {
    process.exit(1);
  }
} 