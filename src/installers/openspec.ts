import path from 'path';
import { execSync } from 'child_process';
import { Platform } from '../types/index.js';
import { BaseInstaller } from './base.js';
import { PATHS } from '../core/platform.js';

export class OpenSpecInstaller extends BaseInstaller {
  name = 'openspec';
  repoUrl = 'git@github.com:Fission-AI/OpenSpec.git';
  description = 'Spec-driven development (SDD) for AI coding assistants';
  
  private npmPackage = '@fission-ai/openspec';
  
  private isOpenSpecInstalled(): boolean {
    try {
      execSync('openspec --version', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
  
  private getVersion(): string {
    try {
      const output = execSync('openspec --version', { encoding: 'utf-8' }).trim();
      return output.replace(/^v?/, '');
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
    if (this.isOpenSpecInstalled() && !force) {
      console.log(`OpenSpec CLI is already installed globally (v${this.getVersion()}).`);
      console.log(`Run 'openspec init --tools ${platforms.map(p => this.getToolId(p)).join(',')}' in your project to configure.`);
      
      const primaryPath = path.join(PATHS[platforms[0]].skills, 'openspec');
      this.recordInstall({
        method: 'npm',
        targetPath: primaryPath,
        version: this.getVersion(),
      }, platforms);
      
      return;
    }
    
    if (force && this.isOpenSpecInstalled()) {
      console.log('Reinstalling OpenSpec CLI...');
      execSync(`npm install -g ${this.npmPackage}@latest`, { stdio: 'inherit' });
    } else {
      console.log('Installing OpenSpec CLI globally...');
      execSync(`npm install -g ${this.npmPackage}@latest`, { stdio: 'inherit' });
    }
    
    const version = this.getVersion();
    const primaryPath = path.join(PATHS[platforms[0]].skills, 'openspec');
    
    this.recordInstall({
      method: 'npm',
      targetPath: primaryPath,
      version,
    }, platforms);
    
    console.log(`\n✓ OpenSpec CLI v${version} installed successfully!`);
    console.log(`\nTo configure OpenSpec in your project, run:`);
    console.log(`  openspec init --tools ${platforms.map(p => this.getToolId(p)).join(',')}`);
  }
  
  async update(): Promise<void> {
    const info = this.getInfo();
    if (!info) {
      throw new Error(`${this.name} is not installed.`);
    }
    
    console.log('Updating OpenSpec CLI...');
    
    execSync(`npm install -g ${this.npmPackage}@latest`, { stdio: 'inherit' });
    
    const version = this.getVersion();
    const now = new Date().toISOString();
    
    this.recordInstall({
      version,
      updatedAt: now,
    }, info.platforms);
    
    console.log(`\n✓ OpenSpec updated to version ${version}`);
    console.log(`\nTo update skills in your project, run:`);
    console.log(`  openspec update`);
  }
  
  async remove(purge = false): Promise<void> {
    console.log('Removing OpenSpec CLI...');
    
    try {
      execSync(`npm uninstall -g ${this.npmPackage}`, { stdio: 'inherit' });
    } catch {
      console.log('OpenSpec CLI was not installed globally or already removed.');
    }
    
    this.recordRemove();
    console.log(`✓ OpenSpec removed.`);
  }
}