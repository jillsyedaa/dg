import { readFileSync } from 'fs';

// Patterns that indicate interactive elements that hang in CI
const INTERACTIVE_PATTERNS = [
  /password:/i,
  /enter passphrase/i,
  /\(y\/n\)/i,
  /press any key/i,
  /vim|nano|emacs|code/,
  /\[sudo\]/,
  /select an option/i,
  /enter your/i,
  /awaiting input/i,
  /choose from/i,
  /continue\?/i,
  /are you sure/i
];

export async function detectInteractiveElements(castPath: string): Promise<boolean> {
  try {
    const content = readFileSync(castPath, 'utf8');
    
    // Parse asciinema format - each line should be a JSON array
    const lines = content.trim().split('\n');
    
    // Skip header lines, process event lines
    for (const line of lines) {
      if (!line.startsWith('[')) continue;
      
      try {
        const event = JSON.parse(line);
        if (event.length >= 3 && typeof event[2] === 'string') {
          const output = event[2];
          
          // Check if output matches interactive patterns
          if (INTERACTIVE_PATTERNS.some(pattern => pattern.test(output))) {
            return true;
          }
        }
      } catch {
        // Skip malformed lines
        continue;
      }
    }
    
    return false;
  } catch (error) {
    console.warn('Failed to analyze cast file for interactive elements:', (error as Error).message);
    return false;
  }
}

export function getInteractiveReason(command: string): string | null {
  const commandPatterns = [
    { pattern: /vim|nano|emacs|code/, reason: 'Opens text editor - requires user interaction' },
    { pattern: /git commit(?!\s+(-m|--message))/, reason: 'Opens editor for commit message' },
    { pattern: /sudo/, reason: 'May prompt for password' },
    { pattern: /docker login/, reason: 'Prompts for username and password' },
    { pattern: /ssh/, reason: 'May prompt for passwords or host verification' },
    { pattern: /npm login/, reason: 'Prompts for authentication' }
  ];
  
  for (const { pattern, reason } of commandPatterns) {
    if (pattern.test(command)) {
      return reason;
    }
  }
  
  return null;
}

export function suggestNonInteractiveAlternative(command: string): string | null {
  const alternatives: Record<string, string> = {
    'git commit': 'git commit -m "your message"',
    'npm login': 'npm login --auth-type=web',
    'docker login': 'echo $DOCKER_TOKEN | docker login --username $DOCKER_USER --password-stdin',
    'sudo apt install': 'sudo apt install -y package-name',
    'sudo yum install': 'sudo yum install -y package-name'
  };
  
  for (const [pattern, alternative] of Object.entries(alternatives)) {
    if (command.includes(pattern)) {
      return alternative;
    }
  }
  
  return null;
} 