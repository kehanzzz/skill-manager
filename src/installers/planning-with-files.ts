// src/installers/planning-with-files.ts
import fs from 'fs';
import path from 'path';
import { Platform } from '../types/index.js';
import { BaseInstaller } from './base.js';
import { PATHS } from '../core/platform.js';
import { clone, pull, getCommitSha, isGitInstalled } from '../core/git.js';

export class PlanningWithFilesInstaller extends BaseInstaller {
  name = 'planning-with-files';
  repoUrl = 'https://github.com/OthmanAdi/planning-with-files.git';
  description = 'Manus-style file-based planning for complex tasks';
  
  private getClonePath(): string {
    return path.join(PATHS.reposDir, 'planning-with-files');
  }
  
  async install(platforms: Platform[], force = false): Promise<void> {
    if (!isGitInstalled()) {
      throw new Error('Git is required. Please install Git first.');
    }
    
    const clonePath = this.getClonePath();
    
    if (this.isInstalled() && !force) {
      throw new Error(`${this.name} is already installed. Use --force to reinstall.`);
    }
    
    if (force && this.isInstalled()) {
      await this.remove(false);
    }
    
    this.ensurePlatformDirs(platforms);
    
    // Clone 仓库
    if (!fs.existsSync(clonePath)) {
      console.log(`Cloning ${this.repoUrl}...`);
      clone(this.repoUrl, clonePath);
    } else {
      console.log(`Repository already exists, pulling latest...`);
      pull(clonePath);
    }
    
    // 复制 skill 文件到各平台
    for (const platform of platforms) {
      const sourcePath = path.join(clonePath, '.opencode', 'skills', 'planning-with-files');
      const targetPath = path.join(PATHS[platform].skills, 'planning-with-files');
      
      console.log(`Copying skill files to ${platform}...`);
      
      // 删除已存在的目录
      if (fs.existsSync(targetPath)) {
        fs.rmSync(targetPath, { recursive: true, force: true });
      }
      
      // 复制目录
      fs.cpSync(sourcePath, targetPath, { recursive: true });
    }
    
    // 记录安装
    const commit = getCommitSha(clonePath);
    const primaryPath = path.join(PATHS[platforms[0]].skills, 'planning-with-files');
    
    this.recordInstall({
      method: 'clone',
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
    
    // 重新复制文件
    for (const platform of info.platforms) {
      const sourcePath = path.join(clonePath, '.opencode', 'skills', 'planning-with-files');
      const targetPath = path.join(PATHS[platform].skills, 'planning-with-files');
      
      console.log(`Updating skill files for ${platform}...`);
      
      if (fs.existsSync(targetPath)) {
        fs.rmSync(targetPath, { recursive: true, force: true });
      }
      
      fs.cpSync(sourcePath, targetPath, { recursive: true });
    }
    
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
    
    if (info?.platforms) {
      for (const platform of info.platforms) {
        const targetPath = path.join(PATHS[platform].skills, 'planning-with-files');
        if (fs.existsSync(targetPath)) {
          fs.rmSync(targetPath, { recursive: true, force: true });
        }
      }
    }
    
    if (purge && info?.clonePath) {
      console.log(`Removing clone directory: ${info.clonePath}`);
      fs.rmSync(info.clonePath, { recursive: true, force: true });
    }
    
    this.recordRemove();
    console.log(`✓ ${this.name} removed.`);
  }
}