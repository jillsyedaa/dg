#!/usr/bin/env node

import { existsSync } from 'fs';
import { join } from 'path';

async function install() {
  try {
    // Check if dist/index.js exists (built version)
    const distPath = join(process.cwd(), 'dist', 'index.js');
    
    if (!existsSync(distPath)) {
      console.log('⚠️ Built files not found. This is normal during development.');
      console.log('Run `npm run build` to build the project.');
      return;
    }

    console.log('✓ DeepGuide CLI installed successfully!');
    console.log('\nYou can now run:');
    console.log('  dg --help         # Show help');
    console.log('  dg doctor         # Verify installation');
    console.log('  dg init           # Initialize in a project');
    console.log('\nFor global installation:');
    console.log('  npm install -g @deepguide-ai/dg');

  } catch (error) {
    console.error('Installation failed:', error.message);
    process.exit(1);
  }
}

install().catch(console.error); 