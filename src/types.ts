export interface Config {
  version: string;
  project: string;
  outputDir: string;
  casts: CastConfig[];
  updated: string;
}

export interface CastConfig {
  name: string;
  title: string;
  created: string;
  updated: string;
  validated?: string;
  interactive?: boolean;
  validation?: {
    mode: 'manual-only' | 'auto';
    patterns?: string[];
    expectExitCode?: number;
  };
  command?: string;
}

export interface ValidationConfig {
  mode: 'auto' | 'manual-only';
  filterRegex?: string[];
  expectExitCode?: number;
  expectOutput?: string[];
  reason?: string;
}

export interface ValidationResult {
  status: 'passed' | 'failed' | 'skipped';
  reason?: string;
  filteredOutput?: string;
  exitCode?: number;
}

export interface SVGResult {
  svg: string | null;
  markdown: string;
  warning?: string;
}

export interface PlatformInfo {
  platform: string;
  arch: string;
  supported: boolean;
  asciinemaPath?: string;
  fallbackToPath: boolean;
}

export interface DiagnosticResult {
  status: 'ok' | 'warning' | 'error';
  message: string;
  details?: string;
}

export interface EnvironmentDiagnostics {
  asciinema?: DiagnosticResult;
  svgTerm: DiagnosticResult;
  storage: DiagnosticResult;
  platform: DiagnosticResult;
} 