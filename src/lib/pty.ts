import { dgLogger as logger } from './logger.js';

export async function checkPTYAvailability(): Promise<boolean> {
  try {
    // Try to import node-pty to check if it's available
    await import('node-pty');
    logger.debug('node-pty is available');
    return true;
  } catch (error) {
    logger.error('node-pty is not available:', error);
    return false;
  }
}

export function getPTYPath(): string | null {
  // node-pty handles its own binaries, so we just return a placeholder
  return 'node-pty';
} 