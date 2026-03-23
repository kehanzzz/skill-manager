// src/installers/ui-ux-pro-max.ts
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { Platform } from '../types/index.js';
import { BaseInstaller } from './base.js';
import { PATHS } from '../core/platform.js';
import { ensureInstalled, getEnvWithBinPath } from '../core/deps.js';

export class UiUxProMaxInstaller extends BaseInstaller {
  name = 'ui-ux-pro-max';
  repoUrl = 'git@github.com:nextlevelbuilder/ui-ux-pro-max-skill.git';
  description = 'UI/UX design intelligence with searchable database';
  
  private static UIPRO_SKILL_DIR = 'ui-ux-pro-max';
  
  private getPlatformArg(platform: Platform): string {
    const map: Record<Platform, string> = {
      opencode: 'opencode',
      claudecode: 'claude',
      generic: 'opencode', // uipro 不支持 generic，使用 opencode
    };
    return map[platform];
  }
  
  private getSourceDir(tmpDir: string, platform: Platform): string {
    // uipro init --ai opencode 会创建 .opencode/skills/ui-ux-pro-max/
    const platformDir = platform === 'claudecode' ? '.claude' : '.opencode';
    return path.join(tmpDir, platformDir, 'skills', UiUxProMaxInstaller.UIPRO_SKILL_DIR);
  }
  
  async install(platforms: Platform[], force = false): Promise<void> {
    await ensureInstalled('uipro-cli');

    if (this.isInstalled(platforms) && !force) {
      throw new Error(`${this.name} is already installed on ${platforms.join(', ')}. Use --force to reinstall.`);
    }

    if (force && this.isInstalled()) {
      await this.remove(false);
    }
    
    this.ensurePlatformDirs(platforms);
    
    const env = getEnvWithBinPath('uipro-cli');
    
    for (const platform of platforms) {
      const aiArg = this.getPlatformArg(platform);
      const targetDir = PATHS[platform].skills;
      const targetPath = path.join(targetDir, UiUxProMaxInstaller.UIPRO_SKILL_DIR);
      
      console.log(`Installing ${this.name} for ${platform}...`);
      
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'uipro-install-'));
      
      try {
        const cmd = force 
          ? `uipro init --ai ${aiArg} --force`
          : `uipro init --ai ${aiArg}`;
        
        execSync(cmd, { stdio: 'inherit', env, cwd: tmpDir });
        
        const sourcePath = this.getSourceDir(tmpDir, platform);
        
        if (!fs.existsSync(sourcePath)) {
          throw new Error(`uipro init did not create expected directory: ${sourcePath}`);
        }
        
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        
        fs.cpSync(sourcePath, targetPath, { recursive: true });
        
        console.log(`✓ Installed to ${targetPath}`);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    }
    
    let version = 'unknown';
    try {
      const output = execSync('uipro --version', { encoding: 'utf-8', env }).trim();
      version = output.replace(/^v?/, '');
    } catch {
      // ignore
    }
    
    const primaryPath = path.join(PATHS[platforms[0]].skills, 'ui-ux-pro-max');
    
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
    
    await ensureInstalled('uipro-cli');
    
    console.log(`Updating ${this.name}...`);
    
    const env = getEnvWithBinPath('uipro-cli');
    
    for (const platform of info.platforms) {
      const aiArg = this.getPlatformArg(platform);
      const targetDir = PATHS[platform].skills;
      const targetPath = path.join(targetDir, UiUxProMaxInstaller.UIPRO_SKILL_DIR);
      
      console.log(`Updating for ${platform}...`);
      
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'uipro-update-'));
      
      try {
        execSync(`uipro update --ai ${aiArg}`, { stdio: 'inherit', env, cwd: tmpDir });
        
        const sourcePath = this.getSourceDir(tmpDir, platform);
        
        if (!fs.existsSync(sourcePath)) {
          throw new Error(`uipro update did not create expected directory: ${sourcePath}`);
        }
        
        if (fs.existsSync(targetPath)) {
          fs.rmSync(targetPath, { recursive: true, force: true });
        }
        
        fs.cpSync(sourcePath, targetPath, { recursive: true });
        
        console.log(`✓ Updated at ${targetPath}`);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    }
    
    let version = 'unknown';
    try {
      const output = execSync('uipro --version', { encoding: 'utf-8', env }).trim();
      version = output.replace(/^v?/, '');
    } catch {
      // ignore
    }
    
    const now = new Date().toISOString();
    const primaryPath = path.join(PATHS[info.platforms[0]].skills, UiUxProMaxInstaller.UIPRO_SKILL_DIR);
    this.recordInstall({
      targetPath: primaryPath,
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