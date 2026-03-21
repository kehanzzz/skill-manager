import path from 'path';
import { execSync } from 'child_process';
import { Platform } from '../types/index.js';
import { BaseInstaller } from './base.js';
import { PATHS } from '../core/platform.js';
import { ensureInstalled, isInstalled as isDepInstalled, getUvEnv, getUvToolBinDir } from '../core/deps.js';
import chalk from 'chalk';

export class SpecKitInstaller extends BaseInstaller {
  name = 'spec-kit';
  repoUrl = 'git@github.com:github/spec-kit.git';
  description = 'Spec-Driven Development toolkit for AI coding assistants';
  
  private cliName = 'specify-cli';
  private gitUrl = 'https://github.com/github/spec-kit.git';
  private cliCommand = 'specify';
  
  private isSpecKitInstalled(): boolean {
    const env = getUvEnv();
    try {
      execSync(`${this.cliCommand} --help`, { stdio: 'ignore', env });
      return true;
    } catch {
      return false;
    }
  }
  
  private getVersion(): string {
    const env = getUvEnv();
    try {
      const output = execSync(`${this.cliCommand} version`, { encoding: 'utf-8', env }).trim();
      const match = output.match(/CLI Version\s+(\d+\.\d+\.\d+)/i);
      return match ? match[1] : 'unknown';
    } catch {
      return 'unknown';
    }
  }
  
  private getToolId(platform: Platform): string {
    const map: Record<Platform, string> = {
      opencode: 'opencode',
      claudecode: 'claude',
      generic: 'opencode',
    };
    return map[platform];
  }
  
  async install(platforms: Platform[], force = false): Promise<void> {
    await ensureInstalled('uv');
    
    const env = getUvEnv();
    
    if (this.isSpecKitInstalled() && !force) {
      console.log(`Spec-Kit CLI is already installed globally (v${this.getVersion()}).`);
      console.log(`Run 'specify init --ai ${this.getToolId(platforms[0])}' in your project to initialize.`);
      
      const primaryPath = path.join(PATHS[platforms[0]].skills, 'spec-kit');
      this.recordInstall({
        method: 'uv',
        targetPath: primaryPath,
        version: this.getVersion(),
      }, platforms);
      
      return;
    }
    
    if (force && this.isSpecKitInstalled()) {
      console.log('Reinstalling Spec-Kit CLI...');
      execSync(`uv tool install ${this.cliName} --force --from git+${this.gitUrl}`, { stdio: 'inherit', env });
    } else {
      console.log('Installing Spec-Kit CLI globally via uv...');
      execSync(`uv tool install ${this.cliName} --from git+${this.gitUrl}`, { stdio: 'inherit', env });
    }
    
    const version = this.getVersion();
    const primaryPath = path.join(PATHS[platforms[0]].skills, 'spec-kit');
    const uvToolBin = getUvToolBinDir();
    
    this.recordInstall({
      method: 'uv',
      targetPath: primaryPath,
      version,
    }, platforms);
    
    console.log(`\n✓ Spec-Kit CLI v${version} installed successfully!`);
    console.log(chalk.gray(`\nTo use specify in new terminals, add to your shell config:`));
    console.log(chalk.cyan(`  export PATH="${uvToolBin}:$PATH"`));
    console.log(`\nTo initialize Spec-Kit in your project, run:`);
    console.log(`  specify init --ai ${this.getToolId(platforms[0])}`);
    console.log(`\nOr to initialize in current directory:`);
    console.log(`  specify init --here --ai ${this.getToolId(platforms[0])}`);
  }
  
  async update(): Promise<void> {
    const info = this.getInfo();
    if (!info) {
      throw new Error(`${this.name} is not installed.`);
    }
    
    await ensureInstalled('uv');
    
    console.log('Updating Spec-Kit CLI...');
    
    const env = getUvEnv();
    execSync(`uv tool install ${this.cliName} --force --from git+${this.gitUrl}`, { stdio: 'inherit', env });
    
    const version = this.getVersion();
    const now = new Date().toISOString();
    
    this.recordInstall({
      version,
      updatedAt: now,
    }, info.platforms);
    
    console.log(`\n✓ Spec-Kit updated to version ${version}`);
  }
  
  async remove(purge = false): Promise<void> {
    if (!isDepInstalled('uv')) {
      console.log('uv is not installed, skipping CLI removal.');
    } else {
      console.log('Removing Spec-Kit CLI...');
      try {
        const env = getUvEnv();
        execSync(`uv tool uninstall ${this.cliName}`, { stdio: 'inherit', env });
      } catch {
        console.log('Spec-Kit CLI was not installed or already removed.');
      }
    }
    
    this.recordRemove();
    console.log(`✓ Spec-Kit removed.`);
  }
}