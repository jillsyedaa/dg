import { downloadPTYBinary, getPTYPath } from './pty.js';
import { dgLogger as logger } from './logger.js';

let isInitialized = false;

export async function ensurePTYAvailable(): Promise<boolean> {
  if (isInitialized) {
    return true;
  }

  let ptyPath = getPTYPath();
  
  if (!ptyPath) {
    logger.debug('PTY library not found, attempting to download...');
    ptyPath = await downloadPTYBinary();
    
    if (!ptyPath) {
      logger.error('Failed to download PTY library');
      return false;
    }
  }
  
  // Set the environment variable for bun-pty
  process.env.BUN_PTY_LIB = ptyPath;
  isInitialized = true;
  
  return true;
} 