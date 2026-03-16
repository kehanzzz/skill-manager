// src/installers/ui-ux-pro-max.ts
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { Platform } from '../types/index.js';
import { BaseInstaller } from './base.js';
import { PATHS } from '../core/platform.js';

export class UiUxProMaxInstaller extends BaseInstaller {
  name = 'ui-ux-pro-max';
  repoUrl = 'https://github.com/nextlevelbuilder/ui-ux-pro-max-skill';
  description = 'UI/UX design intelligence with searchable database';
  
  private isUiproInstalled(): boolean {
    try {
      execSync('uipro --version', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
  
  private getPlatformArg(platform: Platform): string {
    const map: Record<Platform, string> = {
      opencode: 'opencode',
      claudecode: 'claude',
      generic: 'opencode', // uipro 不支持 generic，使用 opencode
    };
    return map[platform];
  }
  
  async install(platforms: Platform[], force = false): Promise<void> {
    if (!this.isUiproInstalled()) {
      throw new Error(
        'uipro CLI is required. Install it with: npm install -g uipro-cli'
      );
    }
    
    if (this.isInstalled() && !force) {
      throw new Error(`${this.name} is already installed. Use --force to reinstall.`);
    }
    
    if (force && this.isInstalled()) {
      await this.remove(false);
    }
    
    this.ensurePlatformDirs(platforms);
    
    // 使用 uipro CLI 安装
    for (const platform of platforms) {
      const aiArg = this.getPlatformArg(platform);
      
      console.log(`Installing ${this.name} for ${platform}...`);
      
      const cmd = force 
        ? `uipro init --ai ${aiArg} --force`
        : `uipro init --ai ${aiArg}`;
      
      execSync(cmd, { stdio: 'inherit' });
    }
    
    // 获取版本信息
    let version = 'unknown';
    try {
      const output = execSync('uipro --version', { encoding: 'utf-8' }).trim();
      version = output.replace(/^v?/, '');
    } catch {
      // ignore
    }
    
    const primaryPath = path.join(PATHS[platforms[0]].skills, 'ui-ux-pro-max');
    const now = new Date().toISOString();
    
    this.recordInstall({
      method: 'cli',
      targetPath: primaryPath,
      version,
    }, platforms);
    
    console.log(`✓ ${this.name} installed successfully!`);
  }
  
  async update(): Promise<void> {
    const info = this.getInfo();
    if (!info) {
      throw new Error(`${this.name} is not installed.`);
    }
    
    if (!this.isUiproInstalled()) {
      throw new Error(
        'uipro CLI is required. Install it with: npm install -g uipro-cli'
      );
    }
    
    console.log(`Updating ${this.name}...`);
    
    for (const platform of info.platforms) {
      const aiArg = this.getPlatformArg(platform);
      console.log(`Updating for ${platform}...`);
      execSync(`uipro update --ai ${aiArg}`, { stdio: 'inherit' });
    }
    
    let version = 'unknown';
    try {
      const output = execSync('uipro --version', { encoding: 'utf-8' }).trim();
      version = output.replace(/^v?/, '');
    } catch {
      // ignore
    }
    
    const now = new Date().toISOString();
    this.recordInstall({
      version,
      updatedAt: now,
    }, info.platforms);
    
    console.log(`✓ ${this.name} updated to version ${version}`);
  }
  
  async remove(purge = false): Promise<void> {
    const info = this.getInfo();
    
    if (info?.platforms) {
      for (const platform of info.platforms) {
        const targetPath = path.join(PATHS[platform].skills, 'ui-ux-pro-max');
        if (fs.existsSync(targetPath)) {
          fs.rmSync(targetPath, { recursive: true, force: true });
        }
      }
    }
    
    this.recordRemove();
    console.log(`✓ ${this.name} removed.`);
  }
}