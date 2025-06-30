#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { captureCommand } from './commands/capture.js';
import { validateCommand } from './commands/validate.js';
import { listCommand } from './commands/list.js';
import { cleanCommand } from './commands/clean.js';
import { doctorCommand } from './commands/doctor.js';
import { ensurePTYAvailable } from './lib/pty-init.js';
import { dgLogger as logger } from './lib/logger.js';

const program = new Command();

// Version is injected at build time
const version = process.env.DG_VERSION || '0.0.0';

program
  .name('dg')
  .description('DeepGuide CLI - Record and validate CLI demos')
  .version(version);

program
  .command('init')
  .description('Initialize DeepGuide in current directory')
  .action(initCommand);

program
  .command('capture')
  .description('Record a new CLI demo')
  .option('-o, --overwrite', 'Overwrite existing recording')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('--dev', 'Enable development mode')
  .action(async (options) => {
    // Ensure PTY is available before running capture
    if (await ensurePTYAvailable()) {
      await captureCommand(options);
    } else {
      logger.error('PTY library not available. Run `dg init` first.');
      process.exit(1);
    }
  });

program
  .command('validate [name]')
  .description('Validate recorded demos')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('--dev', 'Enable development mode')
  .option('--non-interactive', 'Run in non-interactive mode (for CI environments)')
  .action(async (name, options) => {
    // Ensure PTY is available before running validate
    if (await ensurePTYAvailable()) {
      await validateCommand(name, options);
    } else {
      logger.error('PTY library not available. Run `dg init` first.');
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all recorded demos')
  .action(listCommand);

program
  .command('clean')
  .description('Clean up generated files')
  .action(cleanCommand);

program
  .command('doctor')
  .description('Check system for potential problems')
  .action(doctorCommand);

program.parse(); 