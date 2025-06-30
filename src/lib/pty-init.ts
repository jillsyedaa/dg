import { checkPTYAvailability } from './pty.js';
import { dgLogger as logger } from './logger.js';

let isInitialized = false;

export async function ensurePTYAvailable(): Promise<boolean> {
  if (isInitialized) {
    return true;
  }

  const isAvailable = await checkPTYAvailability();
  
  if (!isAvailable) {
    logger.error('node-pty is not available. Please install it: npm install node-pty');
    return false;
  }
  
  isInitialized = true;
  logger.debug('node-pty is available and ready');
  
  return true;
} 