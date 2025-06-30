import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import type { Config, CastConfig } from '../types.js';
import { dgLogger as logger } from './logger.js';

const DEFAULT_CONFIG: Omit<Config, 'casts'> = {
  version: '0.1.0',
  project: '',
  outputDir: '.dg',
  updated: new Date().toISOString()
};

export function getConfigPath(cwd: string = process.cwd()): string {
  return join(cwd, '.dg', 'config.json');
}

export function configExists(cwd: string = process.cwd()): boolean {
  return existsSync(getConfigPath(cwd));
}

export function readConfig(cwd: string = process.cwd()): Config | null {
  const configPath = join(cwd, '.dg', 'config.json');
  
  if (!existsSync(configPath)) {
    return null;
  }
  
  try {
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    return config;
  } catch (error) {
    logger.error('Failed to read config', error as Error);
    return null;
  }
}

export function writeConfig(config: Config, cwd: string = process.cwd()): void {
  const configPath = join(cwd, '.dg', 'config.json');
  logger.debug('Attempting to write config', { configPath, config });
  
  // Ensure parent directory exists
  const configDir = dirname(configPath);
  logger.debug('Checking config directory', { configDir });
  
  if (!existsSync(configDir)) {
    logger.debug('Creating config directory', { configDir });
    mkdirSync(configDir, { recursive: true });
  }

  // Validate config before writing
  if (!config.project || !config.version || !config.outputDir) {
    const error = new Error('Invalid config object - missing required fields');
    logger.error(error.message, { 
      hasProject: !!config.project,
      hasVersion: !!config.version,
      hasOutputDir: !!config.outputDir,
      config 
    });
    throw error;
  }

  // Write config with pretty formatting
  const configStr = JSON.stringify(config, null, 2);
  logger.debug('Writing config file', { configPath, configStr });
  writeFileSync(configPath, configStr);
  logger.debug('Config written successfully', { path: configPath });
}

export function createConfig(projectName: string, cwd: string = process.cwd()): Config {
  const config: Config = {
    ...DEFAULT_CONFIG,
    project: projectName,
    casts: []
  };
  
  return config;
}

export function ensureDirectoryStructure(outputDir: string = '.dg', cwd: string = process.cwd()): boolean {
  try {
    const basePath = join(cwd, outputDir);
    const castsPath = join(basePath, 'casts');
    const svgPath = join(basePath, 'svg');
    const snippetsPath = join(basePath, 'snippets');
    
    mkdirSync(basePath, { recursive: true });
    mkdirSync(castsPath, { recursive: true });
    mkdirSync(svgPath, { recursive: true });
    mkdirSync(snippetsPath, { recursive: true });
    
    return true;
  } catch (error) {
    console.error('Failed to create directory structure:', (error as Error).message);
    return false;
  }
}

export function getAllCasts(cwd: string = process.cwd()): CastConfig[] {
  const config = readConfig(cwd);
  return config?.casts || [];
}

export function addCast(cast: CastConfig, cwd: string = process.cwd()): void {
  logger.debug('Adding cast', { cast, cwd });

  // First ensure the directory structure exists
  if (!ensureDirectoryStructure('.dg', cwd)) {
    throw new Error('Failed to create directory structure');
  }

  // If config doesn't exist, create it with default values
  let config = readConfig(cwd);
  if (!config) {
    logger.debug('No existing config found, creating new one', { cwd });
    config = createConfig(detectProjectName(cwd), cwd);
    writeConfig(config, cwd);
  }
  
  logger.debug('Current config before adding cast', { 
    config,
    configKeys: Object.keys(config),
    configType: typeof config,
    configIsArray: Array.isArray(config),
    configProto: Object.getPrototypeOf(config)
  });
  
  config.casts = config.casts || [];
  config.casts.push(cast);
  config.updated = new Date().toISOString();
  
  logger.debug('Updated config with new cast', { 
    config,
    configKeys: Object.keys(config),
    configType: typeof config,
    configIsArray: Array.isArray(config),
    configProto: Object.getPrototypeOf(config)
  });
  
  writeConfig(config, cwd);
}

export function updateCast(cast: CastConfig, cwd: string = process.cwd()): void {
  const config = readConfig(cwd);
  if (!config) {
    throw new Error('No config found');
  }
  
  const index = config.casts.findIndex(c => c.name === cast.name);
  if (index === -1) {
    throw new Error(`Cast ${cast.name} not found`);
  }
  
  config.casts[index] = cast;
  config.updated = new Date().toISOString();
  
  writeConfig(config, cwd);
}

export function getCast(name: string, cwd: string = process.cwd()): CastConfig | null {
  const config = readConfig(cwd);
  if (!config) {
    return null;
  }
  
  return config.casts.find(c => c.name === name) || null;
}

export function detectProjectName(cwd: string = process.cwd()): string {
  try {
    // Try to read package.json
    const packagePath = join(cwd, 'package.json');
    if (existsSync(packagePath)) {
      const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
      if (pkg.name) {
        return pkg.name.replace(/^@[^/]+\//, ''); // Remove scope
      }
    }
    
    // Fallback to directory name
    return cwd.split('/').pop() || 'my-cli';
  } catch {
    return 'my-cli';
  }
} 