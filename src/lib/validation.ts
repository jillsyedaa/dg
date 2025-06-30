import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import type { CastConfig, ValidationResult } from '../types.js';
import { dgLogger } from './logger.js';

const STANDARD_DIMENSIONS = {
  columns: 120,
  rows: 30
};

function extractCommandFromCast(cast: CastConfig): string | undefined {
  try {
    const castPath = join(process.cwd(), '.dg', 'casts', `${cast.name}.cast`);
    if (!existsSync(castPath)) {
      dgLogger.debug('Cast file not found:', castPath);
      return undefined;
    }

    const content = readFileSync(castPath, 'utf8');
    const lines = content.split('\n');
    let command = '';
    let isCollectingCommand = false;

    for (const line of lines) {
      try {
        const event = JSON.parse(line);
        // Check if it's output event and contains prompt
        if (event[1] === 'o') {
          const output = event[2];
          if (output.includes('$ ')) {
            isCollectingCommand = true;
            command = ''; // Reset command when we see a new prompt
            dgLogger.debug('Found prompt, starting command collection');
          } else if (isCollectingCommand) {
            // If we're collecting and see a newline, we're done
            if (output.includes('\r\n') || output.includes('\n')) {
              isCollectingCommand = false;
              // Process the command to handle backspaces and control chars
              const chars = command.split('');
              const finalChars: string[] = [];
              
              for (let i = 0; i < chars.length; i++) {
                if (chars[i] === '\b') {
                  // Remove last char when we see a backspace
                  finalChars.pop();
                } else if (chars[i] === '\u001b') {
                  // Skip ANSI escape sequences
                  while (i < chars.length && !chars[i].match(/[A-Za-z]/)) {
                    i++;
                  }
                } else {
                  finalChars.push(chars[i]);
                }
              }
              
              command = finalChars.join('')
                               .replace(/\u001b\[\?2004[hl]/g, '') // Remove remaining terminal control sequences
                               .replace(/\r\n$|\n$/, '')  // Remove trailing newline
                               .trim();
              
              if (command) {
                dgLogger.debug('Extracted command:', command);
                return command;
              }
            } else {
              command += output;
              dgLogger.debug('Building command:', command);
            }
          }
        }
      } catch {
        // Skip invalid JSON lines
        continue;
      }
    }

    dgLogger.debug('Final command:', command);
    return command || undefined;
  } catch (error) {
    dgLogger.error('Failed to extract command from cast:', error);
    return undefined;
  }
}

function normalizeCommand(command: string): string {
  // If it starts with ./ and ends with .js, prefix with node
  if (command.startsWith('./') && command.endsWith('.js')) {
    const normalized = `node ${command}`;
    dgLogger.debug(`Normalized command: ${command} -> ${normalized}`);
    return normalized;
  }
  dgLogger.debug('Using command as-is:', command);
  return command;
}

export async function validateDemo(cast: CastConfig): Promise<ValidationResult> {
  // Skip manual-only demos
  if (cast.validation?.mode === 'manual-only') {
    return { 
      status: 'skipped', 
      reason: 'Manual verification required' 
    };
  }
  
  // Skip interactive recordings
  if (cast.interactive) {
    return {
      status: 'skipped',
      reason: 'Interactive recording - requires manual verification'
    };
  }
  
  // Try to get command from cast file if not in config
  const command = cast.command || extractCommandFromCast(cast);
  dgLogger.debug('Command to validate:', command);
  
  // Validate command
  if (!command) {
    return {
      status: 'skipped',
      reason: 'No command to validate'
    };
  }

  try {
    // Set up standardized environment
    const env = {
      ...process.env,
      COLUMNS: STANDARD_DIMENSIONS.columns.toString(),
      LINES: STANDARD_DIMENSIONS.rows.toString(),
      TERM: 'xterm-256color',
      // Disable prompts and interactivity
      CI: '1',
      NONINTERACTIVE: '1'
    };
    
    // Re-run the command with proper runtime
    const normalizedCommand = normalizeCommand(command);
    dgLogger.debug('Executing command:', normalizedCommand);
    const result = execSync(normalizedCommand, {
      env,
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 30000 // 30 second timeout
    });
    
    // Apply regex filters if configured
    let filteredOutput = result;
    if (cast.validation?.patterns) {
      for (const pattern of cast.validation.patterns) {
        filteredOutput = filteredOutput.replace(new RegExp(pattern, 'g'), '[FILTERED]');
      }
    }
    
    return {
      status: 'passed',
      filteredOutput
    };
    
  } catch (error: any) {
    dgLogger.error('Command execution failed:', error);
    const expectedExitCode = cast.validation?.expectExitCode ?? 0;
    
    // If we expect a non-zero exit code and got it, that's a pass
    if (expectedExitCode !== 0 && error.status === expectedExitCode) {
      return {
        status: 'passed',
        filteredOutput: error.stdout || error.stderr,
        exitCode: error.status
      };
    }
    
    return {
      status: 'failed',
      reason: `Command failed with exit code ${error.status} (expected ${expectedExitCode})`,
      exitCode: error.status
    };
  }
}

export function getStandardFilterPatterns(): string[] {
  return [
    // Timestamps
    '\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d{3})?Z?',
    '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}',
    
    // Random IDs
    '[a-f0-9]{32}',
    '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}',
    'Session ID: [a-f0-9]+',
    
    // ANSI color codes
    '\\x1b\\[[0-9;]*m',
    '\\033\\[[0-9;]*m',
    
    // User-specific paths
    '/Users/[^/\\s]+',
    '/home/[^/\\s]+',
    'C:\\\\Users\\\\[^\\\\\\s]+',
    
    // Process IDs
    'PID: \\d+',
    'Process \\d+',
    
    // Temporary files
    '/tmp/[a-zA-Z0-9_-]+',
    '\\.tmp[a-zA-Z0-9_-]*'
  ];
}

export function suggestFilters(command: string, output: string): string[] {
  const suggestions: string[] = [];
  
  // Check for common patterns that might need filtering
  if (output.includes('Created at') || output.includes('Generated at')) {
    suggestions.push('\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}');
  }
  
  if (output.includes('/Users/') || output.includes('/home/')) {
    suggestions.push('/Users/[^/\\s]+', '/home/[^/\\s]+');
  }
  
  if (output.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/)) {
    suggestions.push('[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}');
  }
  
  if (output.includes('\x1b[') || output.includes('\\033[')) {
    suggestions.push('\\x1b\\[[0-9;]*m');
  }
  
  return suggestions;
}

export async function validateTerminalDimensions(): Promise<boolean> {
  try {
    const cols = process.stdout.columns || 0;
    const rows = process.stdout.rows || 0;
    
    return cols >= STANDARD_DIMENSIONS.columns && rows >= STANDARD_DIMENSIONS.rows;
  } catch {
    return false;
  }
} 