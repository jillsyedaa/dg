import { platform, arch } from 'os';

export interface PlatformInfo {
  platform: 'darwin' | 'linux' | 'win32';
  arch: 'x64' | 'arm64';
}

export function getPlatformInfo(): PlatformInfo {
  const plat = platform();
  const architecture = arch();
  
  // Validate platform
  if (plat !== 'darwin' && plat !== 'linux' && plat !== 'win32') {
    throw new Error(`Unsupported platform: ${plat}`);
  }
  
  // Validate architecture
  if (architecture !== 'x64' && architecture !== 'arm64') {
    throw new Error(`Unsupported architecture: ${architecture}`);
  }
  
  return {
    platform: plat,
    arch: architecture
  };
} 