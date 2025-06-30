import * as p from '@clack/prompts';
import { readConfig } from '../lib/config.js';
import { rm } from 'fs/promises';

export async function cleanCommand(): Promise<void> {
  console.clear();
  p.intro('🧹 Clean DeepGuide');

  const config = readConfig();
  if (!config) {
    p.cancel('No DeepGuide setup found.');
    return;
  }

  const confirm = await p.confirm({
    message: 'This will remove ALL DeepGuide data (config, demos, assets). Continue?',
    initialValue: false
  });

  if (!confirm || p.isCancel(confirm)) {
    p.cancel('Operation cancelled.');
    return;
  }

  const spinner = p.spinner();
  spinner.start('Removing DeepGuide data...');

  try {
    // Remove entire .dg directory
    await rm(config.outputDir, { recursive: true, force: true });
    spinner.stop('✅ All DeepGuide data removed');
    p.outro('DeepGuide cleaned successfully! Run `dg init` to start fresh. 🧹');
  } catch (error) {
    spinner.stop('❌ Failed to remove data');
    p.cancel(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
} 