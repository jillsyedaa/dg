/**
 * Logger utility for DG CLI
 * Supports verbose mode and dev mode with stack traces
 */

import winston from 'winston';
import { format } from 'winston';
const { combine, timestamp, printf, colorize, errors } = format;

// Custom format for CLI-friendly output
const cliFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  // Add emojis based on log level
  const emoji = {
    error: '❌',
    warn: '⚠️ ',
    info: '📝',
    debug: '🔍'
  }[level] || '📝';

  let output = `${emoji} ${message}`;

  // Add metadata if present (excluding internal winston props)
  const metaKeys = Object.keys(metadata).filter(key => !key.startsWith('_'));
  if (metaKeys.length > 0) {
    const meta = metaKeys.reduce((acc, key) => {
      acc[key] = metadata[key];
      return acc;
    }, {} as Record<string, any>);
    output += `\n${JSON.stringify(meta, null, 2)}`;
  }

  // Add stack trace for errors in dev mode
  if (stack && process.env.NODE_ENV === 'development') {
    output += `\n\nStack Trace:\n${stack}`;
  }

  return output;
});

// Create the winston logger
const logger = winston.createLogger({
  level: 'info', // Default level
  format: combine(
    timestamp(),
    errors({ stack: true }), // Capture stack traces
    cliFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        cliFormat
      )
    })
  ]
});

// Initialize logger settings
export function initLogger(options: { verbose?: boolean; dev?: boolean }) {
  // Set log level based on verbose flag
  logger.level = options.verbose ? 'debug' : 'info';

  // Set development mode
  if (options.dev) {
    process.env.NODE_ENV = 'development';
  }

  // Log initialization in debug mode
  logger.debug('Logger initialized', { 
    verbose: options.verbose, 
    dev: options.dev,
    level: logger.level,
    env: process.env.NODE_ENV 
  });
}

// LLM-specific logging functions
const llmLogger = {
  debug: (message: string, meta?: any) => {
    logger.debug(`[LLM] ${message}`, meta);
  },
  info: (message: string, meta?: any) => {
    logger.info(`[LLM] ${message}`, meta);
  },
  warn: (message: string, meta?: any) => {
    logger.warn(`[LLM] ${message}`, meta);
  },
  error: (error: Error | string, meta?: any) => {
    if (error instanceof Error) {
      logger.error(`[LLM] ${error.message}`, { 
        ...meta, 
        stack: error.stack 
      });
    } else {
      logger.error(`[LLM] ${error}`, meta);
    }
  },
  prompt: (prompt: string, meta?: any) => {
    logger.debug('\nLLM Prompt:', {
      prompt,
      ...meta,
      _section: 'prompt'
    });
  },
  response: (response: any, meta?: any) => {
    logger.debug('\nLLM Response:', {
      response: typeof response === 'string' ? response : JSON.stringify(response, null, 2),
      ...meta,
      _section: 'response'
    });
  }
};

// Export the enhanced logger
export const dgLogger = {
  error: (message: string | Error, meta?: any) => {
    if (message instanceof Error) {
      logger.error(message.message, { 
        ...meta, 
        stack: message.stack 
      });
    } else {
      logger.error(message, meta);
    }
  },
  warn: (message: string, meta?: any) => logger.warn(message, meta),
  info: (message: string, meta?: any) => logger.info(message, meta),
  debug: (message: string, meta?: any) => logger.debug(message, meta),
  llm: llmLogger,

  // Allow direct access to winston logger for advanced usage
  raw: logger
}; 