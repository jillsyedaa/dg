import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { getPlatformInfo } from './platform.js';
import { downloadFile, ensureDirectoryExists } from './file.js';
import { dgLogger as logger } from './logger.js';

const PTY_VERSION = '0.3.2';

export async function downloadPTYBinary(): Promise<string | null> {
  const platformInfo = getPlatformInfo();
  
  // Determine binary name based on platform
  const binaryName = platformInfo.platform === 'darwin'
    ? `librust_pty_${platformInfo.arch === 'arm64' ? 'arm64' : 'x64'}.dylib`
    : 'librust_pty.so';
    
  // Use ~/.dg/bin for our binaries
  const binDir = join(process.env.HOME || process.env.USERPROFILE || '', '.dg', 'bin');
  const binaryPath = join(binDir, binaryName);
  
  // If binary already exists, return its path
  if (existsSync(binaryPath)) {
    return binaryPath;
  }
  
  try {
    // Create bin directory if needed
    await ensureDirectoryExists(binDir);
    
    // Download from GitHub releases
    const url = `https://github.com/sursaone/bun-pty/releases/download/v${PTY_VERSION}/${binaryName}`;
    const success = await downloadFile(url, binaryPath);
    
    if (!success) {
      return null;
    }
    
    // Make binary executable
    execSync(`chmod +x ${binaryPath}`, { stdio: 'pipe' });
    
    // Write env file for binary location
    const envPath = join(binDir, '.env');
    await Bun.write(envPath, `BUN_PTY_LIB=${binaryPath}\n`);
    
    logger.debug(`Downloaded PTY binary to ${binaryPath}`);
    return binaryPath;
  } catch (error) {
    logger.error('Failed to download PTY binary:', error);
    return null;
  }
}

export function getPTYPath(): string | null {
  const platformInfo = getPlatformInfo();
  const binaryName = platformInfo.platform === 'darwin'
    ? `librust_pty_${platformInfo.arch === 'arm64' ? 'arm64' : 'x64'}.dylib`
    : 'librust_pty.so';
  
  const binDir = join(process.env.HOME || process.env.USERPROFILE || '', '.dg', 'bin');
  const binaryPath = join(binDir, binaryName);
  
  return existsSync(binaryPath) ? binaryPath : null;
} 