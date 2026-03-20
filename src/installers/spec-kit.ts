import path from 'path';
import { execSync } from 'child_process';
import { Platform } from '../types/index.js';
import { BaseInstaller } from './base.js';
import { PATHS } from '../core/platform.js';

export class SpecKitInstaller extends BaseInstaller {
  name = 'spec-kit';
  repoUrl = 'https://github.com/github/spec-kit';
  description = 'Spec-Driven Development toolkit for AI coding assistants';
  
  private cliName = 'specify-cli';
  private cliCommand = 'specify';
  
  private isUvInstalled(): boolean {
    try {
      execSync('uv --version', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
  
  private isSpecKitInstalled(): boolean {
    try {
      execSync(`${this.cliCommand} --help`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
  
  private getVersion(): string {
    try {
      const output = execSync(`${this.cliCommand} version`, { encoding: 'utf-8' }).trim();
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
    if (!this.isUvInstalled()) {
      throw new Error('uv is not installed. Please install uv first: https://docs.astral.sh/uv/');
    }
    
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
      execSync(`uv tool install ${this.cliName} --force --from git+${this.repoUrl}.git`, { stdio: 'inherit' });
    } else {
      console.log('Installing Spec-Kit CLI globally via uv...');
      execSync(`uv tool install ${this.cliName} --from git+${this.repoUrl}.git`, { stdio: 'inherit' });
    }
    
    const version = this.getVersion();
    const primaryPath = path.join(PATHS[platforms[0]].skills, 'spec-kit');
    
    this.recordInstall({
      method: 'uv',
      targetPath: primaryPath,
      version,
    }, platforms);
    
    console.log(`\n✓ Spec-Kit CLI v${version} installed successfully!`);
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
    
    if (!this.isUvInstalled()) {
      throw new Error('uv is not installed. Please install uv first: https://docs.astral.sh/uv/');
    }
    
    console.log('Updating Spec-Kit CLI...');
    
    execSync(`uv tool install ${this.cliName} --force --from git+${this.repoUrl}.git`, { stdio: 'inherit' });
    
    const version = this.getVersion();
    const now = new Date().toISOString();
    
    this.recordInstall({
      version,
      updatedAt: now,
    }, info.platforms);
    
    console.log(`\n✓ Spec-Kit updated to version ${version}`);
  }
  
  async remove(purge = false): Promise<void> {
    if (!this.isUvInstalled()) {
      console.log('uv is not installed, skipping CLI removal.');
    } else {
      console.log('Removing Spec-Kit CLI...');
      try {
        execSync(`uv tool uninstall ${this.cliName}`, { stdio: 'inherit' });
      } catch {
        console.log('Spec-Kit CLI was not installed or already removed.');
      }
    }
    
    this.recordRemove();
    console.log(`✓ Spec-Kit removed.`);
  }
}