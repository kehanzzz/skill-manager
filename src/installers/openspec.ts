import path from 'path';
import { execSync } from 'child_process';
import { Platform } from '../types/index.js';
import { BaseInstaller } from './base.js';
import { PATHS } from '../core/platform.js';
import { ensureInstalled, getEnvWithBinPath, forceUpdate, isInstalledInUserDir } from '../core/deps.js';

export class OpenSpecInstaller extends BaseInstaller {
  name = 'openspec';
  repoUrl = 'git@github.com:Fission-AI/OpenSpec.git';
  description = 'Spec-driven development (SDD) for AI coding assistants';
  
  private getVersion(env: NodeJS.ProcessEnv): string {
    try {
      const output = execSync('openspec --version', { encoding: 'utf-8', env }).trim();
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
    if (isInstalledInUserDir('openspec') && !force) {
      const env = getEnvWithBinPath('openspec');
      console.log(`OpenSpec CLI is already installed (v${this.getVersion(env)}).`);
      console.log(`Run 'openspec init --tools ${platforms.map(p => this.getToolId(p)).join(',')}' in your project to configure.`);
      
      const primaryPath = path.join(PATHS[platforms[0]].skills, 'openspec');
      this.recordInstall({
        method: 'npm',
        targetPath: primaryPath,
        version: this.getVersion(env),
      }, platforms);
      
      return;
    }
    
    await forceUpdate('openspec');
    
    const env = getEnvWithBinPath('openspec');
    const version = this.getVersion(env);
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
    
    await forceUpdate('openspec');
    
    const env = getEnvWithBinPath('openspec');
    const version = this.getVersion(env);
    const now = new Date().toISOString();
    const primaryPath = path.join(PATHS[info.platforms[0]].skills, 'openspec');
    
    this.recordInstall({
      targetPath: primaryPath,
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
      const env = getEnvWithBinPath('openspec');
      execSync('npm uninstall --prefix ~/.npm-global @fission-ai/openspec', { stdio: 'inherit', env });
    } catch {
      console.log('OpenSpec CLI was not installed or already removed.');
    }
    
    this.recordRemove();
    console.log(`✓ OpenSpec removed.`);
  }
}