import { join } from 'path';
import { existsSync, readFileSync, mkdirSync } from 'fs';
import { checkTermSVGAvailability, exportSVG } from './termsvg.js';
import type { SVGResult } from '../types.js';

const THEME_CONFIGS = {
  light: {
    backgroundColor: '#ffffff',
    foregroundColor: '#24292e',
    palette: 'github-light'
  },
  dark: {
    backgroundColor: '#0d1117',
    foregroundColor: '#f0f6fc', 
    palette: 'github-dark'
  },
  auto: {
    backgroundColor: '#ffffff',
    foregroundColor: '#24292e',
    palette: 'github-light'
  }
};

export async function generateSVG(
  castPath: string, 
  theme: 'light' | 'dark' | 'auto' = 'light',
  options: {
    width?: number;
    height?: number;
    minify?: boolean;
  } = {}
): Promise<SVGResult> {
  const { width = 120, height = 30, minify = true } = options;
  
  if (!existsSync(castPath)) {
    return {
      svg: null,
      markdown: '',
      warning: `Cast file not found: ${castPath}`
    };
  }
  
  const config = THEME_CONFIGS[theme];
  
  // Get the cast filename and create SVG path in the svg/ directory
  const castName = castPath.split('/').pop()?.replace('.cast', '') || 'demo';
  const castDir = castPath.replace(/\/casts\/[^/]+\.cast$/, ''); // Get .dg directory
  const svgDir = join(castDir, 'svg');
  const outputPath = join(svgDir, `${castName}-${theme}.svg`);
  
  // Ensure svg directory exists
  if (!existsSync(svgDir)) {
    mkdirSync(svgDir, { recursive: true });
  }
  
  try {
    // Use termsvg export command
    const success = await exportSVG(castPath, outputPath, { minify });
    
    if (!success) {
      return {
        svg: null,
        markdown: generateAsciinemaOnlyMarkdown(castPath),
        warning: 'SVG export failed - check termsvg installation'
      };
    }
    
    const svg = readFileSync(outputPath, 'utf8');
    const markdown = generateMarkdownWithSVG(castPath, outputPath, svg);
    
    return {  
      svg,
      markdown
    };
  } catch (error) {
    // Fallback: Generate asciinema-only markdown
    return {
      svg: null,
      markdown: generateAsciinemaOnlyMarkdown(castPath),
      warning: 'SVG generation failed - termsvg not available or error occurred'
    };
  }
}

function generateMarkdownWithSVG(castPath: string, svgPath: string, svg: string): string {
  const castName = castPath.split('/').pop()?.replace('.cast', '') || 'demo';
  const relativeSvgPath = svgPath.replace(process.cwd() + '/', '');
  
  // For GitHub raw URLs, we need the full path
  const githubSvgUrl = `https://github.com/user/repo/raw/main/${relativeSvgPath}`;
  const asciinemaUrl = `https://asciinema.org/a/${castName}`;
  
  return `## ${castName.charAt(0).toUpperCase() + castName.slice(1)} Demo

![CLI Demo](${githubSvgUrl})

[📹 View interactive demo](${asciinemaUrl}) • [📁 Raw recording](${castPath.replace(process.cwd() + '/', '')})

### Usage

\`\`\`bash
# Copy and paste the commands below
\`\`\`

### Expected Output

\`\`\`
# The demo above shows the expected terminal output
\`\`\`
`;
}

function generateAsciinemaOnlyMarkdown(castPath: string): string {
  const castName = castPath.split('/').pop()?.replace('.cast', '') || 'demo';
  const asciinemaUrl = `https://asciinema.org/a/${castName}`;
  const relativeCastPath = castPath.replace(process.cwd() + '/', '');
  
  return `## ${castName.charAt(0).toUpperCase() + castName.slice(1)} Demo

[📹 View interactive demo](${asciinemaUrl}) • [📁 Raw recording](${relativeCastPath})

*Note: SVG preview unavailable - view the interactive demo above*

### Usage

\`\`\`bash
# Copy and paste the commands below
\`\`\`
`;
}

// Re-export for compatibility
export { checkTermSVGAvailability as testTermSVGAvailability } from './termsvg.js'; 