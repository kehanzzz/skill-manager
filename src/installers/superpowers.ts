// src/installers/superpowers.ts
import fs from 'fs';
import path from 'path';
import { Platform } from '../types/index.js';
import { BaseInstaller } from './base.js';
import { PATHS } from '../core/platform.js';
import { clone, pull, getCommitSha, isGitInstalled } from '../core/git.js';
import { createSymlink, removeSymlink } from '../core/symlink.js';

export class SuperpowersInstaller extends BaseInstaller {
  name = 'superpowers';
  repoUrl = 'https://github.com/obra/superpowers.git';
  description = 'Superpowers skills for AI coding assistants (TDD, debugging, planning, etc.)';
  
  private getClonePath(): string {
    return path.join(PATHS.opencode.root, 'superpowers');
  }
  
  async install(platforms: Platform[], force = false): Promise<void> {
    if (!isGitInstalled()) {
      throw new Error('Git is required. Please install Git first.');
    }
    
    const clonePath = this.getClonePath();
    
    // 检查是否已安装
    if (this.isInstalled() && !force) {
      throw new Error(`${this.name} is already installed. Use --force to reinstall.`);
    }
    
    // 强制重装时先移除
    if (force && this.isInstalled()) {
      await this.remove(false);
    }
    
    this.ensurePlatformDirs(platforms);
    
    // Clone 仓库
    if (!fs.existsSync(clonePath)) {
      console.log(`Cloning ${this.repoUrl}...`);
      clone(this.repoUrl, clonePath);
    }
    
    // 创建 plugin 符号链接 (仅 opencode)
    if (platforms.includes('opencode')) {
      const pluginSource = path.join(clonePath, '.opencode', 'plugins', 'superpowers.js');
      const pluginTarget = path.join(PATHS.opencode.plugins, 'superpowers.js');
      
      console.log(`Creating plugin symlink...`);
      createSymlink(pluginSource, pluginTarget);
    }
    
    // 创建 skills 符号链接
    for (const platform of platforms) {
      const skillsSource = path.join(clonePath, 'skills');
      const skillsTarget = path.join(PATHS[platform].skills, 'superpowers');
      
      console.log(`Creating skills symlink for ${platform}...`);
      createSymlink(skillsSource, skillsTarget);
    }
    
    // 记录安装
    const commit = getCommitSha(clonePath);
    const primaryPath = path.join(PATHS[platforms[0]].skills, 'superpowers');
    
    this.recordInstall({
      method: 'symlink',
      clonePath,
      targetPath: primaryPath,
      commit,
    }, platforms);
    
    console.log(`✓ ${this.name} installed successfully!`);
  }
  
  async update(): Promise<void> {
    const info = this.getInfo();
    if (!info) {
      throw new Error(`${this.name} is not installed.`);
    }
    
    const clonePath = info.clonePath;
    if (!clonePath) {
      throw new Error('Clone path not found in registry.');
    }
    
    console.log(`Updating ${this.name}...`);
    pull(clonePath);
    
    const commit = getCommitSha(clonePath);
    const now = new Date().toISOString();
    
    this.recordInstall({
      commit,
      updatedAt: now,
    }, info.platforms);
    
    console.log(`✓ ${this.name} updated to commit ${commit.slice(0, 7)}`);
  }
  
  async remove(purge = false): Promise<void> {
    const info = this.getInfo();
    
    // 移除符号链接
    if (info?.platforms) {
      for (const platform of info.platforms) {
        const skillsLink = path.join(PATHS[platform].skills, 'superpowers');
        removeSymlink(skillsLink);
        
        if (platform === 'opencode') {
          const pluginLink = path.join(PATHS.opencode.plugins, 'superpowers.js');
          removeSymlink(pluginLink);
        }
      }
    }
    
    // 可选：删除克隆
    if (purge && info?.clonePath) {
      console.log(`Removing clone directory: ${info.clonePath}`);
      fs.rmSync(info.clonePath, { recursive: true, force: true });
    }
    
    this.recordRemove();
    console.log(`✓ ${this.name} removed.`);
  }
}