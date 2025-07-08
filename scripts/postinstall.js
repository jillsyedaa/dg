#!/usr/bin/env node

import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { createRequire } from 'module';
import { execSync } from 'child_process';

const requireCJS = createRequire(import.meta.url);
function tryLoadNodePty() {
  try {
    // try to load node-pty
    requireCJS('node-pty');
    console.log('✅ node-pty loaded successfully');
    return true;
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      console.warn('❌ node-pty module not found.');
    } else {
      console.warn('⚠️ node-pty load failed:', err.message);
    }
    return false;
  }
}

function tryRebuildNodePtyManually() {
  try {
    // locate node-pty directory
    const resolvedPath = requireCJS.resolve('node-pty');
    const moduleDir = dirname(dirname(resolvedPath)); // one up from `lib/index.js`
    console.log('📍 node-pty found at:', moduleDir);

    // check if binding.gyp exists, confirm it's a source directory
    const gypPath = join(moduleDir, 'binding.gyp');
    if (!existsSync(gypPath)) {
      console.warn('⚠️ node-pty does not appear to be from source (binding.gyp not found)');
      return;
    }

    console.log('🔧 Rebuilding node-pty via node-gyp...');
    execSync('npx node-gyp rebuild', {
      cwd: moduleDir,
      stdio: 'inherit',
    });

    console.log('✅ node-pty rebuilt successfully via node-gyp');
  } catch (err) {
    console.error('❌ Failed to rebuild node-pty manually:', err.message);
  }
}

async function install() {
  try {
    // Check if dist/index.js exists (built version)
    const distPath = join(process.cwd(), 'dist', 'index.js');
    
    if (!existsSync(distPath)) {
      console.log('⚠️ Built files not found. This is normal during development.');
      console.log('Run `npm run build` to build the project.');
      return;
    }

    const ok = tryLoadNodePty();
    if (!ok) {
      // if module load failed, try to rebuild node-pty manually
      tryRebuildNodePtyManually();
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