import * as p from '@clack/prompts';
import { checkAsciinemaAvailability, downloadAsciinema } from '../lib/asciinema.js';
import { checkPTYAvailability } from '../lib/pty.js';
import {
  configExists,
  createConfig,
  detectProjectName,
  ensureDirectoryStructure,
  writeConfig
} from '../lib/config.js';
import { join } from 'path';
import { ensureDirectoryExists } from '../lib/file.js';

const GITHUB_WORKFLOW = `name: DeepGuide

on:
  push:
    branches: [ main, master, develop ]
  pull_request:
    branches: [ main, master ]

jobs:
  validate:
    name: Validate Demos
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
    
    - name: Install dependencies
      run: npm install
      
    - name: Install asciinema
      run: |
        sudo apt-get update
        sudo apt-get install -y asciinema
    
    - name: Validate demos
      run: npx @deepguide-ai/dg validate --non-interactive
`;

async function createGitHubWorkflow(): Promise<boolean> {
  try {
    const workflowDir = join(process.cwd(), '.github', 'workflows');
    await ensureDirectoryExists(workflowDir);
    
    const workflowPath = join(workflowDir, 'dg-validate.yml');
    const { writeFile } = await import('fs/promises');
    await writeFile(workflowPath, GITHUB_WORKFLOW, 'utf8');
    
    return true;
  } catch (error) {
    return false;
  }
}

export async function initCommand(): Promise<void> {
  console.clear();
  
  p.intro('✨ Welcome to DeepGuide CLI!');
  
  // Check if already initialized
  if (configExists()) {
    const shouldReinit = await p.confirm({
      message: 'dg is already initialized. Reinitialize?',
      initialValue: false
    });
    
    if (!shouldReinit) {
      p.cancel('Initialization cancelled.');
      return;
    }
  }
  
  // Check dependencies
  const spinner = p.spinner();
  spinner.start('Checking dependencies...');
  
  // Check asciinema
  const asciinemaCheck = await checkAsciinemaAvailability();
  if (asciinemaCheck.available) {
    spinner.stop(`✅ Using ${asciinemaCheck.source} asciinema v${asciinemaCheck.version}`);
  } else {
    spinner.stop('⚠️  asciinema not found');
    
    const shouldDownload = await p.confirm({
      message: 'Would you like me to download asciinema for you?',
      initialValue: true
    });
    
    if (shouldDownload) {
      spinner.start('Downloading asciinema...');
      const binaryPath = await downloadAsciinema();
      
      if (binaryPath) {
        spinner.stop('✅ Downloaded asciinema successfully');
      } else {
        spinner.stop('❌ Failed to download asciinema');
        const shouldContinue = await p.confirm({
          message: 'Continue anyway? (You can install it later)',
          initialValue: true
        });
        
        if (!shouldContinue) {
          p.cancel('Initialization cancelled.');
          return;
        }
      }
    } else {
      const shouldContinue = await p.confirm({
        message: 'Continue anyway? (You can install it later)',
        initialValue: true
      });
      
      if (!shouldContinue) {
        p.cancel('Initialization cancelled.');
        return;
      }
    }
  }
  
  // Check PTY library
  spinner.start('Checking PTY library...');
  const ptyAvailable = await checkPTYAvailability();
  
  if (ptyAvailable) {
    spinner.stop('✅ PTY library found');
  } else {
    spinner.stop('⚠️  PTY library (node-pty) not found');
    p.note('node-pty is required for interactive recording. Install it with: npm install node-pty', '⚠️');
    
    const shouldContinue = await p.confirm({
      message: 'Continue anyway? (You can install node-pty later)',
      initialValue: true
    });
    
    if (!shouldContinue) {
      p.cancel('Initialization cancelled.');
      return;
    }
  }
  
  // Interactive setup
  const options = await p.group(
    {
      projectName: () => p.text({
        message: "What's your project name?",
        placeholder: detectProjectName(),
        defaultValue: detectProjectName(),
        validate: (value) => {
          if (!value || value.trim().length === 0) {
            return 'Project name is required';
          }
        }
      }),
      
      outputDir: () => p.text({
        message: 'Where should we store recordings?',
        placeholder: '.dg',
        defaultValue: '.dg'
      })
    },
    {
      onCancel: () => {
        p.cancel('Operation cancelled.');
        process.exit(0);
      }
    }
  );
  
  // Create configuration
  const config = createConfig(options.projectName);
  config.outputDir = options.outputDir;
  
  // Create directory structure
  const dirSpinner = p.spinner();
  dirSpinner.start('Creating directory structure...');
  
  const dirSuccess = ensureDirectoryStructure(options.outputDir);
  if (!dirSuccess) {
    dirSpinner.stop('❌ Failed to create directories');
    p.cancel('Setup failed. Please check permissions.');
    return;
  }
  
  dirSpinner.stop('📁 Created output directories');
  
  // Write configuration
  const configSpinner = p.spinner();
  configSpinner.start('Saving configuration...');
  
  try {
    writeConfig(config);
    configSpinner.stop('Configuration saved');
  } catch (error) {
    configSpinner.stop('❌ Failed to save configuration');
    p.cancel('Setup failed. Please check permissions.');
    return;
  }
  
  // Create GitHub workflow
  const workflowSpinner = p.spinner();
  workflowSpinner.start('Setting up GitHub workflow...');
  
  const workflowSuccess = await createGitHubWorkflow();
  if (workflowSuccess) {
    workflowSpinner.stop('📋 Created GitHub workflow');
  } else {
    workflowSpinner.stop('⚠️ Failed to create GitHub workflow');
  }
  
  p.outro('Happy documenting! 📚');
} 