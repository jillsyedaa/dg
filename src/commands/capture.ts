import * as p from '@clack/prompts';
import { join } from 'path';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import {
  readConfig,
  addCast,
  getAllCasts,
  updateCast
} from '../lib/config.js';
import {
  checkTermSVGAvailability,
  recordInteractiveDemo
} from '../lib/termsvg.js';
import { detectInteractiveElements } from '../lib/interactive-detection.js';
import { generateSVG } from '../lib/svg-generation.js';
import { initLogger, dgLogger as logger } from '../lib/logger.js';
import type { CastConfig } from '../types.js';
import { spawn } from 'child_process';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export async function captureCommand(options: {
  overwrite?: boolean;
  verbose?: boolean;
  dev?: boolean;
} = {}): Promise<void> {
  // Initialize logger with options
  initLogger({
    verbose: options.verbose,
    dev: options.dev
  });

  logger.debug('Starting capture command', { options });

  // console.clear();
  p.note('🎬 Record a new CLI demo', '🎬');

  // Check if DG is initialized
  const config = readConfig();
  if (!config) {
    logger.error('No config found');
    p.cancel('No config found. Run `dg init` first.');
    return;
  }

  const termsvgCheck = await checkTermSVGAvailability();

  if (!termsvgCheck.available) {
    logger.error('termsvg not available', { version: termsvgCheck.version });
    p.cancel('termsvgCheck is required for recording. Install it first');
    return;
  }

  logger.debug('termsvg check passed', { version: termsvgCheck.version });

  // Only ask for title
  const title = await p.text({
    message: 'Enter demo title:',
    placeholder: 'e.g. Show Help, Init Project, etc.',
    validate: (value) => {
      if (!value || value.trim().length === 0) {
        return 'Title is required';
      }
    }
  });

  if (p.isCancel(title)) {
    logger.debug('User cancelled recording');
    p.cancel('Recording cancelled.');
    process.exit(0);
  }

  // Generate cast name
  const castName = slugify(title as string);
  const castPath = join(config.outputDir, 'casts', `${castName}.cast`);

  logger.debug('Cast configuration', {
    name: castName,
    path: castPath
  });

  // Check for file conflicts
  const fileExists = existsSync(castPath);
  const shouldOverwrite = options.overwrite || fileExists;
  
  if (shouldOverwrite && fileExists) {
    logger.debug('Found existing cast file, will overwrite', { path: castPath });
  }

  // Show recording instructions and start
  p.note(
    `Title: ${title}\n\n• Run any commands you want to demonstrate\n• Commands are executed in your current shell\n• Press Ctrl+D when you're finished`,
    '▶️ Recording started - run your commands now'
  );
  
  let lastCommand: string | undefined;
  const recordSuccess = await recordInteractiveDemo(castPath, {
    overwrite: shouldOverwrite,
    onCommand: (cmd) => {
      lastCommand = cmd;
    }
  });

  if (!recordSuccess) {
    logger.error('Recording failed');
    p.cancel('Recording failed. Check that termsvg is working properly.');
    return;
  }

  // Quietly check for interactive elements
  const hasInteractive = await detectInteractiveElements(castPath);
  logger.debug('Interactive elements check', { hasInteractive, path: castPath });
  
  // Create or update cast configuration
  const cast: CastConfig = {
    name: castName,
    title: title as string,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    interactive: hasInteractive,
    validation: hasInteractive 
      ? { mode: 'manual-only' }
      : { mode: 'auto' },
    command: hasInteractive ? undefined : lastCommand
  };
  
  try {
    if (shouldOverwrite) {
      updateCast(cast);
    } else {
      addCast(cast);
    }
    logger.debug('Cast configuration saved', { cast });
  } catch (error) {
    logger.error('Failed to save cast configuration', { 
      error: (error as Error).message,
      stack: (error as Error).stack,
      cast 
    });
    p.cancel('Failed to save cast configuration: ' + (error as Error).message);
    return;
  }

  // Generate assets and save markdown
  try {
    // Generate SVGs for both themes
    const svgOptions = {
      width: 120,
      height: 30,
      minify: true
    };

    const lightResult = await generateSVG(castPath, 'light', svgOptions);
    const darkResult = await generateSVG(castPath, 'dark', svgOptions);
    
    if (lightResult.warning || darkResult.warning) {
      logger.warn('SVG generation warning', { 
        light: lightResult.warning,
        dark: darkResult.warning 
      });
    }

    // Generate simple documentation snippet with both themes
    const documentation = `## ${cast.title}

<!--Remove one image if your site handles dark-mode automatically-->
![${cast.title} - light](/.dg/svg/${castName}-light.svg#gh-light-mode-only)
![${cast.title} - dark](/.dg/svg/${castName}-dark.svg#gh-dark-mode-only)

<!-- Self-testing badge (remove if not using CI yet) -->
![Demo status](https://github.com/OWNER/REPO/actions/workflows/validate-dg.yml/badge.svg)
`;
    
    // Save snippet to file and copy to clipboard
    const snippetsDir = join(config.outputDir, 'snippets');
    if (!existsSync(snippetsDir)) {
      mkdirSync(snippetsDir, { recursive: true });
    }
    const snippetPath = join(snippetsDir, `${castName}.md`);
    writeFileSync(snippetPath, documentation, 'utf8');
    
    // Copy to clipboard
    const clipboardCmd = process.platform === 'darwin' 
      ? 'pbcopy' 
      : process.platform === 'win32'
        ? 'clip.exe'
        : 'xclip -selection clipboard';
    
    const copyProcess = spawn(clipboardCmd, [], { shell: true });
    copyProcess.stdin.write(documentation);
    copyProcess.stdin.end();
    
    p.outro(`🎉 Markdown snippet saved to .dg/snippets/${castName}.md and copied to clipboard 📋`);
    
  } catch (error) {
    logger.error(error as Error);
    p.cancel('Failed to generate assets. Check the logs for details.');
    process.exit(1);
  }
}
