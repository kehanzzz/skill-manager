import { execSync } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';

export type DepName = 'git' | 'uv' | 'uipro-cli';

interface DepInfo {
  name: string;
  description: string;
  checkCommand: string;
  installCommands: Record<string, string>;
  manualInstallUrl?: string;
  customInstall?: () => boolean;
  binPath?: string;
}

const home = os.homedir();
const npmGlobalDir = path.join(home, '.npm-global');
const npmBinDir = path.join(npmGlobalDir, 'node_modules', '.bin');

const DEPS: Record<DepName, DepInfo> = {
  git: {
    name: 'Git',
    description: 'Version control system',
    checkCommand: 'git --version',
    installCommands: {
      darwin: 'brew install git',
      linux: 'sudo apt-get update && sudo apt-get install -y git',
    },
    manualInstallUrl: 'https://git-scm.com/downloads',
  },
  uv: {
    name: 'uv',
    description: 'Fast Python package installer',
    checkCommand: 'uv --version',
    installCommands: {
      darwin: 'curl -LsSf https://astral.sh/uv/install.sh | sh',
      linux: 'curl -LsSf https://astral.sh/uv/install.sh | sh',
    },
    manualInstallUrl: 'https://docs.astral.sh/uv/',
  },
  'uipro-cli': {
    name: 'uipro-cli',
    description: 'UI/UX Pro Max CLI tool',
    checkCommand: 'uipro --version',
    installCommands: {},
    binPath: npmBinDir,
    customInstall: () => {
      if (!fs.existsSync(npmGlobalDir)) {
        fs.mkdirSync(npmGlobalDir, { recursive: true });
      }
      execSync(`npm install --prefix ${npmGlobalDir} uipro-cli`, { stdio: 'inherit' });
      
      console.log(chalk.gray(`\nTo use uipro in new terminals, add to your shell config:`));
      console.log(chalk.cyan(`  export PATH="${npmBinDir}:$PATH"`));
      
      return true;
    },
  },
};

function getPlatform(): 'darwin' | 'linux' | 'other' {
  const platform = os.platform();
  if (platform === 'darwin') return 'darwin';
  if (platform === 'linux') return 'linux';
  return 'other';
}

export function isInstalled(dep: DepName): boolean {
  const info = DEPS[dep];
  try {
    execSync(info.checkCommand, { stdio: 'ignore' });
    return true;
  } catch {
    if (info.binPath) {
      try {
        const cmd = info.checkCommand.split(' ')[0];
        const fullPath = path.join(info.binPath, cmd);
        execSync(`${fullPath} --version`, { stdio: 'ignore' });
        process.env.PATH = `${info.binPath}:${process.env.PATH || ''}`;
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

export function getInstallCommand(dep: DepName): string | null {
  const info = DEPS[dep];
  const platform = getPlatform();
  return info.installCommands[platform] || null;
}

export function getBinPath(dep: DepName): string | null {
  const info = DEPS[dep];
  return info.binPath || null;
}

export function getEnvWithBinPath(dep: DepName): NodeJS.ProcessEnv {
  const binPath = getBinPath(dep);
  if (binPath && fs.existsSync(binPath)) {
    return {
      ...process.env,
      PATH: `${binPath}:${process.env.PATH || ''}`,
    };
  }
  return process.env;
}

const uvCacheDir = path.join(home, '.uv-cache');
const uvToolDir = path.join(home, '.uv-tools');
const uvToolBinDir = path.join(home, '.local', 'bin');

export function getUvEnv(): NodeJS.ProcessEnv {
  if (!fs.existsSync(uvCacheDir)) {
    fs.mkdirSync(uvCacheDir, { recursive: true });
  }
  if (!fs.existsSync(uvToolDir)) {
    fs.mkdirSync(uvToolDir, { recursive: true });
  }
  if (!fs.existsSync(uvToolBinDir)) {
    fs.mkdirSync(uvToolBinDir, { recursive: true });
  }
  return {
    ...process.env,
    UV_CACHE_DIR: uvCacheDir,
    UV_TOOL_DIR: uvToolDir,
    PATH: `${uvToolBinDir}:${process.env.PATH || ''}`,
  };
}

export function getUvToolBinDir(): string {
  return uvToolBinDir;
}

export async function ensureInstalled(dep: DepName): Promise<void> {
  if (isInstalled(dep)) {
    return;
  }

  const info = DEPS[dep];
  const platform = getPlatform();
  const installCmd = info.installCommands[platform];

  console.log(chalk.yellow(`${info.name} is not installed. Installing...`));

  if (info.customInstall) {
    try {
      info.customInstall();
      console.log(chalk.green(`✓ ${info.name} installed successfully!`));
    } catch (error) {
      console.error(chalk.red(`Failed to install ${info.name}.`));
      throw new Error(`Failed to install ${info.name}.`);
    }
    return;
  }

  if (!installCmd) {
    console.error(chalk.red(`Cannot auto-install ${info.name} on ${platform}.`));
    if (info.manualInstallUrl) {
      console.log(chalk.gray(`Please install manually: ${info.manualInstallUrl}`));
    }
    throw new Error(`${info.name} is required but cannot be auto-installed.`);
  }

  console.log(chalk.cyan(`Running: ${installCmd}`));

  try {
    execSync(installCmd, { stdio: 'inherit' });
    console.log(chalk.green(`✓ ${info.name} installed successfully!`));
  } catch (error) {
    console.error(chalk.red(`Failed to install ${info.name}.`));
    if (info.manualInstallUrl) {
      console.log(chalk.gray(`Please install manually: ${info.manualInstallUrl}`));
    }
    throw new Error(`Failed to install ${info.name}.`);
  }
}