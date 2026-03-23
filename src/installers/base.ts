// src/installers/base.ts
import { SkillInstaller, SkillRecord, Platform } from '../types/index.js';
import { PATHS, ensureDirectories } from '../core/platform.js';
import { registerSkill, unregisterSkill, getSkillInfo, isSkillInstalled } from '../core/registry.js';

export abstract class BaseInstaller implements SkillInstaller {
  abstract name: string;
  abstract repoUrl: string;
  abstract description: string;
  
  abstract install(platforms: Platform[], force?: boolean): Promise<void>;
  abstract update(): Promise<void>;
  abstract remove(purge?: boolean): Promise<void>;
  
  isInstalled(platforms?: Platform[]): boolean {
    return isSkillInstalled(this.name, platforms);
  }
  
  getInfo(): SkillRecord | null {
    return getSkillInfo(this.name);
  }
  
  protected recordInstall(record: Partial<SkillRecord>, platforms: Platform[]): void {
    const now = new Date().toISOString();
    const fullRecord: SkillRecord = {
      name: this.name,
      repoUrl: this.repoUrl,
      method: 'clone',
      targetPath: '',
      installedAt: now,
      updatedAt: now,
      platforms,
      ...record,
    };
    registerSkill(fullRecord);
  }
  
  protected recordRemove(): void {
    unregisterSkill(this.name);
  }
  
  protected ensurePlatformDirs(platforms: Platform[]): void {
    ensureDirectories(platforms);
  }
}