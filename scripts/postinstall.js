#!/usr/bin/env node

import { platform, arch } from 'os';
import { join } from 'path';
import { chmod, symlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

async function install() {
  // Detect platform and architecture
  const plat = platform();
  const architecture = arch();
  
  let binaryName;
  switch(plat) {
    case 'darwin':
      binaryName = `dg-darwin-${architecture === 'arm64' ? 'arm64' : 'x64'}`;
      break;
    case 'linux':
      binaryName = 'dg-linux-x64';
      break;
    case 'win32':
      binaryName = 'dg-windows-x64';
      break;
    default:
      console.error(`Unsupported platform: ${plat}`);
      process.exit(1);
  }

  try {
    // Determine installation paths
    const isWindows = plat === 'win32';
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    const installDir = isWindows 
      ? join(homeDir, 'AppData', 'Local', 'dg')
      : '/usr/local/lib/dg';
    const binDir = isWindows
      ? join(homeDir, 'AppData', 'Local', 'dg')
      : '/usr/local/bin';

    // Create directories if they don't exist
    if (!existsSync(installDir)) {
      await mkdir(installDir, { recursive: true });
    }
    if (!existsSync(binDir)) {
      await mkdir(binDir, { recursive: true });
    }

    // Source and target paths
    const sourcePath = join(process.cwd(), 'dist', binaryName);
    const targetPath = join(installDir, binaryName);
    const symlinkPath = join(binDir, 'dg');

    // Make binary executable
    await chmod(sourcePath, 0o755);

    // Create symlink to binary
    try {
      await symlink(sourcePath, symlinkPath);
    } catch (err) {
      // Symlink might already exist, that's okay
      if (err.code !== 'EEXIST') {
        throw err;
      }
    }

    console.log('✓ DeepGuide CLI installed successfully!');
    console.log('\nYou can now run \'dg --help\' to get started');
    console.log('Run \'dg doctor\' to verify your installation');
    console.log('To install globally:');
    console.log('  sudo npm install -g @deepguide-ai/dg');

  } catch (error) {
    console.error('Installation failed:', error.message);
    if (error.code === 'EACCES') {
      console.log('\nTry running with sudo:');
      console.log('  sudo npm install -g @deepguide-ai/dg');
    }
    process.exit(1);
  }
}

install().catch(console.error); 